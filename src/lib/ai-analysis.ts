/**
 * AI Analysis service — calls OpenRouter with Gemini to analyze
 * social media comments across all platforms.
 */
import { loadApiKeys, loadSelectedModel } from "@/lib/settings";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/* ── Types ── */

export interface AnalyzedItem {
  index: number;
  text: string;
  platform: string;
  sentiment: "positive" | "negative" | "neutral";
  emotion: string;
  confidence: number;
  keywords: string[];
  reason: string;
}

export interface AiReportTheme {
  name: string;
  description: string;
  percentage: number;
  sentiment: string;
}

export interface AiReportIssue {
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
  count: number;
}

export interface AiReportInsight {
  title: string;
  description: string;
}

export interface AiReportRecommendation {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

export interface AiReport {
  themes: AiReportTheme[];
  issues: AiReportIssue[];
  insights: AiReportInsight[];
  recommendations: AiReportRecommendation[];
  overall_summary: string;
  sentiment_analysis: string;
}

export interface AnalysisResult {
  items: AnalyzedItem[];
  report: AiReport;
  sentimentCounts: Record<string, number>;
  emotionCounts: Record<string, number>;
  topKeywords: { word: string; count: number }[];
  model: string;
  analyzedAt: string;
}

/* ── Helpers ── */

function safeParseJSON(raw: string): any {
  try {
    return JSON.parse(raw);
  } catch {
    // Try extracting JSON from markdown code blocks
    const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      try { return JSON.parse(match[1].trim()); } catch { /* fall through */ }
    }
    // Try finding first { ... } or [ ... ]
    const braceMatch = raw.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (braceMatch) {
      try { return JSON.parse(braceMatch[1]); } catch { /* fall through */ }
    }
    return null;
  }
}

export interface CommentInput {
  text: string;
  platform: string;
  author?: string;
  date?: string;
}

/* ── Phase 1: Sentiment Analysis (batched) ── */

const BATCH_SIZE = 15;

async function analyzeBatch(
  comments: CommentInput[],
  apiKey: string,
  modelId: string,
): Promise<AnalyzedItem[]> {
  const numbered = comments
    .map((c, i) => `[${i + 1}] (${c.platform}) ${c.text}`)
    .join("\n");

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 4096,
      messages: [
        {
          role: "system",
          content: `أنت محلل مشاعر متخصص في النصوص العربية لمنصات التواصل الاجتماعي.
حلل التعليقات المرقمة وأرجع JSON فقط.

لكل تعليق أرجع:
- index: رقم التعليق (يبدأ من 1)
- sentiment: "positive" أو "negative" أو "neutral"
- confidence: رقم من 0 إلى 1
- emotion: أحد هذه: "فرح", "غضب", "حزن", "مفاجأة", "محايد", "حماس", "إحباط", "قلق", "سخرية"
- keywords: مصفوفة 2-4 كلمات مفتاحية مستخلصة
- reason: شرح مختصر بالعربية لسبب التصنيف

أجب بصيغة JSON فقط: {"results":[...]}`,
        },
        { role: "user", content: numbered },
      ],
      response_format: { type: "json_object" },
      temperature: 0,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`OpenRouter API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "{}";
  const parsed = safeParseJSON(content);
  const results = parsed?.results || parsed?.tweets || [];

  return results.map((r: any, i: number) => ({
    index: r.index ?? i + 1,
    text: comments[i]?.text || "",
    platform: comments[i]?.platform || "",
    sentiment: r.sentiment || "neutral",
    emotion: r.emotion || "محايد",
    confidence: r.confidence ?? 0.5,
    keywords: Array.isArray(r.keywords) ? r.keywords : [],
    reason: r.reason || "",
  }));
}

/* ── Phase 2: Report Generation ── */

async function generateReport(
  items: AnalyzedItem[],
  apiKey: string,
  modelId: string,
): Promise<AiReport> {
  const total = items.length;
  const pos = items.filter((i) => i.sentiment === "positive").length;
  const neg = items.filter((i) => i.sentiment === "negative").length;
  const neu = items.filter((i) => i.sentiment === "neutral").length;

  // Top keywords
  const kwMap: Record<string, number> = {};
  for (const item of items) {
    for (const kw of item.keywords) {
      kwMap[kw] = (kwMap[kw] || 0) + 1;
    }
  }
  const topKw = Object.entries(kwMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([w]) => w);

  // Top emotions
  const emMap: Record<string, number> = {};
  for (const item of items) {
    emMap[item.emotion] = (emMap[item.emotion] || 0) + 1;
  }
  const topEm = Object.entries(emMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([e]) => e);

  // Platform breakdown
  const platMap: Record<string, number> = {};
  for (const item of items) {
    platMap[item.platform] = (platMap[item.platform] || 0) + 1;
  }
  const platBreakdown = Object.entries(platMap)
    .map(([p, c]) => `${p}: ${c}`)
    .join("، ");

  // Samples
  const samplePos = items
    .filter((i) => i.sentiment === "positive")
    .slice(0, 5)
    .map((i) => i.text);
  const sampleNeg = items
    .filter((i) => i.sentiment === "negative")
    .slice(0, 5)
    .map((i) => i.text);

  const prompt = `أنت محلل استراتيجي متخصص في وسائل التواصل الاجتماعي لشركة ثمانية. أنشئ تقريراً تحليلياً شاملاً.

الإحصائيات:
- إجمالي التعليقات: ${total}
- إيجابي: ${pos} (${Math.round((pos / total) * 100)}%)
- سلبي: ${neg} (${Math.round((neg / total) * 100)}%)
- محايد: ${neu} (${Math.round((neu / total) * 100)}%)
- المنصات: ${platBreakdown}

أكثر الكلمات تكراراً: ${topKw.join("، ")}
أكثر المشاعر: ${topEm.join("، ")}

عينة إيجابية:
${samplePos.map((t, i) => `${i + 1}. ${t}`).join("\n")}

عينة سلبية:
${sampleNeg.map((t, i) => `${i + 1}. ${t}`).join("\n")}

أعطني تحليلاً بصيغة JSON:
{"themes":[{"name":"...","description":"...","percentage":25,"sentiment":"..."}],"issues":[{"title":"...","description":"...","severity":"high","count":15}],"insights":[{"title":"...","description":"..."}],"recommendations":[{"title":"...","description":"...","priority":"high"}],"overall_summary":"...","sentiment_analysis":"..."}

3-5 لكل قسم. بالعربية. ركز على رؤى قابلة للتنفيذ وتوصيات عملية للفريق.
أجب بصيغة JSON فقط.`;

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0,
    }),
  });

  if (!res.ok) throw new Error(`Report generation failed: ${res.status}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "{}";
  const parsed = safeParseJSON(content);

  return {
    themes: parsed?.themes || [],
    issues: parsed?.issues || [],
    insights: parsed?.insights || [],
    recommendations: parsed?.recommendations || [],
    overall_summary: parsed?.overall_summary || "",
    sentiment_analysis: parsed?.sentiment_analysis || "",
  };
}

/* ── Main pipeline ── */

export type AnalysisPhase = "idle" | "fetching" | "analyzing" | "generating-report" | "done" | "error";

export interface AnalysisProgress {
  phase: AnalysisPhase;
  percent: number;
  message: string;
  error?: string;
}

type ProgressCallback = (progress: AnalysisProgress) => void;

export async function runFullAnalysis(
  comments: CommentInput[],
  onProgress: ProgressCallback,
): Promise<AnalysisResult> {
  const keys = loadApiKeys();
  if (!keys.openrouter) {
    throw new Error("مفتاح OpenRouter غير موجود. أضف المفتاح في صفحة الإعدادات.");
  }

  const modelId = loadSelectedModel();

  // Phase 1: Batch sentiment analysis
  onProgress({ phase: "analyzing", percent: 0, message: "جاري تحليل المشاعر..." });

  const batches: CommentInput[][] = [];
  for (let i = 0; i < comments.length; i += BATCH_SIZE) {
    batches.push(comments.slice(i, i + BATCH_SIZE));
  }

  const allItems: AnalyzedItem[] = [];
  const PARALLEL = 3;

  for (let i = 0; i < batches.length; i += PARALLEL) {
    const chunk = batches.slice(i, i + PARALLEL);
    const results = await Promise.allSettled(
      chunk.map((batch) => analyzeBatch(batch, keys.openrouter, modelId)),
    );

    for (const r of results) {
      if (r.status === "fulfilled") {
        allItems.push(...r.value);
      } else {
        console.error("[AI Analysis] Batch error:", r.reason);
      }
    }

    const done = Math.min(i + PARALLEL, batches.length);
    const pct = Math.round((done / batches.length) * 70); // 0-70% for analysis
    onProgress({
      phase: "analyzing",
      percent: pct,
      message: `تحليل الدفعة ${done} من ${batches.length}...`,
    });
  }

  // Phase 2: Generate report
  onProgress({ phase: "generating-report", percent: 75, message: "جاري إنشاء التقرير الشامل..." });
  const report = await generateReport(allItems, keys.openrouter, modelId);

  // Aggregate stats
  const sentimentCounts: Record<string, number> = {};
  const emotionCounts: Record<string, number> = {};
  const kwMap: Record<string, number> = {};

  for (const item of allItems) {
    sentimentCounts[item.sentiment] = (sentimentCounts[item.sentiment] || 0) + 1;
    emotionCounts[item.emotion] = (emotionCounts[item.emotion] || 0) + 1;
    for (const kw of item.keywords) {
      kwMap[kw] = (kwMap[kw] || 0) + 1;
    }
  }

  const topKeywords = Object.entries(kwMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([word, count]) => ({ word, count }));

  onProgress({ phase: "done", percent: 100, message: "اكتمل التحليل!" });

  return {
    items: allItems,
    report,
    sentimentCounts,
    emotionCounts,
    topKeywords,
    model: modelId,
    analyzedAt: new Date().toISOString(),
  };
}

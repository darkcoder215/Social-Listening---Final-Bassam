/**
 * Settings storage utility – persists API keys, model selection,
 * and custom analysis metrics in localStorage.
 */

const STORAGE_KEY = "thmanyah-api-keys";
const MODEL_STORAGE_KEY = "thmanyah-selected-model";
const METRICS_STORAGE_KEY = "thmanyah-analysis-metrics";

export interface ApiKeys {
  apify: string;
  openrouter: string;
}

/* ── AI Model catalog ── */

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  color: string;
}

export const AI_MODELS: AIModel[] = [
  { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "Google", description: "نموذج متقدم مع نافذة سياق 1M توكن — الأفضل للتحليلات الكبيرة", color: "#4285F4" },
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google", description: "سريع واقتصادي — مناسب للتحليلات السريعة", color: "#34A853" },
  { id: "anthropic/claude-sonnet-4", name: "Claude Sonnet 4", provider: "Anthropic", description: "تحليل دقيق وعميق للنصوص العربية", color: "#D97706" },
  { id: "anthropic/claude-haiku-4", name: "Claude Haiku 4", provider: "Anthropic", description: "سريع واقتصادي مع جودة عالية", color: "#F59E0B" },
  { id: "openai/gpt-4o", name: "GPT-4o", provider: "OpenAI", description: "نموذج متعدد الوسائط من OpenAI", color: "#10A37F" },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", description: "أصغر وأسرع وأقل تكلفة", color: "#10A37F" },
  { id: "meta-llama/llama-4-maverick", name: "Llama 4 Maverick", provider: "Meta", description: "نموذج مفتوح المصدر عالي الأداء", color: "#0668E1" },
  { id: "deepseek/deepseek-r1", name: "DeepSeek R1", provider: "DeepSeek", description: "نموذج تفكير عميق — ممتاز للتحليل المنطقي", color: "#5B6AE0" },
];

export function loadSelectedModel(): string {
  try {
    return localStorage.getItem(MODEL_STORAGE_KEY) || AI_MODELS[0].id;
  } catch {
    return AI_MODELS[0].id;
  }
}

export function saveSelectedModel(modelId: string): void {
  localStorage.setItem(MODEL_STORAGE_KEY, modelId);
}

/* ── Custom Analysis Metrics ── */

export interface AnalysisMetric {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  type: "text" | "number" | "category" | "list";
  categoryOptions?: string[];
  enabled: boolean;
}

/** Built-in metrics that are always available */
export const DEFAULT_METRICS: AnalysisMetric[] = [
  { id: "sentiment", name: "المشاعر", nameEn: "sentiment", description: "تصنيف المشاعر (إيجابي / سلبي / محايد)", type: "category", categoryOptions: ["positive", "negative", "neutral"], enabled: true },
  { id: "confidence", name: "مستوى الثقة", nameEn: "confidence", description: "نسبة ثقة التصنيف من 0 إلى 1", type: "number", enabled: true },
  { id: "emotion", name: "العاطفة", nameEn: "emotion", description: "العاطفة السائدة (فرح، غضب، حزن، إلخ)", type: "category", categoryOptions: ["فرح", "غضب", "حزن", "مفاجأة", "محايد", "حماس", "إحباط", "قلق"], enabled: true },
  { id: "reason", name: "السبب", nameEn: "reason", description: "شرح مختصر لسبب التصنيف", type: "text", enabled: true },
  { id: "keywords", name: "الكلمات المفتاحية", nameEn: "keywords", description: "كلمات مفتاحية مستخلصة من النص", type: "list", enabled: true },
];

export function loadMetrics(): AnalysisMetric[] {
  try {
    const raw = localStorage.getItem(METRICS_STORAGE_KEY);
    if (!raw) return [...DEFAULT_METRICS];
    const custom = JSON.parse(raw) as AnalysisMetric[];
    // Merge: keep defaults + add custom
    const defaultIds = DEFAULT_METRICS.map((m) => m.id);
    const defaults = DEFAULT_METRICS.map((d) => {
      const saved = custom.find((c) => c.id === d.id);
      return saved ? { ...d, enabled: saved.enabled } : d;
    });
    const extras = custom.filter((c) => !defaultIds.includes(c.id));
    return [...defaults, ...extras];
  } catch {
    return [...DEFAULT_METRICS];
  }
}

export function saveMetrics(metrics: AnalysisMetric[]): void {
  localStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(metrics));
}

/** Build JSON schema properties for enabled metrics (used by edge function) */
export function buildMetricsSchema(metrics: AnalysisMetric[]): Record<string, any> {
  const props: Record<string, any> = { index: { type: "number", description: "رقم التغريدة" } };
  const required = ["index"];

  for (const m of metrics.filter((m) => m.enabled)) {
    required.push(m.nameEn);
    switch (m.type) {
      case "text":
        props[m.nameEn] = { type: "string", description: m.description };
        break;
      case "number":
        props[m.nameEn] = { type: "number", description: m.description };
        break;
      case "category":
        props[m.nameEn] = { type: "string", enum: m.categoryOptions, description: m.description };
        break;
      case "list":
        props[m.nameEn] = { type: "array", items: { type: "string" }, description: m.description };
        break;
    }
  }

  return { properties: props, required };
}

/** Build system prompt addendum describing custom metrics */
export function buildMetricsPromptSection(metrics: AnalysisMetric[]): string {
  const enabled = metrics.filter((m) => m.enabled);
  if (enabled.length === 0) return "";
  const lines = enabled.map((m) => `- ${m.nameEn}: ${m.description}`);
  return `\nمعايير التحليل المطلوبة لكل تغريدة:\n${lines.join("\n")}`;
}

/* ── API Keys (unchanged) ── */

const EMPTY: ApiKeys = { apify: "", openrouter: "" };

export function loadApiKeys(): ApiKeys {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw);
    return {
      apify: typeof parsed.apify === "string" ? parsed.apify : "",
      openrouter: typeof parsed.openrouter === "string" ? parsed.openrouter : "",
    };
  } catch {
    return { ...EMPTY };
  }
}

export function saveApiKeys(keys: ApiKeys): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

export function hasRequiredKeys(): { apify: boolean; openrouter: boolean; all: boolean } {
  const keys = loadApiKeys();
  const apify = keys.apify.trim().length > 0;
  const openrouter = keys.openrouter.trim().length > 0;
  return { apify, openrouter, all: apify && openrouter };
}

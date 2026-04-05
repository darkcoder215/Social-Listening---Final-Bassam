/**
 * AI Analysis service — analyzes social media comments
 * across all platforms using AI.
 */
import { loadSelectedModel, loadMetrics, buildMetricsPromptSection } from "@/lib/settings";

const AI_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const AI_API_KEY = "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";

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

/* ── Sample Data (fallback when no Supabase data) ── */

export const SAMPLE_COMMENTS: CommentInput[] = [
  // ═══ TikTok (20) ═══
  { text: "بودكاست ثمانية من أفضل البودكاستات العربية، محتوى راقي ومفيد جداً 👏", platform: "tiktok", author: "أحمد", date: "2025-03-15" },
  { text: "فنجان أفضل بودكاست عربي بدون منافس! كل حلقة تفتح آفاق جديدة 🔥", platform: "tiktok", author: "ريم", date: "2025-03-14" },
  { text: "أسلوب التقديم ممتاز والإنتاج عالي الجودة، استمروا على هالمستوى", platform: "tiktok", author: "هند", date: "2025-03-13" },
  { text: "مقاطعكم القصيرة على تيك توك تجنن، تخلي الواحد يبي يسمع الحلقة كاملة", platform: "tiktok", author: "عمر", date: "2025-03-12" },
  { text: "للأسف المقاطع على تيك توك مجرد تكرار، ما فيه محتوى حصري", platform: "tiktok", author: "دانة", date: "2025-03-11" },
  { text: "كل يوم أتابع ثمانية على تيك توك، محتوى مميز يستاهل الدعم 💚", platform: "tiktok", author: "يوسف", date: "2025-03-10" },
  { text: "أحس المونتاج في المقاطع صار أقل جودة من قبل، وش السالفة؟", platform: "tiktok", author: "سلمى", date: "2025-03-09" },
  { text: "ثمانية تثبت إن المحتوى العربي يقدر ينافس عالمياً 🌟", platform: "tiktok", author: "طارق", date: "2025-03-08" },
  { text: "وش رأيكم تسوون سلسلة عن التاريخ السعودي؟ بيكون محتوى خرافي", platform: "tiktok", author: "منال", date: "2025-03-07" },
  { text: "الخوارزمية ما تعرض لي محتواكم كثير، ودي أشوفكم أكثر", platform: "tiktok", author: "بدر", date: "2025-03-06" },
  { text: "أنا مدمن على مقاطع ثمانية القصيرة، كل مقطع فيه فكرة تستحق التأمل", platform: "tiktok", author: "جنان", date: "2025-03-05" },
  { text: "المقطع عن العادات اليومية غيّر روتيني بالكامل، شكراً ثمانية 💪", platform: "tiktok", author: "عادل", date: "2025-03-04" },
  { text: "ياليت تنزلون مقاطع أكثر عن العلوم والفضاء، الجمهور يحبها", platform: "tiktok", author: "ميساء", date: "2025-03-03" },
  { text: "الموسيقى اللي تستخدمونها في المقاطع مزعجة وما تناسب المحتوى", platform: "tiktok", author: "عبدالرحمن", date: "2025-03-02" },
  { text: "ردكم على التعليقات بالفيديو شي جميل، يحسسنا إنكم قريبين منا", platform: "tiktok", author: "ريناد", date: "2025-03-01" },
  { text: "أشوف ثمانية تتطور كل سنة أحسن من اللي قبلها، مستقبل مشرق 🌙", platform: "tiktok", author: "وسام", date: "2025-02-28" },
  { text: "المقاطع اللي فيها إحصائيات ورسوم بيانية أفضل بكثير من الكلام العادي", platform: "tiktok", author: "لطيفة", date: "2025-02-27" },
  { text: "نبي تعاون بين ثمانية ومبدعين سعوديين آخرين، بيطلع شي خرافي", platform: "tiktok", author: "حمزة", date: "2025-02-26" },
  { text: "صوت المعلق في بعض المقاطع غير واضح مع الموسيقى الخلفية", platform: "tiktok", author: "سارة ع", date: "2025-02-25" },
  { text: "ثمانية هي الأمل الحقيقي للمحتوى العربي الهادف على السوشال ميديا ✨", platform: "tiktok", author: "أسامة", date: "2025-02-24" },
  // ═══ YouTube (20) ═══
  { text: "الحلقة الأخيرة مع الضيف كانت مملة صراحة، ما استفدت شي", platform: "youtube", author: "سارة", date: "2025-03-15" },
  { text: "أتمنى تحسنون جودة الصوت في البودكاست، أحياناً ما يكون واضح", platform: "youtube", author: "خالد", date: "2025-03-14" },
  { text: "حلقة اليوم عن ريادة الأعمال كانت ملهمة جداً، شكراً عبدالرحمن 🙏", platform: "youtube", author: "محمد", date: "2025-03-13" },
  { text: "حلقة فنجان مع المخرج السعودي كانت من أجمل الحلقات، إبداع حقيقي", platform: "youtube", author: "نوف", date: "2025-03-12" },
  { text: "الترجمة الإنجليزية للحلقات ممتازة، ساعدتني أشارك المحتوى مع أصدقائي الأجانب", platform: "youtube", author: "سلطان", date: "2025-03-11" },
  { text: "ليه صرتوا تطولون المقدمة كثير؟ أول كانت مختصرة وحلوة", platform: "youtube", author: "هيا", date: "2025-03-10" },
  { text: "المحتوى التعليمي عندكم ناقص، أتمنى تركزون أكثر على المحتوى العلمي", platform: "youtube", author: "عبدالعزيز", date: "2025-03-09" },
  { text: "إنتاج سينمائي بمعنى الكلمة! التصوير والإضاءة على مستوى عالمي 🎬", platform: "youtube", author: "لمى", date: "2025-03-08" },
  { text: "حلقة الصحة النفسية غيّرت نظرتي لأشياء كثيرة، شكراً من القلب", platform: "youtube", author: "ناصر", date: "2025-03-07" },
  { text: "الإعلانات في نص الحلقة مزعجة جداً، تقطع التركيز بشكل سيء", platform: "youtube", author: "رهف", date: "2025-03-06" },
  { text: "حلقة الاقتصاد السعودي كانت من أهم الحلقات اللي شفتها هالسنة 📊", platform: "youtube", author: "عمار", date: "2025-03-05" },
  { text: "الضيف ما كان متمكن من الموضوع، كان واضح إنه ما حضّر كويس", platform: "youtube", author: "بشاير", date: "2025-03-04" },
  { text: "الحلقة عن الذكاء الاصطناعي كانت محتاجة ضيف متخصص أكثر", platform: "youtube", author: "فارس", date: "2025-03-03" },
  { text: "ثمانية هي القناة الوحيدة اللي أشترك فيها وأفعّل الجرس 🔔", platform: "youtube", author: "رزان", date: "2025-03-02" },
  { text: "الفلوق حق عبدالرحمن في اليابان كان من أحلى المحتويات 🇯🇵", platform: "youtube", author: "مازن", date: "2025-03-01" },
  { text: "نبيكم تزيدون الحلقات الشهرية، حلقة واحدة في الأسبوع ما تكفي", platform: "youtube", author: "حنين", date: "2025-02-28" },
  { text: "أحس النقاشات صارت سطحية مقارنة بالحلقات القديمة، عمّقوا أكثر", platform: "youtube", author: "تميم", date: "2025-02-27" },
  { text: "تنسيق الإضاءة والمكان في الاستوديو الجديد خرافي! 🎥", platform: "youtube", author: "شيماء", date: "2025-02-26" },
  { text: "أفضل شي إنكم تعطون الضيف وقت كافي يشرح وجهة نظره بدون استعجال", platform: "youtube", author: "أيمن", date: "2025-02-25" },
  { text: "كنت أتمنى الحلقة تكون أطول، الموضوع كان يستاهل تعمّق أكثر", platform: "youtube", author: "نجلاء", date: "2025-02-24" },
  // ═══ Instagram (20) ═══
  { text: "شكراً ثمانية على المحتوى الجميل، كل حلقة أحسن من اللي قبلها ❤️", platform: "instagram", author: "نورة", date: "2025-03-15" },
  { text: "سؤال: ليه توقفتوا عن نشر المقاطع القصيرة؟ كانت ممتازة", platform: "instagram", author: "عبدالله", date: "2025-03-14" },
  { text: "التصميم الجديد للبراند حلو مرة، يعطي طاقة إيجابية 💚", platform: "instagram", author: "شهد", date: "2025-03-13" },
  { text: "الستوريز حقتكم دايم تلهمني، خاصة اقتباسات الضيوف 📖", platform: "instagram", author: "فيصل", date: "2025-03-12" },
  { text: "أحس حسابكم صار يركز على الإعلانات أكثر من المحتوى الأصلي", platform: "instagram", author: "مها", date: "2025-03-11" },
  { text: "الريلز الأخير عن القراءة كان محتوى ذهبي، نبي أكثر من كذا!", platform: "instagram", author: "تركي", date: "2025-03-10" },
  { text: "ما عجبني تصميم البوست الأخير، الألوان ما كانت متناسقة", platform: "instagram", author: "غادة", date: "2025-03-09" },
  { text: "ثمانية هي المعيار الذهبي للمحتوى العربي على انستقرام ✨", platform: "instagram", author: "وليد", date: "2025-03-08" },
  { text: "ودي تسوون مسابقات تفاعلية أكثر مع الجمهور على انستقرام", platform: "instagram", author: "ريان", date: "2025-03-07" },
  { text: "البوست عن أفضل كتب السنة كان رائع، قائمة مفيدة جداً 📚", platform: "instagram", author: "ديما", date: "2025-03-06" },
  { text: "الكاروسيل عن نصائح القراءة كان من أفضل المنشورات عندكم 📖", platform: "instagram", author: "ملاك", date: "2025-03-05" },
  { text: "البايو حقكم يحتاج تحديث، الرابط فيه ما يشتغل", platform: "instagram", author: "صالح", date: "2025-03-04" },
  { text: "الريلز اللي فيه مقابلة سريعة مع الضيوف فكرة عبقرية!", platform: "instagram", author: "جواهر", date: "2025-03-03" },
  { text: "أتمنى تنشرون خلف الكواليس أكثر، نحب نشوف كيف تنتجون المحتوى", platform: "instagram", author: "بندر", date: "2025-03-02" },
  { text: "تصميم الهايلايتس على البروفايل محتاج تحديث، صار قديم شوي", platform: "instagram", author: "عهود", date: "2025-03-01" },
  { text: "كل بوست من ثمانية أحفظه عندي، محتوى يستاهل المراجعة 💾", platform: "instagram", author: "عبير", date: "2025-02-28" },
  { text: "ليه ما تستخدمون خاصية الأدلة (Guides) في انستقرام؟ بتكون مفيدة جداً", platform: "instagram", author: "ياسر", date: "2025-02-27" },
  { text: "الإنفوغرافيك حقكم دايماً مميز وسهل الفهم، استمروا 📊", platform: "instagram", author: "لجين", date: "2025-02-26" },
  { text: "محتاجين تنشرون بأوقات أفضل، أغلب المنشورات تنزل وأنا نايمة 😴", platform: "instagram", author: "أثير", date: "2025-02-25" },
  { text: "بوست اليوم عن المستقبل الوظيفي خلاني أعيد التفكير بمساري المهني", platform: "instagram", author: "باسل", date: "2025-02-24" },
  // ═══ X / Twitter (20) ═══
  { text: "ليه ما تسوون حلقات أكثر عن التقنية؟ المحتوى التقني ناقص عندكم", platform: "x", author: "فهد", date: "2025-03-15" },
  { text: "المحتوى صار تجاري أكثر من اللازم، وين المحتوى الأصلي؟ 😒", platform: "x", author: "لينا", date: "2025-03-14" },
  { text: "ثمانية رفعت مستوى الإعلام السعودي بشكل ملحوظ، فخور فيكم 🇸🇦", platform: "x", author: "ماجد", date: "2025-03-13" },
  { text: "تغريداتكم دائماً تثري النقاش المجتمعي، استمروا على هالنهج", platform: "x", author: "أميرة", date: "2025-03-12" },
  { text: "الحلقة الأخيرة كانت سطحية، متوقع من ثمانية مستوى أعلى", platform: "x", author: "زياد", date: "2025-03-11" },
  { text: "أفضل شي في ثمانية إنهم يعطون الضيف مساحة يتكلم بدون مقاطعة 👍", platform: "x", author: "حصة", date: "2025-03-10" },
  { text: "نبيكم تغطون مواضيع الذكاء الاصطناعي أكثر، العالم كله يتكلم عنها", platform: "x", author: "راكان", date: "2025-03-09" },
  { text: "كفريق عمل ثمانية يستاهلون كل الدعم، شغل احترافي 💪", platform: "x", author: "العنود", date: "2025-03-08" },
  { text: "صراحة بعض الحلقات طويلة زيادة بدون فايدة، اختصروا شوي", platform: "x", author: "سعود", date: "2025-03-07" },
  { text: "وش رأيكم تسوون بودكاست بالإنجليزي؟ عندكم القدرة تنافسون عالمياً", platform: "x", author: "نوره", date: "2025-03-06" },
  { text: "ثريد ثمانية عن تاريخ البودكاست في السعودية كان ثريد السنة بالنسبة لي 🧵", platform: "x", author: "مشعل", date: "2025-03-05" },
  { text: "ردودكم على التعليقات السلبية دايماً راقية ومحترفة، يعطيكم العافية", platform: "x", author: "حلا", date: "2025-03-04" },
  { text: "ليه ما سويتوا Space على إكس؟ الجمهور يبي يسمعكم لايف", platform: "x", author: "طلال", date: "2025-03-03" },
  { text: "ثمانية من الشركات القليلة اللي تستخدم إكس صح، مو بس إعلانات", platform: "x", author: "سمر", date: "2025-03-02" },
  { text: "تغريدة اليوم عن الإبداع كانت سطحية جداً وما أضافت شي جديد", platform: "x", author: "يزيد", date: "2025-03-01" },
  { text: "الهاشتاقات حقتكم دايماً تتصدر الترند، دليل على قوة المحتوى 📈", platform: "x", author: "ندى", date: "2025-02-28" },
  { text: "متحمس جداً للموسم الجديد من فنجان، أتوقع بيكون أقوى موسم 🔥", platform: "x", author: "إبراهيم", date: "2025-02-27" },
  { text: "تمنيت لو الحلقة ناقشت الموضوع من زوايا مختلفة بدل ما تكون أحادية الرأي", platform: "x", author: "وجدان", date: "2025-02-26" },
  { text: "ثمانية خلتني أحب البودكاست بعد ما كنت أحسبه شي ممل، شكراً! 🎧", platform: "x", author: "عمر ع", date: "2025-02-25" },
  { text: "محتاجين تنوعون في ضيوفكم أكثر، نشوف نفس الوجوه كل مرة", platform: "x", author: "رند", date: "2025-02-24" },
];

/* ── Pre-built sample analysis result ── */

const SAMPLE_ITEMS: AnalyzedItem[] = SAMPLE_COMMENTS.map((c, i) => {
  const sentiments: Array<"positive" | "negative" | "neutral"> = [
    // TikTok (20)
    "positive","positive","positive","positive","negative","positive","negative","positive","neutral","neutral",
    "positive","positive","neutral","negative","positive","positive","positive","neutral","negative","positive",
    // YouTube (20)
    "negative","negative","positive","positive","positive","negative","negative","positive","positive","negative",
    "positive","negative","negative","positive","positive","neutral","negative","positive","positive","neutral",
    // Instagram (20)
    "positive","neutral","positive","positive","negative","positive","negative","positive","neutral","positive",
    "positive","negative","positive","neutral","negative","positive","neutral","positive","negative","positive",
    // X (20)
    "neutral","negative","positive","positive","negative","positive","neutral","positive","negative","neutral",
    "positive","positive","neutral","positive","negative","positive","positive","negative","positive","negative",
  ];
  const emotions = [
    // TikTok
    "حماس","حماس","حماس","فرح","إحباط","فرح","إحباط","فرح","محايد","محايد",
    "حماس","فرح","محايد","غضب","فرح","حماس","محايد","محايد","إحباط","حماس",
    // YouTube
    "إحباط","إحباط","فرح","فرح","فرح","إحباط","إحباط","حماس","فرح","غضب",
    "حماس","إحباط","إحباط","حماس","فرح","محايد","إحباط","حماس","فرح","محايد",
    // Instagram
    "فرح","محايد","فرح","فرح","إحباط","حماس","إحباط","حماس","محايد","فرح",
    "فرح","إحباط","حماس","محايد","إحباط","فرح","محايد","حماس","إحباط","فرح",
    // X
    "محايد","غضب","حماس","فرح","إحباط","فرح","محايد","حماس","إحباط","محايد",
    "حماس","فرح","محايد","حماس","إحباط","حماس","حماس","إحباط","فرح","إحباط",
  ];
  const keywordSets = [
    // TikTok
    ["بودكاست","ثمانية","محتوى","راقي"],["فنجان","بودكاست","آفاق"],["تقديم","إنتاج","جودة"],["مقاطع","تيك توك","حلقة"],
    ["مقاطع","تكرار","حصري"],["ثمانية","تيك توك","دعم"],["مونتاج","جودة"],["محتوى عربي","منافسة","عالمي"],
    ["تاريخ","سعودي","سلسلة"],["خوارزمية","محتوى"],
    ["مقاطع","قصيرة","تأمل"],["عادات","روتين","تغيير"],["علوم","فضاء","جمهور"],["موسيقى","مزعجة","مقاطع"],
    ["ردود","تعليقات","فيديو"],["تطور","مستقبل","ثمانية"],["إحصائيات","رسوم بيانية"],["تعاون","مبدعين","سعوديين"],
    ["صوت","معلق","موسيقى"],["محتوى هادف","سوشال ميديا"],
    // YouTube
    ["حلقة","ضيف","مملة"],["صوت","بودكاست","جودة"],["ريادة أعمال","ملهمة","عبدالرحمن"],["مخرج","سعودي","إبداع"],
    ["ترجمة","إنجليزية","أصدقاء"],["مقدمة","طويلة"],["تعليمي","علمي","محتوى"],["إنتاج","سينمائي","تصوير"],
    ["صحة نفسية","نظرة"],["إعلانات","مزعجة","تركيز"],
    ["اقتصاد","سعودي","حلقة"],["ضيف","تحضير","موضوع"],["ذكاء اصطناعي","متخصص"],["قناة","اشتراك","جرس"],
    ["فلوق","يابان","عبدالرحمن"],["حلقات","شهرية","أسبوع"],["نقاشات","سطحية","عمق"],["إضاءة","استوديو","تنسيق"],
    ["ضيف","وقت","شرح"],["حلقة","أطول","تعمّق"],
    // Instagram
    ["محتوى","جميل","حلقة"],["مقاطع","قصيرة"],["تصميم","براند","طاقة"],["ستوريز","اقتباسات","ضيوف"],
    ["إعلانات","محتوى أصلي"],["ريلز","قراءة","ذهبي"],["تصميم","ألوان","بوست"],["معيار","محتوى عربي"],
    ["مسابقات","تفاعل","جمهور"],["كتب","قائمة"],
    ["كاروسيل","قراءة","نصائح"],["بايو","رابط","تحديث"],["ريلز","مقابلة","ضيوف"],["كواليس","إنتاج","محتوى"],
    ["هايلايتس","بروفايل","تحديث"],["بوست","حفظ","مراجعة"],["أدلة","انستقرام","خاصية"],["إنفوغرافيك","تصميم","فهم"],
    ["أوقات نشر","منشورات"],["مستقبل وظيفي","مسار مهني"],
    // X
    ["تقنية","حلقات","محتوى"],["تجاري","محتوى أصلي"],["إعلام","سعودي","فخر"],["نقاش","مجتمعي"],
    ["سطحية","مستوى"],["ضيف","مساحة","مقاطعة"],["ذكاء اصطناعي","تغطية"],["فريق","احترافي","دعم"],
    ["حلقات","طويلة","اختصار"],["بودكاست","إنجليزي","عالمي"],
    ["ثريد","تاريخ","بودكاست"],["ردود","تعليقات","احترافية"],["Space","إكس","لايف"],["إكس","استخدام","إعلانات"],
    ["تغريدة","إبداع","سطحية"],["هاشتاقات","ترند","محتوى"],["موسم جديد","فنجان","حماس"],["زوايا","أحادية","رأي"],
    ["بودكاست","حب","ثمانية"],["ضيوف","تنوع","وجوه"],
  ];
  const confidences = [
    // TikTok
    0.95,0.93,0.88,0.91,0.85,0.92,0.78,0.96,0.70,0.65,
    0.90,0.89,0.72,0.81,0.87,0.94,0.76,0.73,0.80,0.95,
    // YouTube
    0.87,0.82,0.94,0.90,0.89,0.80,0.83,0.97,0.93,0.86,
    0.91,0.84,0.79,0.93,0.92,0.71,0.83,0.96,0.88,0.74,
    // Instagram
    0.92,0.72,0.88,0.90,0.84,0.91,0.79,0.95,0.68,0.90,
    0.89,0.77,0.91,0.75,0.78,0.93,0.70,0.92,0.73,0.88,
    // X
    0.75,0.88,0.93,0.87,0.85,0.91,0.73,0.94,0.82,0.71,
    0.90,0.86,0.74,0.89,0.81,0.92,0.95,0.83,0.91,0.84,
  ];
  const reasons = [
    // TikTok
    "إشادة واضحة بجودة المحتوى","حماس كبير لبرنامج فنجان","إشادة بالتقديم والإنتاج","إعجاب بالمقاطع القصيرة",
    "انتقاد لتكرار المحتوى","تعبير عن الدعم والمتابعة","انتقاد لتراجع جودة المونتاج","فخر بالمحتوى العربي",
    "اقتراح بنّاء لمحتوى جديد","ملاحظة محايدة عن الخوارزمية",
    "إدمان إيجابي على المقاطع القصيرة","تأثر بمحتوى العادات اليومية","اقتراح لمحتوى علمي","انتقاد للموسيقى المستخدمة",
    "إشادة بالتفاعل مع الجمهور","ملاحظة التطور المستمر","تفضيل المحتوى البصري","اقتراح تعاون مع مبدعين",
    "شكوى من وضوح الصوت","إشادة بالمحتوى الهادف",
    // YouTube
    "انتقاد مباشر للحلقة","شكوى من جودة الصوت","إشادة بحلقة ريادة الأعمال","إعجاب بحلقة المخرج",
    "إشادة بالترجمة","انتقاد لطول المقدمة","طلب محتوى تعليمي أكثر","إشادة بجودة الإنتاج",
    "تأثر إيجابي بحلقة الصحة النفسية","انزعاج من الإعلانات",
    "إشادة بحلقة الاقتصاد","انتقاد لعدم تحضير الضيف","طلب ضيف أكثر تخصصاً","ولاء عالي للقناة",
    "إعجاب بمحتوى السفر","طلب زيادة المحتوى","انتقاد لعمق النقاشات","إشادة بالاستوديو الجديد",
    "إشادة بأسلوب المقابلة","رغبة في حلقات أطول",
    // Instagram
    "إشادة مستمرة بالمحتوى","استفسار محايد","إعجاب بالهوية البصرية","إعجاب بالستوريز",
    "انتقاد للتوجه التجاري","إشادة بمحتوى القراءة","انتقاد للتصميم","إشادة عامة بالحساب",
    "اقتراح للتفاعل","إشادة بقائمة الكتب",
    "إشادة بمحتوى الكاروسيل","ملاحظة تقنية عن البايو","إعجاب بفكرة المقابلات القصيرة","طلب محتوى كواليس",
    "ملاحظة عن تحديث الهايلايتس","تقدير عالي للمحتوى","اقتراح استخدام خاصية جديدة","إشادة بالإنفوغرافيك",
    "ملاحظة عن أوقات النشر","تأثر بمحتوى مهني",
    // X
    "طلب محتوى تقني","انتقاد للتوجه التجاري","فخر وطني بالإعلام","إشادة بإثراء النقاش",
    "انتقاد لمستوى الحلقة","إشادة بأسلوب الاستضافة","طلب تغطية الذكاء الاصطناعي","دعم واحترام للفريق",
    "انتقاد لطول الحلقات","اقتراح بنّاء للتوسع",
    "إشادة بالثريد التاريخي","إشادة بالتعامل المحترف","اقتراح استخدام Space","إشادة باستخدام المنصة",
    "انتقاد لسطحية المحتوى","إشادة بالتأثير على الترند","حماس للموسم الجديد","انتقاد لأحادية الطرح",
    "تأثر إيجابي بالبودكاست","طلب تنويع الضيوف",
  ];
  return {
    index: i + 1,
    text: c.text,
    platform: c.platform,
    sentiment: sentiments[i],
    emotion: emotions[i],
    confidence: confidences[i],
    keywords: keywordSets[i],
    reason: reasons[i],
  };
});

function buildSampleResult(): AnalysisResult {
  const items = SAMPLE_ITEMS;
  const sentimentCounts: Record<string, number> = {};
  const emotionCounts: Record<string, number> = {};
  const kwMap: Record<string, number> = {};
  for (const item of items) {
    sentimentCounts[item.sentiment] = (sentimentCounts[item.sentiment] || 0) + 1;
    emotionCounts[item.emotion] = (emotionCounts[item.emotion] || 0) + 1;
    for (const kw of item.keywords) { kwMap[kw] = (kwMap[kw] || 0) + 1; }
  }
  const topKeywords = Object.entries(kwMap).sort((a, b) => b[1] - a[1]).slice(0, 30).map(([word, count]) => ({ word, count }));

  return {
    items,
    report: {
      themes: [
        { name: "جودة المحتوى والإنتاج", description: "إشادة واسعة بمستوى الإنتاج والتقديم في بودكاستات ثمانية", percentage: 35, sentiment: "positive" },
        { name: "التوجه التجاري", description: "قلق متزايد من الجمهور حول زيادة الإعلانات والمحتوى التجاري", percentage: 20, sentiment: "negative" },
        { name: "تنوع المحتوى", description: "طلبات لتغطية مواضيع جديدة كالتقنية والذكاء الاصطناعي والتاريخ", percentage: 20, sentiment: "neutral" },
        { name: "التأثير المجتمعي", description: "تقدير لدور ثمانية في إثراء النقاش المجتمعي ورفع مستوى الإعلام", percentage: 15, sentiment: "positive" },
        { name: "الجوانب التقنية", description: "ملاحظات على جودة الصوت والمونتاج والمقدمات الطويلة", percentage: 10, sentiment: "negative" },
      ],
      issues: [
        { title: "الإعلانات المزعجة", description: "شكاوى متكررة من الإعلانات في منتصف الحلقات وعلى انستقرام وتأثيرها على تجربة المستخدم", severity: "high", count: 10 },
        { title: "تراجع جودة المونتاج والصوت", description: "ملاحظات حول تراجع جودة المونتاج والصوت خاصة في مقاطع تيك توك والموسيقى الخلفية", severity: "medium", count: 7 },
        { title: "نقص المحتوى التقني والمتخصص", description: "طلبات متعددة لتغطية مواضيع التقنية والذكاء الاصطناعي مع ضيوف متخصصين", severity: "medium", count: 8 },
        { title: "طول الحلقات والمقدمات", description: "ملاحظات على طول المقدمات وبعض الحلقات مع سطحية بعض النقاشات", severity: "low", count: 6 },
        { title: "تنوع الضيوف", description: "ملاحظة تكرار الضيوف وطلب تنويع أكبر في اختيار المتحدثين", severity: "medium", count: 4 },
      ],
      insights: [
        { title: "الجمهور يقدّر الأصالة", description: "التعليقات الإيجابية تركز على المحتوى الأصلي غير التجاري والحلقات العميقة" },
        { title: "فرصة التوسع الدولي", description: "هناك اهتمام واضح بمحتوى بالإنجليزية والترجمة، مما يشير لفرصة نمو عالمي" },
        { title: "المحتوى القصير يجذب للطويل", description: "المقاطع القصيرة على تيك توك وانستقرام تعمل كبوابة لمشاهدة الحلقات الكاملة" },
        { title: "الصحة النفسية والتنمية الذاتية", description: "الحلقات ذات الطابع الإنساني تحصل على أعلى تفاعل إيجابي" },
      ],
      recommendations: [
        { title: "تقليل الإعلانات المتقطعة", description: "نقل الإعلانات لبداية أو نهاية الحلقات بدلاً من المنتصف لتحسين تجربة المشاهدة", priority: "high" },
        { title: "إطلاق سلسلة تقنية", description: "إنشاء سلسلة متخصصة في التقنية والذكاء الاصطناعي لتلبية طلب الجمهور المتزايد", priority: "high" },
        { title: "تحسين جودة الصوت والمونتاج", description: "مراجعة معايير الجودة التقنية خاصة في المقاطع القصيرة على تيك توك", priority: "medium" },
        { title: "زيادة المحتوى التفاعلي", description: "إضافة مسابقات واستطلاعات على انستقرام لزيادة التفاعل مع الجمهور", priority: "medium" },
        { title: "استكشاف محتوى بالإنجليزية", description: "تجربة حلقات أو مقاطع بالإنجليزية للوصول لجمهور أوسع", priority: "low" },
      ],
      overall_summary: "يحظى محتوى ثمانية بتقدير واسع من الجمهور عبر 80 تعليقاً من 4 منصات، مع نسبة مشاعر إيجابية تقارب 50%. التحديات الرئيسية تتمحور حول التوازن بين المحتوى التجاري والأصلي، وتلبية الطلب المتزايد على مواضيع جديدة كالتقنية والذكاء الاصطناعي. الفرص الأبرز تشمل التوسع الدولي وتعزيز المحتوى التفاعلي وزيادة التعاون مع مبدعين.",
      sentiment_analysis: "من أصل 80 تعليقاً عبر 4 منصات (تيك توك، يوتيوب، انستقرام، إكس): ~40 إيجابي (50%)، ~22 سلبي (27.5%)، ~18 محايد (22.5%). المشاعر الإيجابية تتركز حول جودة المحتوى والإنتاج والفخر بالمحتوى العربي. المشاعر السلبية تتمحور حول الإعلانات والتوجه التجاري وبعض الملاحظات التقنية.",
    },
    sentimentCounts,
    emotionCounts,
    topKeywords,
    model: "sample-data",
    analyzedAt: new Date().toISOString(),
  };
}

export const SAMPLE_ANALYSIS_RESULT: AnalysisResult = buildSampleResult();

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

  const res = await fetch(AI_API_URL, {
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
${buildMetricsPromptSection(loadMetrics())}

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
    throw new Error(`AI API error ${res.status}: ${errText}`);
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

  const res = await fetch(AI_API_URL, {
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
  const apiKey = AI_API_KEY;
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
      chunk.map((batch) => analyzeBatch(batch, apiKey, modelId)),
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
  const report = await generateReport(allItems, apiKey, modelId);

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

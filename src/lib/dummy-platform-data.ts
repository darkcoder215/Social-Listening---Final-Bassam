/**
 * Dummy data for platform explore pages — used as fallback when Supabase returns no data.
 */
import type { EnrichedComment, PlatformStats, ChartPoint, TopPost, AccountCount } from "./db-types";

/* ── Helpers ── */
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function generateChartPoints(days: number, base: number, variance: number): ChartPoint[] {
  const pts: ChartPoint[] = [];
  for (let i = days; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    pts.push({ date: d.toISOString().split("T")[0], count: base + Math.floor(Math.random() * variance) });
  }
  return pts;
}

/* ═══════════════════════════════════════════
   TikTok Dummy Data
   ═══════════════════════════════════════════ */

const TIKTOK_COMMENTS_RAW = [
  { text: "بودكاست ثمانية من أفضل البودكاستات العربية، محتوى راقي ومفيد جداً 👏", author: "أحمد_م", likes: 45, replies: 3 },
  { text: "فنجان أفضل بودكاست عربي بدون منافس! كل حلقة تفتح آفاق جديدة 🔥", author: "ريم_خ", likes: 72, replies: 5 },
  { text: "أسلوب التقديم ممتاز والإنتاج عالي الجودة، استمروا على هالمستوى", author: "هند_س", likes: 28, replies: 1 },
  { text: "مقاطعكم القصيرة على تيك توك تجنن، تخلي الواحد يبي يسمع الحلقة كاملة", author: "عمر_ع", likes: 91, replies: 8 },
  { text: "للأسف المقاطع على تيك توك مجرد تكرار، ما فيه محتوى حصري", author: "دانة_ف", likes: 15, replies: 12 },
  { text: "كل يوم أتابع ثمانية على تيك توك، محتوى مميز يستاهل الدعم 💚", author: "يوسف_ر", likes: 63, replies: 2 },
  { text: "أحس المونتاج في المقاطع صار أقل جودة من قبل، وش السالفة؟", author: "سلمى_ن", likes: 22, replies: 7 },
  { text: "ثمانية تثبت إن المحتوى العربي يقدر ينافس عالمياً 🌟", author: "طارق_ب", likes: 105, replies: 4 },
  { text: "وش رأيكم تسوون سلسلة عن التاريخ السعودي؟ بيكون محتوى خرافي", author: "منال_ح", likes: 38, replies: 6 },
  { text: "الخوارزمية ما تعرض لي محتواكم كثير، ودي أشوفكم أكثر", author: "بدر_ق", likes: 17, replies: 0 },
  { text: "أنا مدمن على مقاطع ثمانية القصيرة، كل مقطع فيه فكرة تستحق التأمل", author: "جنان_م", likes: 54, replies: 3 },
  { text: "المقطع عن العادات اليومية غيّر روتيني بالكامل، شكراً ثمانية 💪", author: "عادل_ش", likes: 82, replies: 2 },
  { text: "ياليت تنزلون مقاطع أكثر عن العلوم والفضاء، الجمهور يحبها", author: "ميساء_ج", likes: 31, replies: 4 },
  { text: "الموسيقى اللي تستخدمونها في المقاطع مزعجة وما تناسب المحتوى", author: "عبدالرحمن_ك", likes: 9, replies: 5 },
  { text: "ردكم على التعليقات بالفيديو شي جميل، يحسسنا إنكم قريبين منا", author: "ريناد_ع", likes: 67, replies: 1 },
  { text: "أشوف ثمانية تتطور كل سنة أحسن من اللي قبلها، مستقبل مشرق 🌙", author: "وسام_ت", likes: 48, replies: 2 },
  { text: "المقاطع اللي فيها إحصائيات ورسوم بيانية أفضل بكثير", author: "لطيفة_ص", likes: 35, replies: 0 },
  { text: "نبي تعاون بين ثمانية ومبدعين سعوديين آخرين، بيطلع شي خرافي", author: "حمزة_د", likes: 41, replies: 3 },
  { text: "صوت المعلق في بعض المقاطع غير واضح مع الموسيقى الخلفية", author: "سارة_ع", likes: 12, replies: 6 },
  { text: "ثمانية هي الأمل الحقيقي للمحتوى العربي الهادف ✨", author: "أسامة_ل", likes: 93, replies: 4 },
];

export const DUMMY_TIKTOK_COMMENTS: EnrichedComment[] = TIKTOK_COMMENTS_RAW.map((c, i) => ({
  id: `tt-dummy-${i}`,
  text: c.text,
  createdAt: daysAgo(i),
  likes: c.likes,
  authorName: c.author,
  isReply: false,
  replyCount: c.replies,
  parentPostId: `tt-post-${Math.floor(i / 4)}`,
  parentPostText: "مقطع تجريبي من ثمانية",
  platform: "tiktok" as const,
  accountName: i % 2 === 0 ? "ثمانية" : "فنجان مع عبدالرحمن أبومالح",
}));

export const DUMMY_TIKTOK_STATS: PlatformStats = {
  total_posts: 245, total_likes: 89500, total_comments: 12340, total_shares: 3210, total_views: 4567890,
};

export const DUMMY_TIKTOK_CHART: ChartPoint[] = generateChartPoints(30, 80, 120);

export const DUMMY_TIKTOK_TOP_POSTS: TopPost[] = [
  { id: "ttp-1", text: "حلقة عن مستقبل الذكاء الاصطناعي في السعودية", url: "#", engagement: 15420, likes: 8900, comments: 3200, views: 245000, account: "thmanyah", accountAr: "ثمانية", platform: "tiktok" },
  { id: "ttp-2", text: "أسرار النجاح في ريادة الأعمال مع ضيف مميز", url: "#", engagement: 12300, likes: 7100, comments: 2800, views: 198000, account: "thmanyah", accountAr: "ثمانية", platform: "tiktok" },
  { id: "ttp-3", text: "كيف تبني عادات صحية تغير حياتك", url: "#", engagement: 9800, likes: 5600, comments: 2100, views: 156000, account: "thmanyah", accountAr: "ثمانية", platform: "tiktok" },
  { id: "ttp-4", text: "رحلة ثمانية من البداية إلى اليوم", url: "#", engagement: 8500, likes: 4900, comments: 1800, views: 134000, account: "thmanyah", accountAr: "ثمانية", platform: "tiktok" },
  { id: "ttp-5", text: "نصائح للقراءة الفعالة من أفضل القراء", url: "#", engagement: 7200, likes: 4100, comments: 1500, views: 112000, account: "thmanyah", accountAr: "ثمانية", platform: "tiktok" },
];

export const DUMMY_TIKTOK_ACCOUNTS: AccountCount[] = [
  { account: "thmanyah", accountAr: "ثمانية", count: 5200 },
  { account: "thmanyahsports", accountAr: "رياضة ثمانية", count: 2100 },
  { account: "thmanyahexit", accountAr: "مخرج ثمانية", count: 1800 },
  { account: "thmanyahliving", accountAr: "معيشة ثمانية", count: 1500 },
  { account: "radiothmanyah", accountAr: "راديو ثمانية", count: 900 },
];

/* ═══════════════════════════════════════════
   Instagram Dummy Data
   ═══════════════════════════════════════════ */

const INSTAGRAM_COMMENTS_RAW = [
  { text: "شكراً ثمانية على المحتوى الجميل، كل حلقة أحسن من اللي قبلها ❤️", author: "nora_ksa", likes: 34 },
  { text: "التصميم الجديد للبراند حلو مرة، يعطي طاقة إيجابية 💚", author: "shahd.design", likes: 56 },
  { text: "الستوريز حقتكم دايم تلهمني، خاصة اقتباسات الضيوف 📖", author: "faisal_reads", likes: 23 },
  { text: "أحس حسابكم صار يركز على الإعلانات أكثر من المحتوى الأصلي", author: "maha_88", likes: 11 },
  { text: "الريلز الأخير عن القراءة كان محتوى ذهبي، نبي أكثر من كذا!", author: "turki_m", likes: 78 },
  { text: "ما عجبني تصميم البوست الأخير، الألوان ما كانت متناسقة", author: "ghada_art", likes: 8 },
  { text: "ثمانية هي المعيار الذهبي للمحتوى العربي على انستقرام ✨", author: "waleed.sa", likes: 92 },
  { text: "ودي تسوون مسابقات تفاعلية أكثر مع الجمهور", author: "rayan_fan", likes: 19 },
  { text: "البوست عن أفضل كتب السنة كان رائع، قائمة مفيدة جداً 📚", author: "dima_books", likes: 45 },
  { text: "الكاروسيل عن نصائح القراءة كان من أفضل المنشورات 📖", author: "malak_r", likes: 61 },
  { text: "الريلز اللي فيه مقابلة سريعة مع الضيوف فكرة عبقرية!", author: "jawahr_m", likes: 37 },
  { text: "أتمنى تنشرون خلف الكواليس أكثر، نحب نشوف كيف تنتجون المحتوى", author: "bandr_k", likes: 28 },
  { text: "كل بوست من ثمانية أحفظه عندي، محتوى يستاهل المراجعة 💾", author: "abeer_sa", likes: 53 },
  { text: "الإنفوغرافيك حقكم دايماً مميز وسهل الفهم 📊", author: "lojain_d", likes: 44 },
  { text: "بوست اليوم عن المستقبل الوظيفي خلاني أعيد التفكير بمساري", author: "basel_h", likes: 31 },
  { text: "ليه ما تستخدمون خاصية الأدلة في انستقرام؟ بتكون مفيدة", author: "yaser_t", likes: 15 },
  { text: "محتاجين تنشرون بأوقات أفضل، أغلب المنشورات تنزل متأخر 😴", author: "atheer_n", likes: 7 },
  { text: "تصميم الهايلايتس محتاج تحديث، صار قديم شوي", author: "ohoud_s", likes: 5 },
  { text: "سؤال: ليه توقفتوا عن نشر المقاطع القصيرة؟ كانت ممتازة", author: "abdullah_9", likes: 21 },
  { text: "التصوير الاحترافي في البوستات يرفع من قيمة المحتوى بشكل كبير 📸", author: "sarah_photo", likes: 67 },
];

export const DUMMY_INSTAGRAM_COMMENTS: EnrichedComment[] = INSTAGRAM_COMMENTS_RAW.map((c, i) => ({
  id: `ig-dummy-${i}`,
  text: c.text,
  createdAt: daysAgo(i),
  likes: c.likes,
  authorName: c.author,
  isReply: false,
  replyCount: 0,
  parentPostId: `ig-post-${Math.floor(i / 3)}`,
  parentPostText: "منشور تجريبي من ثمانية",
  platform: "instagram" as const,
  accountName: i % 3 === 0 ? "ثمانية" : i % 3 === 1 ? "رياضة ثمانية" : "معيشة ثمانية",
}));

export const DUMMY_INSTAGRAM_STATS: PlatformStats = {
  total_posts: 189, total_likes: 67800, total_comments: 8920, total_shares: 0, total_views: 2345670,
};

export const DUMMY_INSTAGRAM_CHART: ChartPoint[] = generateChartPoints(30, 50, 80);

export const DUMMY_INSTAGRAM_TOP_POSTS: TopPost[] = [
  { id: "igp-1", text: "أفضل 10 كتب لعام 2025 — قائمة ثمانية 📚", url: "#", engagement: 12500, likes: 8200, comments: 2100, views: 89000, account: "thmanyah", accountAr: "ثمانية", platform: "instagram" },
  { id: "igp-2", text: "كواليس تصوير حلقة فنجان الأخيرة 🎬", url: "#", engagement: 9800, likes: 6500, comments: 1800, views: 67000, account: "thmanyah", accountAr: "ثمانية", platform: "instagram" },
  { id: "igp-3", text: "إنفوغرافيك: مستقبل البودكاست في العالم العربي", url: "#", engagement: 8100, likes: 5400, comments: 1500, views: 54000, account: "thmanyah", accountAr: "ثمانية", platform: "instagram" },
  { id: "igp-4", text: "اقتباسات ملهمة من ضيوف فنجان هذا الشهر", url: "#", engagement: 7200, likes: 4800, comments: 1200, views: 45000, account: "thmanyah", accountAr: "ثمانية", platform: "instagram" },
  { id: "igp-5", text: "نتائج استطلاع: ما أكثر بودكاست تسمعونه؟", url: "#", engagement: 6500, likes: 4200, comments: 1100, views: 38000, account: "thmanyah", accountAr: "ثمانية", platform: "instagram" },
];

export const DUMMY_INSTAGRAM_ACCOUNTS: AccountCount[] = [
  { account: "thmanyah", accountAr: "ثمانية", count: 3800 },
  { account: "thmanyahsports", accountAr: "رياضة ثمانية", count: 1900 },
  { account: "thmanyahliving", accountAr: "معيشة ثمانية", count: 1400 },
  { account: "thmanyahexit", accountAr: "مخرج ثمانية", count: 1100 },
  { account: "radiothmanyah", accountAr: "راديو ثمانية", count: 720 },
];

/* ═══════════════════════════════════════════
   YouTube Dummy Data
   ═══════════════════════════════════════════ */

const YOUTUBE_COMMENTS_RAW = [
  { text: "حلقة اليوم عن ريادة الأعمال كانت ملهمة جداً، شكراً عبدالرحمن 🙏", author: "محمد العلي", likes: 120 },
  { text: "حلقة فنجان مع المخرج السعودي كانت من أجمل الحلقات، إبداع حقيقي", author: "نوف الراشد", likes: 89 },
  { text: "الترجمة الإنجليزية للحلقات ممتازة، ساعدتني أشارك المحتوى مع أصدقائي", author: "سلطان محمد", likes: 56 },
  { text: "الحلقة الأخيرة مع الضيف كانت مملة صراحة، ما استفدت شي", author: "سارة أحمد", likes: 23 },
  { text: "أتمنى تحسنون جودة الصوت في البودكاست، أحياناً ما يكون واضح", author: "خالد الشمري", likes: 34 },
  { text: "إنتاج سينمائي بمعنى الكلمة! التصوير والإضاءة على مستوى عالمي 🎬", author: "لمى سعيد", likes: 145 },
  { text: "حلقة الصحة النفسية غيّرت نظرتي لأشياء كثيرة، شكراً من القلب", author: "ناصر الدوسري", likes: 98 },
  { text: "الإعلانات في نص الحلقة مزعجة جداً، تقطع التركيز بشكل سيء", author: "رهف القحطاني", likes: 67 },
  { text: "حلقة الاقتصاد السعودي كانت من أهم الحلقات هالسنة 📊", author: "عمار الحربي", likes: 78 },
  { text: "الضيف ما كان متمكن من الموضوع، كان واضح إنه ما حضّر كويس", author: "بشاير يوسف", likes: 41 },
  { text: "الحلقة عن الذكاء الاصطناعي كانت محتاجة ضيف متخصص أكثر", author: "فارس المالكي", likes: 52 },
  { text: "ثمانية هي القناة الوحيدة اللي أشترك فيها وأفعّل الجرس 🔔", author: "رزان العتيبي", likes: 134 },
  { text: "الفلوق حق عبدالرحمن في اليابان كان من أحلى المحتويات 🇯🇵", author: "مازن السبيعي", likes: 167 },
  { text: "نبيكم تزيدون الحلقات الشهرية، حلقة واحدة في الأسبوع ما تكفي", author: "حنين الزهراني", likes: 45 },
  { text: "أحس النقاشات صارت سطحية مقارنة بالحلقات القديمة، عمّقوا أكثر", author: "تميم المهنا", likes: 31 },
  { text: "تنسيق الإضاءة والمكان في الاستوديو الجديد خرافي! 🎥", author: "شيماء عبدالله", likes: 112 },
  { text: "أفضل شي إنكم تعطون الضيف وقت كافي يشرح وجهة نظره بدون استعجال", author: "أيمن حسن", likes: 87 },
  { text: "كنت أتمنى الحلقة تكون أطول، الموضوع كان يستاهل تعمّق أكثر", author: "نجلاء فهد", likes: 29 },
  { text: "ليه صرتوا تطولون المقدمة كثير؟ أول كانت مختصرة وحلوة", author: "هيا العنزي", likes: 18 },
  { text: "المحتوى التعليمي عندكم ناقص، أتمنى تركزون أكثر على العلمي", author: "عبدالعزيز خالد", likes: 25 },
];

export const DUMMY_YOUTUBE_COMMENTS: EnrichedComment[] = YOUTUBE_COMMENTS_RAW.map((c, i) => ({
  id: `yt-dummy-${i}`,
  text: c.text,
  createdAt: daysAgo(i),
  likes: c.likes,
  authorName: c.author,
  isReply: false,
  replyCount: 0,
  parentPostId: `yt-video-${Math.floor(i / 4)}`,
  parentPostText: "حلقة فنجان — ضيف مميز",
  parentPostUrl: "#",
  platform: "youtube" as const,
  accountName: i % 2 === 0 ? "ثمانية" : "رياضة ثمانية",
}));

export const DUMMY_YOUTUBE_STATS: PlatformStats = {
  total_posts: 0, total_likes: 0, total_comments: 423500, total_shares: 0, total_views: 0,
};

export const DUMMY_YOUTUBE_CHART: ChartPoint[] = generateChartPoints(30, 200, 300);

export const DUMMY_YOUTUBE_TOP_POSTS: TopPost[] = [
  { id: "ytp-1", text: "فنجان: مستقبل الذكاء الاصطناعي مع خبير سعودي", url: "#", engagement: 45000, likes: 12000, comments: 8500, views: 890000, account: "ثمانية", accountAr: "ثمانية", platform: "youtube" },
  { id: "ytp-2", text: "فنجان: قصة نجاح مؤسس شركة سعودية عالمية", url: "#", engagement: 38000, likes: 10500, comments: 7200, views: 720000, account: "ثمانية", accountAr: "ثمانية", platform: "youtube" },
  { id: "ytp-3", text: "فنجان: الصحة النفسية وكيف نتعامل مع الضغوط", url: "#", engagement: 32000, likes: 9200, comments: 6100, views: 650000, account: "ثمانية", accountAr: "ثمانية", platform: "youtube" },
  { id: "ytp-4", text: "فنجان: رحلة في عالم السينما السعودية", url: "#", engagement: 28000, likes: 8100, comments: 5400, views: 540000, account: "ثمانية", accountAr: "ثمانية", platform: "youtube" },
  { id: "ytp-5", text: "فنجان: أسرار الكتابة الإبداعية مع كاتب مشهور", url: "#", engagement: 24000, likes: 7000, comments: 4800, views: 480000, account: "ثمانية", accountAr: "ثمانية", platform: "youtube" },
];

export const DUMMY_YOUTUBE_ACCOUNTS: AccountCount[] = [
  { account: "ثمانية", accountAr: "ثمانية", count: 285000 },
  { account: "رياضة ثمانية", accountAr: "رياضة ثمانية", count: 68000 },
  { account: "مخرج ثمانية", accountAr: "مخرج ثمانية", count: 42000 },
  { account: "شركة ثمانية", accountAr: "شركة ثمانية", count: 18500 },
  { account: "إذاعة ثمانية", accountAr: "إذاعة ثمانية", count: 10000 },
];

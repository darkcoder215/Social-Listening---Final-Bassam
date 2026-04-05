import { useState, useMemo, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  Heart,
  Target,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  TrendingUp,
  FileText,
  ExternalLink,
  X,
  ChevronUp,
  Loader2,
  Play,
  Clock,
  Trash2,
} from 'lucide-react';
import PageExplainer from '@/components/PageExplainer';
import { SentimentPieChart } from '@/components/SentimentPieChart';
import { TopicCategorization } from '@/components/meltwater/TopicCategorization';
import { TimelineCharts } from '@/components/meltwater/TimelineCharts';
import { TopicKPIs } from '@/components/meltwater/TopicKPIs';
import { ExcelExport } from '@/components/meltwater/ExcelExport';
import { AboutThamanyah } from '@/components/meltwater/AboutThamanyah';
import { WordCloud } from '@/components/meltwater/WordCloud';
import { DataImport } from '@/components/meltwater/DataImport';
import { Link } from 'react-router-dom';
import { loadApiKeys, loadSelectedModel } from '@/lib/settings';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

/* ── Robust JSON parser ── */
function safeParseJSON(raw: string): any {
  if (!raw || typeof raw !== 'string') throw new Error('Empty response');

  // Try direct parse first
  try { return JSON.parse(raw); } catch {}

  // Remove markdown fences
  let clean = raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  try { return JSON.parse(clean); } catch {}

  // Find first { or [ and last } or ]
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    try { return JSON.parse(clean.slice(firstBrace, lastBrace + 1)); } catch {}
  }

  const firstBracket = clean.indexOf('[');
  const lastBracket = clean.lastIndexOf(']');
  if (firstBracket >= 0 && lastBracket > firstBracket) {
    try { return JSON.parse(clean.slice(firstBracket, lastBracket + 1)); } catch {}
  }

  throw new Error('Could not parse AI response as JSON');
}

/* ── Saved report row type ── */
interface SavedReport {
  id: string;
  title: string;
  tweet_count: number;
  positive_count: number;
  negative_count: number;
  neutral_count: number;
  model_used: string;
  report_insights: ReportInsights;
  analyzed_tweets: Tweet[];
  summary: string;
  created_at: string;
}

/* ══════════════════════════════════════════════════════════════
   Sample Data
   ══════════════════════════════════════════════════════════════ */

const SAMPLE_TWEETS = [
  { id: 1, text: "ماشاء الله شرح تفصيلي ومشوق ما تمنيت الفيديو يخلص ...عمل جبار تشكرون عليه", author: "@reich_hadhrmi", sentiment: "إيجابي", emotion: "إعجاب", keywords: ["شرح", "عمل جبار", "مشوق"], reach: 210, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 2, text: "قناه المدلل الزرقاء تطبل لهدف ضمك اللي خسرر واندعس", author: "@qcu8ero", sentiment: "سلبي", emotion: "غضب", keywords: ["تطبل", "خسر", "اندعس"], reach: 223, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 3, text: "كالعادة .. قناة ثمانية مع لقطة جواو فيلكس .. شاهد ماشفش حاجة !!", author: "@Aljamaz8910", sentiment: "سلبي", emotion: "إحباط", keywords: ["كالعادة", "ماشفش حاجة", "لقطة"], reach: 799, engagement: { likes: 0, retweets: 11, replies: 0 } },
  { id: 4, text: "في كل مكان ، كريستيانو رونالدو حاضر 🔝🐐", author: "@thmanyahsports", sentiment: "إيجابي", emotion: "حماس", keywords: ["رونالدو", "حاضر", "كريستيانو"], reach: 12760, engagement: { likes: 0, retweets: 1, replies: 0 } },
  { id: 5, text: "960 هدف ⚽️ رقم جديد للأسطورة كريستيانو رونالدو 🐐", author: "@thmanyahsports", sentiment: "إيجابي", emotion: "فخر", keywords: ["هدف", "أسطورة", "رقم جديد"], reach: 4160, engagement: { likes: 0, retweets: 3, replies: 0 } },
  { id: 6, text: "اما ثمانية ابومالح فتوجهها بات معلوم للجميع للاسف استغلال الحالة النصراوية للضغط وتشتيت الفريق", author: "@Turki_alharbi44", sentiment: "سلبي", emotion: "استياء", keywords: ["استغلال", "تشتيت", "ابومالح"], reach: 341, engagement: { likes: 0, retweets: 1, replies: 0 } },
  { id: 7, text: "مراوغة ⬅️➡️ ثم هدف 🎯 #دوري_روشن_السعودي", author: "@thmanyahsports", sentiment: "إيجابي", emotion: "إثارة", keywords: ["مراوغة", "هدف", "دوري روشن"], reach: 436, engagement: { likes: 0, retweets: 6, replies: 0 } },
  { id: 8, text: "عرضية ساحرة من جواو فيليكس 🤩 #ضمك_النصر", author: "@thmanyahsports", sentiment: "إيجابي", emotion: "إعجاب", keywords: ["ساحرة", "عرضية", "جواو فيليكس"], reach: 2140, engagement: { likes: 0, retweets: 1, replies: 0 } },
  { id: 9, text: "محاولة تلو الأخرى 🚀 والأسطورة رونالدو دائمًا يصل إلى الشباك ⚽️✅", author: "@thmanyahsports", sentiment: "إيجابي", emotion: "حماس", keywords: ["محاولة", "أسطورة", "الشباك"], reach: 804, engagement: { likes: 0, retweets: 2, replies: 0 } },
  { id: 10, text: "بما ان نادي أبها أفضل فريق في يلو هو أكثر نادي محتاج رضاء قناة ثمانية لتسليط الأضواء عليهم", author: "@mode_sh10", sentiment: "محايد", emotion: "تساؤل", keywords: ["أبها", "يلو", "تسليط الأضواء"], reach: 611, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 11, text: "ماذا يحدث في اليمن؟ 🇾🇪 إذا وقفت أمام كل الأخبار عن اليمن ولم تفهم أغلب ما تقرأه، فأنت مثل أغلب العرب", author: "@thmanyah", sentiment: "محايد", emotion: "فضول", keywords: ["اليمن", "أخبار", "شرح"], reach: 413, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 12, text: "قط رسبت في مادة، أو أخذت فيها درجة دنيئة، وكان السبب أنك لم تدرسها بالعربية؟", author: "@thmanyah", sentiment: "محايد", emotion: "تساؤل", keywords: ["رسبت", "مادة", "العربية"], reach: 75960, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 13, text: "كالعادة تعمد إخفاء شعبية النصر من قبل الهلالي ابومالح وقناته #ثمانية", author: "@Alqeeran", sentiment: "سلبي", emotion: "غضب", keywords: ["إخفاء", "شعبية", "ابومالح"], reach: 41, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 14, text: "محمد الخميس ينتقد الناقل الرسمي للدوري 'ثمانية' امس حتى مباراة الاهلي فيها مشاكل بدائية في البث", author: "@1432nayif", sentiment: "سلبي", emotion: "انتقاد", keywords: ["ينتقد", "مشاكل", "البث"], reach: 244, engagement: { likes: 0, retweets: 5, replies: 0 } },
  { id: 15, text: "اكيد قناة ثمانية متعاقدين مع فارس عوض عشان يغني راب", author: "@kfa7i", sentiment: "محايد", emotion: "سخرية", keywords: ["فارس عوض", "راب", "متعاقدين"], reach: 27420, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 16, text: "حسبي الله ونعم الوكيل", author: "@himo1947", sentiment: "سلبي", emotion: "استياء", keywords: ["حسبي الله"], reach: 3100, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 17, text: "مبدع ابن العم كعادتك♥️", author: "@i4wlk", sentiment: "إيجابي", emotion: "إعجاب", keywords: ["مبدع", "كعادتك"], reach: 5, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 18, text: "في الفيديوهات التأريخية التوثيقية لايريد الحديث إلا عن أشياء مؤكدة صلبة عليها دليل", author: "@tamrh2016", sentiment: "إيجابي", emotion: "تقدير", keywords: ["تأريخية", "توثيقية", "دليل"], reach: 130, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 19, text: "صباح الخير 🌹 يا جماعة الخير، أبي اشتراك IPTV كفو وبدون أي تقطيع يكون شامل قنوات ثمانية", author: "@MhmdAlshmr79531", sentiment: "محايد", emotion: "طلب", keywords: ["IPTV", "قنوات ثمانية", "بدون تقطيع"], reach: 19, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 20, text: "ابو ثمانيه 🤣", author: "@4ramosz", sentiment: "محايد", emotion: "سخرية", keywords: ["ابو ثمانيه"], reach: 8, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 21, text: "هدفنا الانتصار 14 في الدوري 💫 الليلة موعدنا 💙", author: "@Alhilal_FC", sentiment: "إيجابي", emotion: "حماس", keywords: ["الانتصار", "الدوري", "الهلال"], reach: 1580, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 22, text: "عبدالكريم الجاسر: عندما كان يرأس النصر رئيس ميوله هلالية، سعود السويلم حقق النصر الدوري", author: "@NASRAWEHD", sentiment: "محايد", emotion: "تحليل", keywords: ["النصر", "الدوري", "السويلم"], reach: 43, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 23, text: "ليت كل دقيقة في المباراة الكرة في رجلك هل هناك لاعب في دوري روشن يصنع اسيست بهذا الجمال والروعه", author: "@Fahadalhurifi", sentiment: "إيجابي", emotion: "إعجاب", keywords: ["اسيست", "دوري روشن", "جمال"], reach: 11080, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 24, text: "تكلفة جلب حكم اجنبي في الدوري السعودي 450 الف ريال للمباراه الواحده بينما تكلفته في الدوري الاماراتي والقطري لايتجاوز 170 الف", author: "@nzihhh2025", sentiment: "سلبي", emotion: "صدمة", keywords: ["حكم اجنبي", "تكلفة", "الدوري السعودي"], reach: 4920, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 25, text: "ولا أريد التشكيك في نزاهة جدولة الدوري السعودي، فأنا على يقين تام أن القائمين عليها يراعون الله", author: "@hfc1957_only", sentiment: "محايد", emotion: "تحفظ", keywords: ["جدولة", "الدوري السعودي", "نزاهة"], reach: 1030, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 26, text: "والله والله لو تكلمونهم beIN وتقولون لهم نبي دورات عندكم وكيف تشتغلون وكيف وصلتو للاحترافية", author: "@hamad_almohisn", sentiment: "سلبي", emotion: "انتقاد", keywords: ["beIN", "احترافية", "نقل سيء"], reach: 1420, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 27, text: "معقولة قناة ثمانية بعدتها و عتادها و كاميراتها و شغلها و تقنياتها اللي نسمع فيها وللحين ما شفناها", author: "@MaanAlquiae", sentiment: "سلبي", emotion: "إحباط", keywords: ["كاميرات", "تقنيات", "ما شفناها"], reach: 220, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 28, text: "وش صاير في اليمن؟ هل تعتقد أنها معقدة؟ هذه الحلقة ستفكك لك التعقيد من الحرب العالمية الأولى", author: "@alrougui", sentiment: "إيجابي", emotion: "تقدير", keywords: ["اليمن", "الحرب العالمية", "تفكيك"], reach: 3670, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 29, text: "الإنتاج جودتة رووووعة نفتخر بك 🇸🇦", author: "@k35g25", sentiment: "إيجابي", emotion: "فخر", keywords: ["إنتاج", "جودة", "نفتخر"], reach: 2750, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 30, text: "هذا الرجل قناة لحاله سرد تاريخي متسلسل تبسيط أصعب المعلومات جودة وتواريخ مذكوره الله درك يامالك", author: "@21m_ar", sentiment: "إيجابي", emotion: "إعجاب", keywords: ["سرد تاريخي", "تبسيط", "مالك"], reach: 1, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 31, text: "11 حالة ضد الأزيرق من أول الدوري لم يتم استدعاء الحكم للمراجعة", author: "@abw99902", sentiment: "سلبي", emotion: "غضب", keywords: ["VAR", "استدعاء", "الحكم"], reach: 242, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 32, text: "الاهلي مب منافس على الدوري بالعناصر ذي والشهرين الجايه بمجرد ما يبدأ التعثر", author: "@w2iac", sentiment: "سلبي", emotion: "تشاؤم", keywords: ["الاهلي", "الدوري", "تعثر"], reach: 147, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 33, text: "يوم المباراة ، يوم الهلال ، يوم المتصدر 💙 الهلال vs الفيحاء دوري روشن السعودي", author: "@bufaris9", sentiment: "إيجابي", emotion: "حماس", keywords: ["الهلال", "المتصدر", "دوري روشن"], reach: 2730, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 34, text: "أوه ذا حق اللي طلع مع أبو مالح", author: "@nameless__one1", sentiment: "محايد", emotion: "فضول", keywords: ["أبو مالح"], reach: 581, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 35, text: "قناة ثمانية هلالية ولكن الشكوى لغير الله مذله احمد ربك ما طلعت فضايحكم", author: "@alallah67343", sentiment: "سلبي", emotion: "استياء", keywords: ["هلالية", "فضايح", "شكوى"], reach: 5, engagement: { likes: 0, retweets: 0, replies: 0 } },
  // Additional positive tweets
  { id: 36, text: "محتوى ثمانية دائماً يرتقي بالمشاهد العربي، شكراً لكم على هذا الجهد", author: "@fan_2025", sentiment: "إيجابي", emotion: "تقدير", keywords: ["محتوى", "يرتقي", "جهد"], reach: 890, engagement: { likes: 12, retweets: 3, replies: 1 } },
  { id: 37, text: "أفضل تغطية رياضية شفتها بالسعودية صراحة، الكاميرات والإخراج على مستوى عالمي", author: "@sportsfan_sa", sentiment: "إيجابي", emotion: "إعجاب", keywords: ["تغطية", "إخراج", "عالمي"], reach: 1540, engagement: { likes: 25, retweets: 5, replies: 2 } },
  { id: 38, text: "ثمانية غيّرت مفهوم الإعلام الرياضي بالمنطقة، استمروا على هذا النهج 🔥", author: "@media_watcher", sentiment: "إيجابي", emotion: "حماس", keywords: ["إعلام رياضي", "غيّرت", "المنطقة"], reach: 2300, engagement: { likes: 40, retweets: 8, replies: 3 } },
  { id: 39, text: "الحلقة الأخيرة عن تاريخ الكرة السعودية كانت تحفة فنية بكل المقاييس", author: "@history_buff", sentiment: "إيجابي", emotion: "إعجاب", keywords: ["حلقة", "تاريخ", "تحفة فنية"], reach: 670, engagement: { likes: 18, retweets: 4, replies: 0 } },
  { id: 40, text: "مقابلة اليوم كانت من أجمل المقابلات اللي شفتها، أسئلة ذكية وإجابات عميقة", author: "@interview_fan", sentiment: "إيجابي", emotion: "إعجاب", keywords: ["مقابلة", "أسئلة ذكية", "عميقة"], reach: 1120, engagement: { likes: 30, retweets: 6, replies: 2 } },
  { id: 41, text: "جودة الصوت والصورة في بث ثمانية أفضل بكثير من المنافسين، أحسنتم", author: "@tech_viewer", sentiment: "إيجابي", emotion: "تقدير", keywords: ["جودة", "صوت", "صورة"], reach: 450, engagement: { likes: 8, retweets: 1, replies: 0 } },
  { id: 42, text: "كل حلقة جديدة من بودكاست ثمانية أتعلم منها شيء جديد، شكراً للفريق كله", author: "@podcast_lover", sentiment: "إيجابي", emotion: "تقدير", keywords: ["بودكاست", "أتعلم", "فريق"], reach: 3200, engagement: { likes: 55, retweets: 12, replies: 5 } },
  { id: 43, text: "التعليق الرياضي في ثمانية وصل لمستوى احترافي عالي جداً ما شاء الله", author: "@commentator_fan", sentiment: "إيجابي", emotion: "فخر", keywords: ["تعليق رياضي", "احترافي", "عالي"], reach: 780, engagement: { likes: 14, retweets: 2, replies: 1 } },
  // Additional negative tweets
  { id: 44, text: "البث تقطع في أهم لحظة من المباراة، هذا شيء غير مقبول أبداً", author: "@angry_viewer1", sentiment: "سلبي", emotion: "غضب", keywords: ["بث", "تقطع", "غير مقبول"], reach: 1890, engagement: { likes: 45, retweets: 15, replies: 8 } },
  { id: 45, text: "مستوى التعليق في مباراة اليوم كان ضعيف جداً، نبي معلقين بمستوى أفضل", author: "@match_critic", sentiment: "سلبي", emotion: "إحباط", keywords: ["تعليق", "ضعيف", "معلقين"], reach: 560, engagement: { likes: 10, retweets: 3, replies: 2 } },
  { id: 46, text: "تطبيق ثمانية يعلق كل ما فتحته، المفروض يشتغلون على تحسين الأداء", author: "@app_user", sentiment: "سلبي", emotion: "إحباط", keywords: ["تطبيق", "يعلق", "أداء"], reach: 340, engagement: { likes: 22, retweets: 7, replies: 4 } },
  { id: 47, text: "الإعلانات كثيرة جداً في وسط المحتوى، صارت تنفّر المشاهد", author: "@ad_hater", sentiment: "سلبي", emotion: "استياء", keywords: ["إعلانات", "كثيرة", "تنفّر"], reach: 2100, engagement: { likes: 60, retweets: 20, replies: 10 } },
  { id: 48, text: "سعر الاشتراك مبالغ فيه مقارنة بالمحتوى المقدم، ما يستاهل", author: "@price_critic", sentiment: "سلبي", emotion: "استياء", keywords: ["اشتراك", "مبالغ", "ما يستاهل"], reach: 980, engagement: { likes: 35, retweets: 10, replies: 6 } },
  { id: 49, text: "التحيز واضح في تغطية المباريات، وين الحيادية؟", author: "@neutral_seeker", sentiment: "سلبي", emotion: "انتقاد", keywords: ["تحيز", "تغطية", "حيادية"], reach: 1450, engagement: { likes: 38, retweets: 12, replies: 7 } },
  { id: 50, text: "الترجمة في المقاطع الأجنبية سيئة ومليانة أخطاء، لازم يراجعونها", author: "@translation_critic", sentiment: "سلبي", emotion: "انتقاد", keywords: ["ترجمة", "أخطاء", "مراجعة"], reach: 290, engagement: { likes: 8, retweets: 2, replies: 1 } },
  { id: 51, text: "قناة ثمانية صارت تهتم بالكمية على حساب الجودة، المحتوى ما عاد زي أول", author: "@quality_watcher", sentiment: "سلبي", emotion: "إحباط", keywords: ["كمية", "جودة", "ما عاد زي أول"], reach: 1670, engagement: { likes: 42, retweets: 14, replies: 5 } },
  // Additional neutral tweets
  { id: 52, text: "هل عندكم خطة لتغطية كأس آسيا الجاي؟ نبي نعرف", author: "@curious_fan", sentiment: "محايد", emotion: "تساؤل", keywords: ["كأس آسيا", "تغطية", "خطة"], reach: 320, engagement: { likes: 5, retweets: 1, replies: 3 } },
  { id: 53, text: "أحد يعرف كيف أشترك في ثمانية؟ وش الباقات المتاحة؟", author: "@new_subscriber", sentiment: "محايد", emotion: "طلب", keywords: ["اشتراك", "باقات", "ثمانية"], reach: 150, engagement: { likes: 2, retweets: 0, replies: 5 } },
  { id: 54, text: "ثمانية نقلت حقوق البث من beIN ولا شلون القصة بالضبط؟", author: "@info_seeker", sentiment: "محايد", emotion: "فضول", keywords: ["حقوق البث", "beIN", "نقل"], reach: 890, engagement: { likes: 3, retweets: 1, replies: 8 } },
  { id: 55, text: "شفت إعلان ثمانية الجديد، ما عرفت إذا المقصود الرياضة ولا المحتوى العام", author: "@confused_viewer", sentiment: "محايد", emotion: "تساؤل", keywords: ["إعلان", "رياضة", "محتوى عام"], reach: 420, engagement: { likes: 4, retweets: 0, replies: 2 } },
  { id: 56, text: "مقارنة بين تغطية ثمانية وSSC: كل واحد عنده مميزات وعيوب مختلفة", author: "@sports_analyst", sentiment: "محايد", emotion: "تحليل", keywords: ["مقارنة", "SSC", "مميزات"], reach: 2450, engagement: { likes: 30, retweets: 8, replies: 12 } },
  { id: 57, text: "أتوقع ثمانية بتوسع تغطيتها لرياضات ثانية غير كرة القدم قريب", author: "@prediction_maker", sentiment: "محايد", emotion: "تحليل", keywords: ["توسع", "رياضات", "كرة القدم"], reach: 560, engagement: { likes: 7, retweets: 2, replies: 3 } },
  { id: 58, text: "سمعت إن ثمانية بتطلق بودكاست رياضي جديد، أحد عنده تفاصيل؟", author: "@podcast_seeker", sentiment: "محايد", emotion: "فضول", keywords: ["بودكاست", "رياضي", "جديد"], reach: 280, engagement: { likes: 6, retweets: 1, replies: 4 } },
  { id: 59, text: "لاحظت إن تعليقات ثمانية على تويتر كلها رياضة، وين المحتوى الثقافي؟", author: "@culture_fan", sentiment: "محايد", emotion: "تساؤل", keywords: ["تعليقات", "رياضة", "محتوى ثقافي"], reach: 190, engagement: { likes: 3, retweets: 0, replies: 2 } },
  { id: 60, text: "ثمانية عندها 5 ملايين متابع الحين، رقم كبير بس السؤال هل المحتوى يتطور بنفس السرعة؟", author: "@growth_tracker", sentiment: "محايد", emotion: "تحليل", keywords: ["متابعين", "محتوى", "تطور"], reach: 1340, engagement: { likes: 15, retweets: 4, replies: 6 } },
  { id: 61, text: "الدوري السعودي هالسنة أقوى من السنوات الماضية، والمنافسة على البث تزيد", author: "@league_observer", sentiment: "محايد", emotion: "تحليل", keywords: ["الدوري", "منافسة", "بث"], reach: 730, engagement: { likes: 9, retweets: 3, replies: 1 } },
  { id: 62, text: "وش رأيكم في تجربة ثمانية بشكل عام؟ أبي أسمع آراء مختلفة قبل ما أشترك", author: "@opinion_seeker", sentiment: "محايد", emotion: "طلب", keywords: ["تجربة", "آراء", "اشتراك"], reach: 470, engagement: { likes: 11, retweets: 2, replies: 15 } },
];

type Tweet = typeof SAMPLE_TWEETS[number];

/* ── AI Report Insights ── */
interface ReportTheme { name: string; description: string; percentage: number; sentiment: string }
interface ReportIssue { title: string; description: string; severity: 'high' | 'medium' | 'low'; count: number }
interface ReportInsight { title: string; description: string }
interface ReportRecommendation { title: string; description: string; priority: 'high' | 'medium' | 'low' }
interface ReportInsights {
  themes: ReportTheme[];
  issues: ReportIssue[];
  insights: ReportInsight[];
  recommendations: ReportRecommendation[];
  overall_summary: string;
  sentiment_analysis: string;
}

/* ── Section navigation items ── */
const SECTIONS = [
  { id: "overview", label: "نظرة عامة", icon: BarChart3 },
  { id: "sentiment", label: "المشاعر", icon: Heart },
  { id: "topics", label: "المواضيع", icon: Target },
  { id: "timeline", label: "التحليل الزمني", icon: TrendingUp },
  { id: "issues", label: "المشاكل", icon: AlertTriangle },
  { id: "insights", label: "الرؤى", icon: Lightbulb },
  { id: "recommendations", label: "التوصيات", icon: CheckCircle },
  { id: "summary", label: "الملخص", icon: FileText },
  { id: "tweets", label: "التغريدات", icon: MessageSquare },
] as const;

/* ══════════════════════════════════════════════════════════════
   Component
   ══════════════════════════════════════════════════════════════ */

const MeltwaterReport = () => {
  const [activeSection, setActiveSection] = useState("overview");
  const [selectedSentiment, setSelectedSentiment] = useState<string | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  // Data state
  const [activeTweets, setActiveTweets] = useState<Tweet[]>(SAMPLE_TWEETS);
  const [importedTweets, setImportedTweets] = useState<Tweet[] | null>(null);
  const [analysisState, setAnalysisState] = useState<'idle' | 'ready' | 'analyzing' | 'generating-report' | 'done' | 'error'>('idle');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisError, setAnalysisError] = useState('');
  const [reportInsights, setReportInsights] = useState<ReportInsights | null>(null);

  // Computed stats
  const totalTweets = activeTweets.length;
  const duplicatesRemoved = activeTweets === SAMPLE_TWEETS ? 89 : 0;
  const originalCount = totalTweets + duplicatesRemoved;

  const sentimentCounts = useMemo(() => ({
    positive: activeTweets.filter(t => t.sentiment === "إيجابي").length,
    negative: activeTweets.filter(t => t.sentiment === "سلبي").length,
    neutral: activeTweets.filter(t => t.sentiment === "محايد").length,
  }), [activeTweets]);

  const sentimentPercentages = useMemo(() => ({
    positive: totalTweets ? ((sentimentCounts.positive / totalTweets) * 100).toFixed(1) : "0",
    negative: totalTweets ? ((sentimentCounts.negative / totalTweets) * 100).toFixed(1) : "0",
    neutral: totalTweets ? ((sentimentCounts.neutral / totalTweets) * 100).toFixed(1) : "0",
  }), [sentimentCounts, totalTweets]);

  const emotionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    activeTweets.forEach(t => { counts[t.emotion] = (counts[t.emotion] || 0) + 1; });
    return counts;
  }, [activeTweets]);

  const topKeywords = useMemo(() => {
    const counts: Record<string, number> = {};
    activeTweets.forEach(t => { t.keywords.forEach(k => { counts[k] = (counts[k] || 0) + 1; }); });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [activeTweets]);

  const totalReach = useMemo(() => activeTweets.reduce((sum, t) => sum + t.reach, 0), [activeTweets]);

  const sentimentFilteredTweets = useMemo(() => {
    if (!selectedSentiment) return [];
    return activeTweets.filter(t => t.sentiment === selectedSentiment);
  }, [selectedSentiment, activeTweets]);

  // Helper: extract top keywords
  const getTopKeywords = (tweets: Tweet[], n: number): string[] => {
    const counts: Record<string, number> = {};
    tweets.forEach(t => t.keywords.forEach(k => { counts[k] = (counts[k] || 0) + 1; }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k);
  };

  const getTopEmotions = (tweets: Tweet[], n: number): string[] => {
    const counts: Record<string, number> = {};
    tweets.forEach(t => { counts[t.emotion] = (counts[t.emotion] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k);
  };

  const queryClient = useQueryClient();

  // Fetch saved reports
  const { data: savedReports } = useQuery({
    queryKey: ['meltwater-reports'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('meltwater_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as SavedReport[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Delete a saved report
  const handleDeleteReport = async (id: string) => {
    await (supabase as any).from('meltwater_reports').delete().eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['meltwater-reports'] });
  };

  // Load a saved report
  const handleLoadReport = (report: SavedReport) => {
    setActiveTweets(report.analyzed_tweets);
    setReportInsights(report.report_insights);
    setAnalysisState('done');
  };

  // Import handler
  const handleImport = (tweets: any[]) => {
    setImportedTweets(tweets as Tweet[]);
    setAnalysisState('ready');
    setAnalysisError('');
  };

  // AI Analysis — parallel batches, skip-on-error, auto-save progress
  const handleStartAnalysis = async () => {
    const tweetsToAnalyze = importedTweets || SAMPLE_TWEETS;

    const keys = loadApiKeys();
    if (!keys.openrouter) {
      setAnalysisError('no-key');
      setAnalysisState('error');
      return;
    }

    const modelId = loadSelectedModel();
    setAnalysisState('analyzing');
    setAnalysisProgress(0);
    setAnalysisError('');

    const BATCH_SIZE = 8;
    const PARALLEL = 5;
    const analyzed = [...tweetsToAnalyze];

    // Build batch list: [ { startIdx, tweets[] }, ... ]
    const batches: { startIdx: number; tweets: Tweet[] }[] = [];
    for (let i = 0; i < analyzed.length; i += BATCH_SIZE) {
      batches.push({ startIdx: i, tweets: analyzed.slice(i, i + BATCH_SIZE) });
    }

    let completedBatches = 0;

    // Single-batch analyzer
    const analyzeBatch = async (batch: { startIdx: number; tweets: Tweet[] }) => {
      const tweetsText = batch.tweets.map((t, i) => `[${i + 1}] ${t.text}`).join('\n');

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${keys.openrouter}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelId,
          max_tokens: 4096,
          messages: [
            {
              role: 'system',
              content: `أنت محلل مشاعر متخصص في النصوص العربية. حلل التغريدات المرقمة وأرجع JSON فقط.
لكل تغريدة أرجع:
- index: رقم التغريدة (يبدأ من 1)
- sentiment: إيجابي أو سلبي أو محايد
- emotion: العاطفة (إعجاب، غضب، إحباط، حماس، فخر، استياء، إثارة، تساؤل، فضول، سخرية، انتقاد، تقدير، تشاؤم، صدمة، طلب، تحفظ، تحليل، محايد)
- keywords: أهم 2-4 كلمات مفتاحية
أرجع JSON بالشكل: {"results":[{"index":1,"sentiment":"...","emotion":"...","keywords":["..."]},...]}
أجب بصيغة JSON فقط. لا تكتب أي نص قبل أو بعد الـ JSON.`,
            },
            { role: 'user', content: tweetsText },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
        }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '{}';
      const parsed = safeParseJSON(content);
      const results = parsed.results || [];

      for (const r of results) {
        const idx = batch.startIdx + (r.index - 1);
        if (idx >= 0 && idx < analyzed.length) {
          analyzed[idx] = {
            ...analyzed[idx],
            sentiment: r.sentiment || analyzed[idx].sentiment,
            emotion: r.emotion || analyzed[idx].emotion,
            keywords: Array.isArray(r.keywords) ? r.keywords : analyzed[idx].keywords,
          };
        }
      }
    };

    // Parallel worker: pick next batch, run it, skip on error, repeat
    let batchIndex = 0;
    const processNext = async (): Promise<void> => {
      const idx = batchIndex++;
      if (idx >= batches.length) return;

      try {
        await analyzeBatch(batches[idx]);
      } catch (err) {
        console.error(`Batch ${idx + 1}/${batches.length} failed, skipping:`, err);
      }

      completedBatches++;
      setAnalysisProgress(Math.round((completedBatches / batches.length) * 100));
      setActiveTweets([...analyzed]); // save progress after each batch
      return processNext();
    };

    // Run PARALLEL workers concurrently
    await Promise.all(Array.from({ length: PARALLEL }, () => processNext()));

    setActiveTweets([...analyzed]);

    // Phase 2: Generate report insights
    setAnalysisState('generating-report');
    setAnalysisProgress(100);

    try {
      const sentimentSummary = {
        positive: analyzed.filter(t => t.sentiment === 'إيجابي').length,
        negative: analyzed.filter(t => t.sentiment === 'سلبي').length,
        neutral: analyzed.filter(t => t.sentiment === 'محايد').length,
      };
      const kwList = getTopKeywords(analyzed, 10);
      const emList = getTopEmotions(analyzed, 10);
      const samplePos = analyzed.filter(t => t.sentiment === 'إيجابي').slice(0, 3).map(t => t.text);
      const sampleNeg = analyzed.filter(t => t.sentiment === 'سلبي').slice(0, 3).map(t => t.text);

      const reportPrompt = `أنت محلل بيانات متخصص في تحليل وسائل التواصل الاجتماعي لشركة ثمانية الإعلامية السعودية.

حللت ${analyzed.length} تغريدة/منشور. هذا ملخص النتائج:

التوزيع العاطفي:
- إيجابي: ${sentimentSummary.positive} (${Math.round(100 * sentimentSummary.positive / analyzed.length)}%)
- سلبي: ${sentimentSummary.negative} (${Math.round(100 * sentimentSummary.negative / analyzed.length)}%)
- محايد: ${sentimentSummary.neutral} (${Math.round(100 * sentimentSummary.neutral / analyzed.length)}%)

أكثر الكلمات تكراراً: ${kwList.join('، ')}
أكثر المشاعر: ${emList.join('، ')}

عينة إيجابية:
${samplePos.map((t, i) => `${i + 1}. ${t}`).join('\n')}

عينة سلبية:
${sampleNeg.map((t, i) => `${i + 1}. ${t}`).join('\n')}

أعطني تحليلاً بصيغة JSON:
{"themes":[{"name":"...","description":"...","percentage":25,"sentiment":"..."}],"issues":[{"title":"...","description":"...","severity":"high","count":15}],"insights":[{"title":"...","description":"..."}],"recommendations":[{"title":"...","description":"...","priority":"high"}],"overall_summary":"...","sentiment_analysis":"..."}

3-5 لكل قسم. بالعربية.
أجب بصيغة JSON فقط. لا تكتب أي نص قبل أو بعد الـ JSON.`;

      const reportRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${keys.openrouter}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelId,
          max_tokens: 4096,
          messages: [{ role: 'user', content: reportPrompt }],
          response_format: { type: 'json_object' },
          temperature: 0,
        }),
      });

      if (!reportRes.ok) throw new Error(`Report API error: ${reportRes.status}`);
      const reportData = await reportRes.json();
      const reportContent = reportData.choices?.[0]?.message?.content || '{}';
      const insights = safeParseJSON(reportContent) as ReportInsights;
      setReportInsights(insights);

      // Auto-save report to Supabase
      const posCount = analyzed.filter(t => t.sentiment === 'إيجابي').length;
      const negCount = analyzed.filter(t => t.sentiment === 'سلبي').length;
      const neuCount = analyzed.filter(t => t.sentiment === 'محايد').length;
      try {
        await (supabase as any).from('meltwater_reports').insert({
          title: `تقرير ${new Date().toLocaleDateString('ar-SA')} — ${analyzed.length} تغريدة`,
          tweet_count: analyzed.length,
          positive_count: posCount,
          negative_count: negCount,
          neutral_count: neuCount,
          model_used: modelId,
          report_insights: insights,
          analyzed_tweets: analyzed,
          summary: insights.overall_summary || '',
        });
        queryClient.invalidateQueries({ queryKey: ['meltwater-reports'] });
      } catch (_) { /* silent — report still displays even if save fails */ }

      setAnalysisState('done');
    } catch (err: any) {
      // Phase 2 failed but Phase 1 data is already saved in activeTweets
      setAnalysisError(err.message || 'حدث خطأ أثناء إعداد التقرير');
      setAnalysisState('done'); // still show results — Phase 1 data is valid
    }
  };

  // Use imported data directly without AI analysis
  const handleUseDirectly = () => {
    if (!importedTweets) return;
    setActiveTweets(importedTweets);
    setReportInsights(null);
    setAnalysisState('done');
  };

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case "إيجابي": return "bg-thmanyah-green/10 text-thmanyah-green border-thmanyah-green/20";
      case "سلبي": return "bg-thmanyah-red/10 text-thmanyah-red border-thmanyah-red/20";
      default: return "bg-muted text-muted-foreground border-border/50";
    }
  };

  const getEmotionBadge = (emotion: string) => {
    const map: Record<string, string> = {
      "إعجاب": "bg-thmanyah-blue/10 text-thmanyah-blue",
      "غضب": "bg-thmanyah-red/10 text-thmanyah-red",
      "إحباط": "bg-thmanyah-amber/10 text-thmanyah-amber",
      "حماس": "bg-thmanyah-green/10 text-thmanyah-green",
      "فخر": "bg-purple-500/10 text-purple-600",
      "استياء": "bg-thmanyah-amber/10 text-thmanyah-amber",
      "إثارة": "bg-thmanyah-red/10 text-thmanyah-red",
      "تساؤل": "bg-thmanyah-blue/10 text-thmanyah-blue",
      "فضول": "bg-thmanyah-blue/10 text-thmanyah-blue",
      "سخرية": "bg-thmanyah-amber/10 text-thmanyah-amber",
      "انتقاد": "bg-thmanyah-red/10 text-thmanyah-red",
      "تقدير": "bg-thmanyah-green/10 text-thmanyah-green",
    };
    return map[emotion] || "bg-muted text-muted-foreground";
  };

  return (
    <div ref={mainRef} className="max-w-7xl mx-auto space-y-8">
      {/* ── Page Header ── */}
      <PageExplainer
        icon={BarChart3}
        title="تقارير Meltwater"
        description="عرض تفاعلي شامل يتضمن تحليل المشاعر والاتجاهات والرسوم البيانية من تقارير Meltwater"
        color="#8B5CF6"
      />

      {/* ── Previous Reports ── */}
      {savedReports && savedReports.length > 0 && (
        <div className="card-stagger space-y-3" style={{ animationDelay: "0.03s" }}>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground/50" strokeWidth={1.8} />
            <h3 className="text-[14px] font-display font-bold text-foreground/70">التقارير السابقة</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {savedReports.map((report) => {
              const total = report.positive_count + report.negative_count + report.neutral_count;
              const posPct = total ? Math.round((report.positive_count / total) * 100) : 0;
              const negPct = total ? Math.round((report.negative_count / total) * 100) : 0;
              const neuPct = total ? Math.round((report.neutral_count / total) * 100) : 0;
              return (
                <div
                  key={report.id}
                  onClick={() => handleLoadReport(report)}
                  className="shrink-0 w-[260px] rounded-2xl bg-card border border-border/40 p-4 cursor-pointer hover:border-thmanyah-blue/40 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-[12px] font-bold text-foreground/80 leading-snug line-clamp-2">{report.title}</h4>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteReport(report.id); }}
                      className="shrink-0 p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-thmanyah-red/10 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-thmanyah-red" />
                    </button>
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground/40 mb-2">
                    {formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: ar })}
                    {' · '}
                    <span className="nums-en">{report.tweet_count}</span> تغريدة
                  </p>
                  {/* Sentiment mini bar */}
                  <div className="flex h-1.5 rounded-full overflow-hidden bg-muted/20 mb-2">
                    <div className="bg-thmanyah-green" style={{ width: `${posPct}%` }} />
                    <div className="bg-muted-foreground/30" style={{ width: `${neuPct}%` }} />
                    <div className="bg-thmanyah-red" style={{ width: `${negPct}%` }} />
                  </div>
                  {report.summary && (
                    <p className="text-[10px] font-bold text-muted-foreground/40 leading-relaxed line-clamp-2">{report.summary}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Section Navigation ── */}
      <nav className="card-stagger sticky top-16 z-30 -mx-2 px-2 py-3 bg-background/80 backdrop-blur-xl border-b border-border/30" style={{ animationDelay: "0.05s" }}>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const isActive = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-foreground text-white shadow-md"
                    : "bg-card border border-border/40 text-muted-foreground/60 hover:text-foreground hover:border-border"
                }`}
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={1.8} />
                {s.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Data Import & Export ── */}
      <div className="card-stagger grid grid-cols-1 md:grid-cols-2 gap-4" style={{ animationDelay: "0.1s" }}>
        <DataImport onImport={handleImport} />
        <ExcelExport tweets={activeTweets} reportDate="2026-01-22" />
      </div>

      {/* ── Analysis Controls ── */}
        <div className="card-stagger rounded-2xl bg-card border border-border/40 p-6 text-center space-y-4" style={{ animationDelay: "0.15s" }}>
          {analysisState === 'idle' && (
            <>
              <div className="flex items-center justify-center gap-2 text-thmanyah-blue mb-2">
                <BarChart3 className="w-5 h-5" />
                <span className="text-[14px] font-bold">البيانات التجريبية جاهزة — {SAMPLE_TWEETS.length} تغريدة</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleStartAnalysis}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-thmanyah-green text-white font-bold text-[15px] hover:bg-thmanyah-green/90 transition-all shadow-lg shadow-thmanyah-green/20"
                >
                  <Play className="w-5 h-5" />
                  ابدأ التحليل
                </button>
              </div>
              <p className="text-[11px] font-bold text-muted-foreground/40">
                حلل البيانات التجريبية باستخدام الذكاء الاصطناعي أو استورد بياناتك الخاصة أعلاه
              </p>
            </>
          )}

          {analysisState === 'ready' && (
            <>
              <div className="flex items-center justify-center gap-2 text-thmanyah-green mb-2">
                <CheckCircle className="w-5 h-5" />
                <span className="text-[14px] font-bold">تم استيراد {importedTweets?.length} تغريدة بنجاح</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleStartAnalysis}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-thmanyah-green text-white font-bold text-[15px] hover:bg-thmanyah-green/90 transition-all shadow-lg shadow-thmanyah-green/20"
                >
                  <Play className="w-5 h-5" />
                  ابدأ التحليل
                </button>
                <button
                  onClick={handleUseDirectly}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-border/40 text-muted-foreground font-bold text-[13px] hover:bg-muted/30 transition-all"
                >
                  استخدام البيانات مباشرة
                </button>
              </div>
              <p className="text-[11px] font-bold text-muted-foreground/40">
                سيتم تحليل المشاعر والعواطف والكلمات المفتاحية باستخدام الذكاء الاصطناعي
              </p>
            </>
          )}

          {analysisState === 'analyzing' && (
            <>
              <Loader2 className="w-8 h-8 text-thmanyah-green animate-spin mx-auto" />
              <p className="text-[14px] font-bold text-foreground/80">جاري التحليل...</p>
              <Progress value={analysisProgress} className="max-w-xs mx-auto h-2" />
              <p className="text-[11px] font-bold text-muted-foreground/40">{analysisProgress}%</p>
            </>
          )}

          {analysisState === 'generating-report' && (
            <>
              <Loader2 className="w-8 h-8 text-thmanyah-blue animate-spin mx-auto" />
              <p className="text-[14px] font-bold text-foreground/80">جاري إعداد التقرير الشامل...</p>
              <p className="text-[11px] font-bold text-muted-foreground/40">تحليل الأنماط واستخلاص الرؤى والتوصيات</p>
            </>
          )}

          {analysisState === 'done' && (
            <div className="flex items-center justify-center gap-2 text-thmanyah-green">
              <CheckCircle className="w-5 h-5" />
              <span className="text-[14px] font-bold">تم التحليل بنجاح! التقرير أدناه يعكس البيانات المستوردة.</span>
            </div>
          )}

          {analysisState === 'error' && (
            <div className="space-y-3">
              {analysisError === 'no-key' ? (
                <>
                  <div className="flex items-center justify-center gap-2 text-thmanyah-red">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="text-[14px] font-bold">يجب إضافة مفتاح OpenRouter API أولاً</span>
                  </div>
                  <Link to="/settings" className="inline-flex items-center gap-1.5 text-[12px] font-bold text-thmanyah-blue hover:underline">
                    الذهاب للإعدادات
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-2 text-thmanyah-red">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="text-[14px] font-bold">{analysisError}</span>
                  </div>
                  <button
                    onClick={handleStartAnalysis}
                    className="text-[12px] font-bold text-thmanyah-blue hover:underline"
                  >
                    إعادة المحاولة
                  </button>
                </>
              )}
            </div>
          )}
        </div>

      {/* ══════════════════════════════════════════
          SECTION: Overview
          ══════════════════════════════════════════ */}
      <section id="overview" className="scroll-mt-32 space-y-5">
        <SectionHeading icon={BarChart3} color="#8B5CF6">نظرة عامة</SectionHeading>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="التغريدات المحللة" value={String(totalTweets)} sub={`من أصل ${originalCount} (إزالة ${duplicatesRemoved} مكرر)`} color="#8B5CF6" delay={0} />
          <KpiCard label="إجمالي الوصول" value={`${(totalReach / 1000).toFixed(1)}K`} sub="مجموع reach للتغريدات" color="#0072F9" delay={1} />
          <KpiCard label="إيجابية" value={`${sentimentPercentages.positive}%`} sub={`${sentimentCounts.positive} تغريدة`} color="#00C17A" delay={2} />
          <KpiCard label="سلبية" value={`${sentimentPercentages.negative}%`} sub={`${sentimentCounts.negative} تغريدة`} color="#F24935" delay={3} />
        </div>

        {/* KPIs */}
        <TopicKPIs tweets={activeTweets} />

        {/* About Thamanyah */}
        <div className="space-y-3">
          <h3 className="text-[14px] font-display font-bold text-foreground/70">عن ثمانية وليس عن ثمانية</h3>
          <AboutThamanyah tweets={activeTweets} />
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION: Sentiment & Emotions
          ══════════════════════════════════════════ */}
      <section id="sentiment" className="scroll-mt-32 space-y-5">
        <SectionHeading icon={Heart} color="#E4405F">توزيع المشاعر والعواطف</SectionHeading>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Sentiment Pie */}
          <div className="card-stagger rounded-2xl bg-card border border-border/40 p-6" style={{ animationDelay: "0s" }}>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-muted-foreground/50" strokeWidth={1.8} />
              <h3 className="text-[14px] font-display font-bold text-foreground/80">توزيع المشاعر</h3>
            </div>
            <SentimentPieChart
              positive={sentimentCounts.positive}
              negative={sentimentCounts.negative}
              neutral={sentimentCounts.neutral}
              onSliceClick={(sentiment) => setSelectedSentiment(selectedSentiment === sentiment ? null : sentiment)}
            />
          </div>

          {/* Emotions */}
          <div className="card-stagger rounded-2xl bg-card border border-border/40 p-6" style={{ animationDelay: "0.05s" }}>
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-4 h-4 text-muted-foreground/50" strokeWidth={1.8} />
              <h3 className="text-[14px] font-display font-bold text-foreground/80">توزيع العواطف</h3>
            </div>
            <div className="space-y-2.5">
              {Object.entries(emotionCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([emotion, count]) => (
                  <div key={emotion} className="flex items-center gap-3">
                    <Badge className={`${getEmotionBadge(emotion)} border-0 text-[11px] font-bold min-w-[60px] justify-center`}>{emotion}</Badge>
                    <Progress value={(count / totalTweets) * 100} className="flex-1 h-2" />
                    <span className="text-[11px] font-bold text-muted-foreground/50 w-6 text-left nums-en">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Filtered tweets drawer */}
        {selectedSentiment && (
          <div className="card-stagger rounded-2xl bg-card border border-border/40 overflow-hidden" style={{ animationDelay: "0s" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
              <div className="flex items-center gap-2">
                <h3 className="text-[14px] font-display font-bold text-foreground/80">تغريدات &ldquo;{selectedSentiment}&rdquo;</h3>
                <Badge className="bg-foreground text-white border-0 text-[10px] font-bold nums-en">{sentimentFilteredTweets.length}</Badge>
              </div>
              <button onClick={() => setSelectedSentiment(null)} className="p-1.5 rounded-lg hover:bg-muted/30 transition-colors">
                <X className="w-4 h-4 text-muted-foreground/40" />
              </button>
            </div>
            <div className="divide-y divide-border/20 max-h-[400px] overflow-y-auto">
              {sentimentFilteredTweets.map(tweet => (
                <div key={tweet.id} className="px-5 py-4 hover:bg-muted/10 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-muted-foreground/50">{tweet.author}</p>
                      <p className="text-[13px] mt-1 leading-relaxed text-foreground/80">{tweet.text}</p>
                      {tweet.engagement && (
                        <div className="flex gap-3 mt-2 text-[10px] font-bold text-muted-foreground/40 nums-en">
                          <span>{tweet.engagement.likes} إعجاب</span>
                          <span>{tweet.engagement.retweets} إعادة</span>
                          <span>{tweet.engagement.replies} رد</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Badge className={`${getSentimentBadge(tweet.sentiment)} border text-[10px] font-bold`}>{tweet.sentiment}</Badge>
                      <span className="text-[10px] font-bold text-muted-foreground/40 nums-en">{tweet.reach.toLocaleString()} وصول</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════
          SECTION: Topics
          ══════════════════════════════════════════ */}
      <section id="topics" className="scroll-mt-32 space-y-5">
        <SectionHeading icon={Target} color="#FFBC0A">الكلمات المفتاحية والمواضيع</SectionHeading>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Keywords */}
          <div className="card-stagger rounded-2xl bg-card border border-border/40 p-6" style={{ animationDelay: "0s" }}>
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-muted-foreground/50" strokeWidth={1.8} />
              <h3 className="text-[14px] font-display font-bold text-foreground/80">الأكثر تكراراً</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {topKeywords.map(([keyword, count]) => (
                <span
                  key={keyword}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border/40 text-[12px] font-bold text-foreground/70"
                >
                  {keyword}
                  <span className="text-muted-foreground/40 nums-en">({count})</span>
                </span>
              ))}
            </div>
          </div>

          {/* Themes (AI-generated) */}
          {reportInsights && reportInsights.themes.length > 0 && (
            <div className="card-stagger rounded-2xl bg-card border border-border/40 p-6" style={{ animationDelay: "0.05s" }}>
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-4 h-4 text-muted-foreground/50" strokeWidth={1.8} />
                <h3 className="text-[14px] font-display font-bold text-foreground/80">المواضيع الرئيسية</h3>
              </div>
              <div className="space-y-3">
                {reportInsights.themes.map((theme, i) => {
                  const colors = ["#0072F9", "#00C17A", "#FFBC0A", "#F24935", "#8B5CF6"];
                  const color = colors[i % colors.length];
                  return (
                    <div key={i} className="p-3 rounded-xl border" style={{ borderColor: `${color}15`, backgroundColor: `${color}04` }}>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-[13px] font-bold text-foreground/80">{theme.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-muted-foreground/40">{theme.percentage}%</span>
                          <Badge className={`text-[9px] font-bold border-0 ${
                            theme.sentiment === 'إيجابي' ? 'bg-thmanyah-green/10 text-thmanyah-green' :
                            theme.sentiment === 'سلبي' ? 'bg-thmanyah-red/10 text-thmanyah-red' :
                            'bg-muted text-muted-foreground'
                          }`}>{theme.sentiment}</Badge>
                        </div>
                      </div>
                      <p className="text-[11px] font-bold text-muted-foreground/50 leading-relaxed">{theme.description}</p>
                      <div className="mt-2 h-1.5 bg-muted/20 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${theme.percentage}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Topic Categorization */}
        <TopicCategorization tweets={activeTweets} />

        {/* Word Cloud */}
        <div className="space-y-3">
          <h3 className="text-[14px] font-display font-bold text-foreground/70">سحابة الكلمات</h3>
          <WordCloud tweets={activeTweets} />
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION: Timeline
          ══════════════════════════════════════════ */}
      <section id="timeline" className="scroll-mt-32 space-y-5">
        <SectionHeading icon={TrendingUp} color="#0072F9">التحليل الزمني</SectionHeading>
        <p className="text-[11px] font-bold text-muted-foreground/40 -mt-3">اضغط على أي نقطة في الرسم البياني لعرض التغريدات المقابلة</p>
        <TimelineCharts tweets={activeTweets} />
      </section>

      {/* ══════════════════════════════════════════
          SECTION: Issues (AI-generated)
          ══════════════════════════════════════════ */}
      {reportInsights && reportInsights.issues.length > 0 && (
        <section id="issues" className="scroll-mt-32 space-y-5">
          <SectionHeading icon={AlertTriangle} color="#F24935">المشاكل والقضايا</SectionHeading>

          <div className="space-y-4">
            {reportInsights.issues.map((issue, i) => {
              const severityColor = issue.severity === 'high' ? '#F24935' : issue.severity === 'medium' ? '#FFBC0A' : '#6B7280';
              const severityLabel = issue.severity === 'high' ? 'عالي الخطورة' : issue.severity === 'medium' ? 'متوسط الخطورة' : 'منخفض الخطورة';
              return (
                <div
                  key={i}
                  className="card-stagger rounded-2xl bg-card border border-border/40 p-5 space-y-3"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold" style={{ backgroundColor: severityColor }}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[14px] font-bold text-foreground/85 mb-1">{issue.title}</h4>
                      <p className="text-[12px] font-bold text-muted-foreground/50 leading-relaxed">{issue.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mr-10">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: severityColor }}>{severityLabel}</span>
                    {issue.count > 0 && (
                      <span className="text-[10px] font-bold text-muted-foreground/40">{issue.count} تغريدة</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          SECTION: Insights (AI-generated)
          ══════════════════════════════════════════ */}
      {reportInsights && reportInsights.insights.length > 0 && (
        <section id="insights" className="scroll-mt-32 space-y-5">
          <SectionHeading icon={Lightbulb} color="#0072F9">الرؤى والملاحظات</SectionHeading>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {reportInsights.insights.map((insight, i) => (
              <div
                key={i}
                className="card-stagger card-hover-lift rounded-2xl bg-card border border-border/40 p-5 space-y-3"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 p-2 rounded-xl bg-thmanyah-blue/[0.06]">
                    <Lightbulb className="w-4 h-4 text-thmanyah-blue" strokeWidth={1.8} />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-foreground/85 mb-1">{insight.title}</h4>
                    <p className="text-[11px] font-bold text-muted-foreground/50 leading-relaxed">{insight.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          SECTION: Recommendations (AI-generated)
          ══════════════════════════════════════════ */}
      {reportInsights && reportInsights.recommendations.length > 0 && (
        <section id="recommendations" className="scroll-mt-32 space-y-5">
          <SectionHeading icon={CheckCircle} color="#00C17A">التوصيات</SectionHeading>

          <div className="space-y-4">
            {reportInsights.recommendations.map((rec, i) => (
              <div
                key={i}
                className="card-stagger rounded-2xl bg-card border border-border/40 p-5"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 p-2 rounded-xl bg-thmanyah-green/[0.06]">
                    <CheckCircle className="w-4 h-4 text-thmanyah-green" strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-[13px] font-bold text-foreground/85">{rec.title}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        rec.priority === 'high' ? 'bg-thmanyah-red/10 text-thmanyah-red' :
                        rec.priority === 'medium' ? 'bg-thmanyah-amber/10 text-thmanyah-amber' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        الأولوية: {rec.priority === 'high' ? 'عالية' : rec.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-muted-foreground/50 leading-relaxed">{rec.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          SECTION: Summary (AI-generated)
          ══════════════════════════════════════════ */}
      {reportInsights && (
        <section id="summary" className="scroll-mt-32 space-y-5">
          <SectionHeading icon={FileText} color="#8B5CF6">الملخص العام</SectionHeading>

          <div className="card-stagger rounded-2xl bg-card border border-border/40 p-6 space-y-4" style={{ animationDelay: "0s" }}>
            <div>
              <h4 className="text-[13px] font-display font-bold text-foreground/70 mb-2">ملخص التقرير</h4>
              <p className="text-[13px] font-bold text-foreground/80 leading-relaxed">{reportInsights.overall_summary}</p>
            </div>
            <div className="h-px bg-border/40" />
            <div>
              <h4 className="text-[13px] font-display font-bold text-foreground/70 mb-2">تحليل المشاعر</h4>
              <p className="text-[13px] font-bold text-foreground/80 leading-relaxed">{reportInsights.sentiment_analysis}</p>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          SECTION: All Tweets
          ══════════════════════════════════════════ */}
      <section id="tweets" className="scroll-mt-32 space-y-5">
        <div className="flex items-center gap-2">
          <SectionHeading icon={MessageSquare} color="#494C6B">جميع التغريدات المحللة</SectionHeading>
          <Badge className="bg-foreground text-white border-0 text-[10px] font-bold nums-en mr-2">{totalTweets}</Badge>
        </div>

        <div className="space-y-2">
          {activeTweets.map((tweet, i) => (
            <div
              key={tweet.id}
              className="card-stagger rounded-xl bg-card border border-border/30 px-5 py-4 hover:border-border/50 transition-colors"
              style={{ animationDelay: `${Math.min(i * 0.02, 0.5)}s` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-muted-foreground/40">{tweet.author}</p>
                  <p className="text-[13px] mt-1 leading-relaxed text-foreground/80">{tweet.text}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tweet.keywords.map((kw, ki) => (
                      <span key={ki} className="px-2 py-0.5 rounded-full bg-muted/40 text-[10px] font-bold text-muted-foreground/50">{kw}</span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <Badge className={`${getSentimentBadge(tweet.sentiment)} border text-[10px] font-bold`}>{tweet.sentiment}</Badge>
                  <Badge className={`${getEmotionBadge(tweet.emotion)} border-0 text-[10px] font-bold`}>{tweet.emotion}</Badge>
                  <span className="text-[10px] font-bold text-muted-foreground/30 nums-en">{tweet.reach.toLocaleString()} وصول</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Back to top ── */}
      <div className="flex justify-center pb-4">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-muted/40 border border-border/30 text-[11px] font-bold text-muted-foreground/50 hover:text-foreground hover:border-border transition-all"
        >
          <ChevronUp className="w-3.5 h-3.5" />
          العودة للأعلى
        </button>
      </div>
    </div>
  );
};

export default MeltwaterReport;

/* ══════════════════════════════════════════════════════════════
   Sub-components
   ══════════════════════════════════════════════════════════════ */

function SectionHeading({ icon: Icon, color, children }: { icon: React.ElementType; color: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-xl" style={{ backgroundColor: `${color}10`, color }}>
        <Icon className="w-4.5 h-4.5" strokeWidth={1.8} />
      </div>
      <h2 className="text-lg font-display font-bold text-foreground/85">{children}</h2>
      <div className="flex-1 h-px bg-border/40" />
    </div>
  );
}

function KpiCard({ label, value, sub, color, delay }: { label: string; value: string; sub: string; color: string; delay: number }) {
  return (
    <div
      className="card-stagger card-hover-lift rounded-2xl bg-card border border-border/40 p-5"
      style={{ animationDelay: `${delay * 0.06}s` }}
    >
      <p className="text-[11px] font-bold mb-2" style={{ color: `${color}99` }}>{label}</p>
      <p className="text-2xl font-bold nums-en mb-1" style={{ color }}>{value}</p>
      <p className="text-[10px] font-bold text-muted-foreground/40 nums-en">{sub}</p>
    </div>
  );
}

function MiniStat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div>
      <p className="text-xl font-bold nums-en" style={{ color }}>{value}</p>
      <p className="text-[10px] font-bold text-muted-foreground/50">{label}</p>
    </div>
  );
}


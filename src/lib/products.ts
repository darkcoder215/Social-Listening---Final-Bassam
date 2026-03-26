export interface Product {
  id: string;
  name: string;
  category: "podcast" | "newsletter" | "program" | "sports";
  hashtags: string[];
  textTerms: string[];
}

export const PRODUCTS: Product[] = [
  // بودكاستات
  { id: "fnjan", name: "فنجان", category: "podcast", hashtags: ["بودكاست_فنجان", "فنجان"], textTerms: ["فنجان"] },
  { id: "mortada", name: "مرتدة", category: "podcast", hashtags: ["بودكاست_مرتدة", "مرتدة"], textTerms: ["مرتدة"] },
  { id: "socrates", name: "سقراط", category: "podcast", hashtags: ["بودكاست_سقراط", "سقراط"], textTerms: ["سقراط"] },
  { id: "jadi", name: "جادي", category: "podcast", hashtags: ["بودكاست_جادي", "جادي", "نشرة_جادي"], textTerms: ["جادي"] },
  { id: "arbah", name: "أرباح", category: "podcast", hashtags: ["بودكاست_أرباح", "أرباح"], textTerms: ["أرباح"] },
  { id: "fajr", name: "الفجر", category: "podcast", hashtags: ["بودكاست_الفجر"], textTerms: ["الفجر"] },
  { id: "daraja", name: "درجة أولى", category: "podcast", hashtags: ["درجة_أولى", "بودكاست_درجة_أولى"], textTerms: ["درجة أولى"] },
  { id: "adam", name: "آدم", category: "podcast", hashtags: ["بودكاست_آدم", "آدم"], textTerms: ["آدم"] },
  { id: "manchit", name: "مانشيت", category: "podcast", hashtags: ["بودكاست_مانشيت"], textTerms: ["مانشيت"] },
  { id: "morabba", name: "مربع", category: "podcast", hashtags: ["بودكاست_مربع"], textTerms: ["مربع"] },
  { id: "aswat", name: "أصوات", category: "podcast", hashtags: ["بودكاست_أصوات", "أصوات"], textTerms: ["أصوات"] },
  { id: "kawalis", name: "كواليس", category: "podcast", hashtags: ["بودكاست_كواليس"], textTerms: ["كواليس"] },
  { id: "souq", name: "السوق", category: "podcast", hashtags: ["بودكاست_السوق"], textTerms: ["السوق"] },
  { id: "ihtyal", name: "احتيال", category: "podcast", hashtags: ["بودكاست_احتيال"], textTerms: ["احتيال"] },
  { id: "sharika", name: "الشركة", category: "podcast", hashtags: ["بودكاست_الشركة"], textTerms: ["الشركة"] },
  { id: "arba3", name: "أرباع", category: "podcast", hashtags: ["بودكاست_أرباع"], textTerms: ["أرباع"] },
  { id: "imshi", name: "امشِ مع", category: "podcast", hashtags: ["امش_مع", "امشِ_مع", "بودكاست_امش_مع"], textTerms: ["امشي مع", "امش مع"] },
  { id: "cinema", name: "النشرة السينمائية", category: "podcast", hashtags: ["النشرة_السينمائية", "بودكاست_النشرة_السينمائية"], textTerms: ["النشرة السينمائية"] },
  { id: "swalef", name: "سوالف بزنس", category: "podcast", hashtags: ["سوالف_بزنس"], textTerms: ["سوالف بزنس"] },
  { id: "thaqal", name: "ذا قال", category: "podcast", hashtags: ["ذا_قال"], textTerms: ["ذا قال", "ذاقال"] },
  { id: "ghayratna", name: "أشياء غيرتنا", category: "podcast", hashtags: ["أشياء_غيرتنا"], textTerms: ["أشياء غيرتنا"] },
  { id: "asmar", name: "أسمار", category: "podcast", hashtags: ["أسمار_مع_خالد_اليحيا"], textTerms: ["أسمار"] },
  { id: "genome", name: "جينوم", category: "podcast", hashtags: ["جينوم", "جينوم_الوثائقية"], textTerms: ["جينوم"] },

  // نشرات
  { id: "aha", name: "أها", category: "newsletter", hashtags: ["نشرة_أها", "أها"], textTerms: ["أها"] },
  { id: "folan", name: "فلان", category: "newsletter", hashtags: ["فلان", "نشرة_فلان"], textTerms: ["فلان"] },
  { id: "ilkh", name: "إلخ", category: "newsletter", hashtags: ["نشرة_إلخ", "إلخ"], textTerms: ["إلخ"] },
  { id: "safha", name: "الصفحة الأخيرة", category: "newsletter", hashtags: ["الصفحة_الأخيرة", "نشرة_الصفحة_الأخيرة"], textTerms: ["الصفحة الأخيرة"] },
  { id: "amakin", name: "أماكن", category: "newsletter", hashtags: ["نشرة_أماكن", "أماكن"], textTerms: ["أماكن"] },
  { id: "qoroush", name: "القروش", category: "newsletter", hashtags: ["نشرة_القروش"], textTerms: ["القروش"] },
  { id: "maqadir", name: "مقادير", category: "newsletter", hashtags: ["نشرة_مقادير"], textTerms: ["مقادير"] },
  { id: "bokra", name: "بكرة", category: "newsletter", hashtags: ["نشرة_بكرة", "بودكاست_بكرة"], textTerms: ["بكرة"] },
  { id: "jubrain", name: "الجبرين الاقتصادية", category: "newsletter", hashtags: ["نشرة_الجبرين_الاقتصادية", "الجبرين_الاقتصادية"], textTerms: ["الجبرين الاقتصادية"] },
  { id: "khutut", name: "بين الخطوط", category: "newsletter", hashtags: ["بين_الخطوط"], textTerms: ["بين الخطوط"] },
  { id: "masdar", name: "مصدر مطّلع", category: "newsletter", hashtags: ["مصدر_مطّلع"], textTerms: ["مصدر مطلع", "مصدر مطّلع"] },
  { id: "namat", name: "نمط", category: "newsletter", hashtags: ["نشرة_نمط"], textTerms: ["نمط"] },

  // برامج
  { id: "tashkila", name: "تشكيلة", category: "program", hashtags: ["برنامج_تشكيلة", "تشكيلة"], textTerms: ["تشكيلة"] },
  { id: "siyaq", name: "سياق", category: "program", hashtags: ["سياق"], textTerms: ["سياق"] },
  { id: "riojay", name: "ريو جاي", category: "program", hashtags: ["ريو_جاي"], textTerms: ["ريوجاي", "ريو جاي"] },
  { id: "kharij", name: "خارج التغطية", category: "program", hashtags: ["خارج_التغطية"], textTerms: ["خارج التغطية"] },
  { id: "qabil", name: "قابل للنشر", category: "program", hashtags: ["قابل_للنشر"], textTerms: ["قابل للنشر"] },
  { id: "wain", name: "وين نكشت", category: "program", hashtags: ["وين_نكشت"], textTerms: ["وين نكشت"] },
  { id: "iksir", name: "إكسير اليقظة", category: "program", hashtags: ["إكسير_اليقظة"], textTerms: ["إكسير اليقظة"] },
  { id: "jawab", name: "جواب", category: "program", hashtags: ["أفلام_جواب"], textTerms: ["جواب"] },
  { id: "ra3i", name: "من راعي السالفة", category: "program", hashtags: [], textTerms: ["من راعي السالفة"] },
  { id: "8ashya", name: "ثمانية أشياء", category: "program", hashtags: ["ثمانية_أشياء"], textTerms: ["ثمانية أشياء"] },
  { id: "8as2ila", name: "ثمانية أسئلة", category: "program", hashtags: ["ثمانية_أسئلة"], textTerms: ["ثمانية أسئلة"] },
  { id: "rihla", name: "رحلة مع أنس إسكندر", category: "program", hashtags: ["رحلة_مع_أنس_إسكندر"], textTerms: ["أنس إسكندر"] },
  { id: "iftar", name: "قصة إفطار صائم", category: "program", hashtags: ["قصة_إفطار_صائم"], textTerms: ["إفطار صائم"] },

  // رياضة ثمانية
  { id: "studio", name: "استديو الجماهير", category: "sports", hashtags: ["استديو_الجماهير"], textTerms: ["استديو الجماهير"] },
  { id: "aghla", name: "أغلى الكؤوس", category: "sports", hashtags: ["أغلى_الكؤوس"], textTerms: ["أغلى الكؤوس"] },
  { id: "khalil", name: "تحليل خليل", category: "sports", hashtags: ["تحليل_خليل"], textTerms: ["تحليل خليل"] },
  { id: "jawla", name: "حول الجولة", category: "sports", hashtags: ["حول_الجولة"], textTerms: ["حول الجولة"] },
  { id: "mowazi", name: "الدوري الموازي", category: "sports", hashtags: ["الدوري_الموازي"], textTerms: ["الدوري الموازي"] },
  { id: "tabkh", name: "طبخ استراحات", category: "sports", hashtags: ["طبخ_استراحات"], textTerms: ["طبخ استراحات"] },
  { id: "tawsiyat", name: "توصيات معيشية", category: "sports", hashtags: ["توصيات_معيشية"], textTerms: ["توصيات معيشية"] },
  { id: "dalila", name: "دليلة الرياض", category: "sports", hashtags: ["دليلة_الرياض"], textTerms: ["دليلة الرياض"] },
  { id: "taqatu3", name: "تقاطع ثقافي", category: "sports", hashtags: ["تقاطع_ثقافي"], textTerms: ["تقاطع ثقافي"] },
  { id: "masida", name: "المصيدة", category: "sports", hashtags: [], textTerms: ["المصيدة"] },
  { id: "matat", name: "مطاط", category: "sports", hashtags: ["برنامج_مطّاط"], textTerms: ["مطاط", "مطّاط"] },
];

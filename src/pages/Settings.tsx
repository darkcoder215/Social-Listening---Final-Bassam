import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Settings as SettingsIcon,
  Upload,
  Cpu,
  Key,
  Users,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  RefreshCw,
  Save,
  CircleCheck,
  CircleX,
  Sparkles,
  BarChart3,
  ChevronDown,
  GripVertical,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Check,
  X,
  Zap,
  FileText,
  Download,
  Bot,
  Calculator,
  Clock,
  Play,
  Pause,
  Activity,
} from "lucide-react";
import PageExplainer from "@/components/PageExplainer";
import {
  loadApiKeys,
  saveApiKeys,
  type ApiKeys,
  AI_MODELS,
  loadSelectedModel,
  saveSelectedModel,
  loadMetrics,
  saveMetrics,
  type AnalysisMetric,
  hasRequiredKeys,
} from "@/lib/settings";

type ActiveTab = "import" | "ai" | "api" | "accounts" | "apify" | "tokens";

const TABS: { id: ActiveTab; label: string; icon: React.ElementType; color: string }[] = [
  { id: "import", label: "استيراد البيانات", icon: Upload, color: "#0072F9" },
  { id: "ai", label: "تحليل الذكاء الاصطناعي", icon: Cpu, color: "#00C17A" },
  { id: "api", label: "مفاتيح API", icon: Key, color: "#FFBC0A" },
  { id: "accounts", label: "الحسابات المراقبة", icon: Users, color: "#ff0050" },
  { id: "apify", label: "Apify Actors", icon: Bot, color: "#8B5CF6" },
  { id: "tokens", label: "حاسبة التوكنات", icon: Calculator, color: "#0072F9" },
];

export default function Settings() {
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as ActiveTab) || "import";
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageExplainer
        icon={SettingsIcon}
        title="الإعدادات والإدارة"
        description="أدر استيراد البيانات ومفاتيح API وإعدادات الذكاء الاصطناعي والحسابات المراقبة من مكان واحد"
        color="#00C17A"
      />

      {/* Tab Navigation */}
      <div className="card-stagger flex flex-wrap gap-2" style={{ animationDelay: "0.05s" }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-bold transition-all duration-200 ${
                isActive
                  ? "bg-foreground text-white shadow-md"
                  : "bg-card border border-border/50 text-muted-foreground/60 hover:text-foreground hover:border-border"
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={1.8} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="page-enter" key={activeTab}>
        {activeTab === "import" && <ImportTab />}
        {activeTab === "ai" && <AITab />}
        {activeTab === "api" && <APIKeysTab />}
        {activeTab === "accounts" && <AccountsTab />}
        {activeTab === "apify" && <ApifyActorsTab />}
        {activeTab === "tokens" && <TokenCalculatorTab />}
      </div>
    </div>
  );
}

function ImportTab() {
  const jobs = [
    { id: 1, filename: "meltwater_export_jan.csv", status: "مكتمل", rows: 1240, date: "2024-01-15" },
    { id: 2, filename: "tweets_feb_2024.xlsx", status: "مكتمل", rows: 856, date: "2024-02-20" },
    { id: 3, filename: "social_data_march.csv", status: "فشل", rows: 0, date: "2024-03-01" },
  ];

  const downloadTemplate = () => {
    const headers = ["text", "author", "author_name", "platform", "sentiment", "emotion", "confidence", "likes", "comments", "shares", "views", "created_at", "url", "keywords", "reason"];
    const exampleRows = [
      ["بودكاست فنجان من أفضل المحتويات العربية", "khalid_m92", "خالد المطيري", "x", "positive", "حماس", "0.95", "342", "28", "67", "", "2026-03-08T14:30:00Z", "https://x.com/...", "فنجان,بودكاست,جودة", "تعبير واضح عن الإعجاب"],
      ["جودة الصوت في الحلقة الأخيرة سيئة جداً", "sara_tech", "سارة التقنية", "x", "negative", "إحباط", "0.88", "89", "45", "12", "", "2026-03-07T09:15:00Z", "https://x.com/...", "صوت,جودة,تقطيع", "شكوى من مشكلة تقنية"],
      ["ثمانية أعلنت عن بودكاست جديد", "media_watcher", "مراقب إعلامي", "x", "neutral", "محايد", "0.91", "156", "23", "89", "", "2026-03-05T12:00:00Z", "https://x.com/...", "بودكاست,جديد,إعلان", "خبر إعلامي بدون توجه"],
      ["هذا المقطع من ثمانية غيّر حياتي", "home_lover", "منيرة الديكور", "tiktok", "positive", "فرح", "0.96", "45200", "890", "12300", "890000", "2026-03-08T10:00:00Z", "https://tiktok.com/...", "مطبخ,تنظيم,نصائح", "تأثير إيجابي على المتابع"],
      ["ريلز ثمانية رياضة احترافي", "reel_lover", "ناصر السينمائي", "instagram", "positive", "فرح", "0.93", "34500", "567", "4500", "", "2026-03-07T20:30:00Z", "https://instagram.com/...", "ريلز,مونتاج,احترافي", "تقدير لجودة الإنتاج"],
    ];
    const csvContent = [headers.join(","), ...exampleRows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "thmanyah_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-card border border-border/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-display font-bold text-foreground/85">رفع ملف جديد</h3>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-thmanyah-blue/10 border border-thmanyah-blue/20 text-[11px] font-bold text-thmanyah-blue hover:bg-thmanyah-blue/20 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            تحميل ملف نموذجي
          </button>
        </div>
        <div className="rounded-xl border-2 border-dashed border-border/60 hover:border-thmanyah-blue/30 transition-all p-8 text-center cursor-pointer">
          <Upload className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-[13px] font-bold text-foreground/70">اسحب الملف هنا أو اضغط للاختيار</p>
          <p className="text-[11px] font-bold text-muted-foreground/40 mt-1">يدعم ملفات CSV و XLSX — الحد الأقصى 50 ميغابايت</p>
        </div>
        {/* Column guide */}
        <div className="mt-4 p-3 rounded-xl bg-muted/10 border border-border/20">
          <p className="text-[11px] font-bold text-foreground/60 mb-2">الأعمدة المطلوبة في الملف:</p>
          <div className="flex flex-wrap gap-1.5">
            {["text (النص)", "author (الكاتب)", "platform (المنصة)", "sentiment (المشاعر)", "emotion (العاطفة)", "confidence (الثقة)", "likes", "comments", "shares", "views", "created_at", "url", "keywords", "reason"].map((col) => (
              <span key={col} className="px-2 py-0.5 rounded text-[9px] font-bold bg-thmanyah-blue/10 text-thmanyah-blue/70">{col}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
        <div className="p-5 border-b border-border/30">
          <h3 className="text-[14px] font-display font-bold text-foreground/85">سجل الاستيراد</h3>
        </div>
        <div className="divide-y divide-border/20">
          {jobs.map((job, i) => (
            <div key={job.id} className="card-stagger flex items-center gap-4 p-4 hover:bg-muted/10 transition-colors" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className={`p-2 rounded-lg ${job.status === "مكتمل" ? "bg-thmanyah-green/10" : "bg-thmanyah-red/10"}`}>
                {job.status === "مكتمل" ? <CheckCircle className="w-4 h-4 text-thmanyah-green" /> : <AlertTriangle className="w-4 h-4 text-thmanyah-red" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-foreground/80 truncate">{job.filename}</p>
                <p className="text-[11px] font-bold text-muted-foreground/40">{job.date} — {job.rows > 0 ? `${job.rows} سجل` : "لا توجد بيانات"}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${job.status === "مكتمل" ? "bg-thmanyah-green/10 text-thmanyah-green" : "bg-thmanyah-red/10 text-thmanyah-red"}`}>
                {job.status}
              </span>
              <button className="p-1.5 rounded-lg hover:bg-muted/30 transition-colors"><Trash2 className="w-3.5 h-3.5 text-muted-foreground/30" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   AI Tab — Model selector + Analysis Metrics Builder
   ═══════════════════════════════════════════════════════════════════ */

function AITab() {
  const [selectedModel, setSelectedModel] = useState(loadSelectedModel);
  const [modelSaved, setModelSaved] = useState(false);
  const [metrics, setMetrics] = useState<AnalysisMetric[]>(loadMetrics);
  const [metricsSaved, setMetricsSaved] = useState(false);

  // New metric builder state
  const [showBuilder, setShowBuilder] = useState(false);
  const [newMetric, setNewMetric] = useState({ name: "", nameEn: "", description: "", type: "text" as AnalysisMetric["type"], categoryOptions: "" });
  const [previewData, setPreviewData] = useState<{ example: string; loading: boolean } | null>(null);

  const keysStatus = hasRequiredKeys();

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    saveSelectedModel(modelId);
    setModelSaved(true);
    setTimeout(() => setModelSaved(false), 2000);
  };

  const toggleMetric = (id: string) => {
    const updated = metrics.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m));
    setMetrics(updated);
    saveMetrics(updated);
    setMetricsSaved(true);
    setTimeout(() => setMetricsSaved(false), 1500);
  };

  const deleteMetric = (id: string) => {
    const updated = metrics.filter((m) => m.id !== id);
    setMetrics(updated);
    saveMetrics(updated);
  };

  const generatePreview = () => {
    if (!newMetric.name || !newMetric.nameEn || !newMetric.description) return;
    setPreviewData({ example: "", loading: true });

    // Generate a realistic example based on type
    setTimeout(() => {
      let example = "";
      const sampleTweet = `"ثمانية من أفضل المنصات العربية، محتوى رائع ومميز"`;

      switch (newMetric.type) {
        case "text":
          example = `{\n  "${newMetric.nameEn}": "مثال: ${newMetric.description.slice(0, 60)}"\n}`;
          break;
        case "number":
          example = `{\n  "${newMetric.nameEn}": 0.85\n}`;
          break;
        case "category": {
          const opts = newMetric.categoryOptions.split(",").map((o) => o.trim()).filter(Boolean);
          example = `{\n  "${newMetric.nameEn}": "${opts[0] || "category_1"}"\n}`;
          break;
        }
        case "list":
          example = `{\n  "${newMetric.nameEn}": ["عنصر 1", "عنصر 2"]\n}`;
          break;
      }

      setPreviewData({
        example: `تغريدة: ${sampleTweet}\n\nالنتيجة المتوقعة:\n${example}`,
        loading: false,
      });
    }, 800);
  };

  const confirmAddMetric = () => {
    if (!newMetric.name || !newMetric.nameEn || !newMetric.description) return;

    const metric: AnalysisMetric = {
      id: `custom_${Date.now()}`,
      name: newMetric.name,
      nameEn: newMetric.nameEn.replace(/\s+/g, "_").toLowerCase(),
      description: newMetric.description,
      type: newMetric.type,
      categoryOptions: newMetric.type === "category" ? newMetric.categoryOptions.split(",").map((o) => o.trim()).filter(Boolean) : undefined,
      enabled: true,
    };

    const updated = [...metrics, metric];
    setMetrics(updated);
    saveMetrics(updated);
    setNewMetric({ name: "", nameEn: "", description: "", type: "text", categoryOptions: "" });
    setPreviewData(null);
    setShowBuilder(false);
    setMetricsSaved(true);
    setTimeout(() => setMetricsSaved(false), 1500);
  };

  const currentModel = AI_MODELS.find((m) => m.id === selectedModel) || AI_MODELS[0];

  return (
    <div className="space-y-4">
      {/* API Key warning */}
      {!keysStatus.openrouter && (
        <div className="rounded-2xl bg-thmanyah-amber/5 border border-thmanyah-amber/20 p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-thmanyah-amber shrink-0 mt-0.5" />
          <div>
            <p className="text-[12px] font-bold text-foreground/70">جميع النماذج جاهزة — أضف مفتاح OpenRouter لتفعيل التحليل</p>
            <p className="text-[11px] font-bold text-muted-foreground/40 mt-0.5">اذهب إلى تبويب &quot;مفاتيح API&quot; لإضافة المفتاح وتشغيل أي نموذج</p>
          </div>
        </div>
      )}

      {/* ── Model Selector ── */}
      <div className="rounded-2xl bg-card border border-border/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-thmanyah-green" />
            <h3 className="text-[14px] font-display font-bold text-foreground/85">نموذج الذكاء الاصطناعي</h3>
          </div>
          {modelSaved && (
            <span className="text-[11px] font-bold text-thmanyah-green flex items-center gap-1">
              <CircleCheck className="w-3 h-3" /> تم الحفظ
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {AI_MODELS.map((model) => {
            const isSelected = selectedModel === model.id;
            return (
              <button
                key={model.id}
                onClick={() => handleModelChange(model.id)}
                className={`relative text-right p-4 rounded-xl border-2 transition-all duration-200 ${
                  isSelected
                    ? "border-thmanyah-green bg-thmanyah-green/5 shadow-sm"
                    : "border-border/40 bg-muted/10 hover:border-border hover:bg-muted/20"
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 left-3">
                    <CircleCheck className="w-4 h-4 text-thmanyah-green" />
                  </div>
                )}
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: model.color }} />
                  <span className="text-[13px] font-bold text-foreground/85" dir="ltr">{model.name}</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-muted/30 text-muted-foreground/50" dir="ltr">{model.provider}</span>
                </div>
                <p className="text-[11px] font-bold text-muted-foreground/50 leading-relaxed">{model.description}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-4 px-3 py-2.5 rounded-xl bg-muted/15 border border-border/30">
          <p className="text-[11px] font-bold text-muted-foreground/40">
            النموذج المختار: <span className="text-foreground/70" dir="ltr">{currentModel.name}</span> — جميع النماذج تعمل عبر OpenRouter بمفتاح واحد
          </p>
        </div>
      </div>

      {/* ── Analysis Metrics ── */}
      <div className="rounded-2xl bg-card border border-border/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-thmanyah-blue" />
            <h3 className="text-[14px] font-display font-bold text-foreground/85">معايير التحليل</h3>
          </div>
          <div className="flex items-center gap-2">
            {metricsSaved && (
              <span className="text-[11px] font-bold text-thmanyah-green flex items-center gap-1">
                <CircleCheck className="w-3 h-3" /> تم الحفظ
              </span>
            )}
            <span className="text-[10px] font-bold text-muted-foreground/40">
              {metrics.filter((m) => m.enabled).length} معيار مُفعّل
            </span>
          </div>
        </div>

        <p className="text-[11px] font-bold text-muted-foreground/40 mb-4 leading-relaxed">
          حدد المعايير التي يستخلصها الذكاء الاصطناعي من كل تغريدة. يمكنك تعطيل المعايير غير المطلوبة أو إضافة معايير جديدة مخصصة.
        </p>

        {/* Metrics List */}
        <div className="space-y-2 mb-4">
          {metrics.map((metric) => {
            const isDefault = ["sentiment", "confidence", "emotion", "reason", "keywords"].includes(metric.id);
            const typeLabels: Record<string, string> = { text: "نص", number: "رقم", category: "تصنيف", list: "قائمة" };
            return (
              <div
                key={metric.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  metric.enabled ? "bg-muted/10 border-border/40" : "bg-muted/5 border-border/20 opacity-60"
                }`}
              >
                <GripVertical className="w-3.5 h-3.5 text-muted-foreground/20 shrink-0" />
                <button onClick={() => toggleMetric(metric.id)} className="shrink-0">
                  {metric.enabled ? (
                    <ToggleRight className="w-5 h-5 text-thmanyah-green" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 text-muted-foreground/30" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold text-foreground/80">{metric.name}</span>
                    <span className="text-[10px] font-bold text-muted-foreground/30 font-mono" dir="ltr">{metric.nameEn}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-muted/30 text-muted-foreground/40">
                      {typeLabels[metric.type] || metric.type}
                    </span>
                    {isDefault && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-thmanyah-blue/10 text-thmanyah-blue">أساسي</span>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground/40 mt-0.5 truncate">{metric.description}</p>
                </div>
                {!isDefault && (
                  <button
                    onClick={() => deleteMetric(metric.id)}
                    className="p-1.5 rounded-lg hover:bg-thmanyah-red/10 transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground/30 hover:text-thmanyah-red" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Add New Metric Button */}
        {!showBuilder && (
          <button
            onClick={() => setShowBuilder(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-border/40 text-[12px] font-bold text-muted-foreground/50 hover:text-foreground hover:border-border transition-all"
          >
            <Plus className="w-4 h-4" />
            إضافة معيار تحليل جديد
          </button>
        )}

        {/* ── New Metric Builder ── */}
        {showBuilder && (
          <div className="rounded-xl border-2 border-thmanyah-green/30 bg-thmanyah-green/5 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-thmanyah-green" />
                <h4 className="text-[13px] font-bold text-foreground/85">معيار جديد</h4>
              </div>
              <button onClick={() => { setShowBuilder(false); setPreviewData(null); }} className="p-1 rounded-lg hover:bg-muted/30">
                <X className="w-4 h-4 text-muted-foreground/40" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-foreground/60 block mb-1">الاسم (عربي)</label>
                <input
                  value={newMetric.name}
                  onChange={(e) => setNewMetric((p) => ({ ...p, name: e.target.value }))}
                  placeholder="مثال: درجة الإلحاح"
                  className="w-full py-2 px-3 rounded-lg bg-white/50 dark:bg-muted/20 border border-border/50 text-[12px] font-bold text-foreground/80 placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-thmanyah-green/20"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-foreground/60 block mb-1">المعرّف (إنجليزي)</label>
                <input
                  value={newMetric.nameEn}
                  onChange={(e) => setNewMetric((p) => ({ ...p, nameEn: e.target.value }))}
                  placeholder="مثال: urgency_score"
                  dir="ltr"
                  className="w-full py-2 px-3 rounded-lg bg-white/50 dark:bg-muted/20 border border-border/50 text-[12px] font-bold text-foreground/80 placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-thmanyah-green/20 text-left"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-foreground/60 block mb-1">وصف المعيار (ما الذي تريد استخلاصه؟)</label>
              <textarea
                value={newMetric.description}
                onChange={(e) => setNewMetric((p) => ({ ...p, description: e.target.value }))}
                placeholder="مثال: تقييم مدى إلحاح الموضوع المذكور في التغريدة وهل يحتاج تدخل فوري"
                rows={2}
                className="w-full py-2 px-3 rounded-lg bg-white/50 dark:bg-muted/20 border border-border/50 text-[12px] font-bold text-foreground/80 placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-thmanyah-green/20 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-foreground/60 block mb-1">نوع القيمة</label>
                <select
                  value={newMetric.type}
                  onChange={(e) => setNewMetric((p) => ({ ...p, type: e.target.value as AnalysisMetric["type"] }))}
                  className="w-full py-2 px-3 rounded-lg bg-white/50 dark:bg-muted/20 border border-border/50 text-[12px] font-bold text-foreground/80 focus:outline-none focus:ring-2 focus:ring-thmanyah-green/20"
                >
                  <option value="text">نص حر</option>
                  <option value="number">رقم (0-1 أو أي نطاق)</option>
                  <option value="category">تصنيف من خيارات محددة</option>
                  <option value="list">قائمة عناصر</option>
                </select>
              </div>
              {newMetric.type === "category" && (
                <div>
                  <label className="text-[11px] font-bold text-foreground/60 block mb-1">الخيارات (مفصولة بفاصلة)</label>
                  <input
                    value={newMetric.categoryOptions}
                    onChange={(e) => setNewMetric((p) => ({ ...p, categoryOptions: e.target.value }))}
                    placeholder="عالي, متوسط, منخفض"
                    className="w-full py-2 px-3 rounded-lg bg-white/50 dark:bg-muted/20 border border-border/50 text-[12px] font-bold text-foreground/80 placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-thmanyah-green/20"
                  />
                </div>
              )}
            </div>

            {/* Preview Section */}
            {previewData && (
              <div className="rounded-lg border border-border/40 bg-white/30 dark:bg-muted/10 overflow-hidden">
                <div className="px-3 py-2 border-b border-border/30 flex items-center gap-2">
                  <FileText className="w-3 h-3 text-muted-foreground/40" />
                  <span className="text-[10px] font-bold text-muted-foreground/50">معاينة النتيجة المتوقعة</span>
                </div>
                <div className="p-3">
                  {previewData.loading ? (
                    <div className="flex items-center justify-center gap-2 py-4">
                      <Loader2 className="w-4 h-4 animate-spin text-thmanyah-green" />
                      <span className="text-[11px] font-bold text-muted-foreground/40">جاري إنشاء المعاينة...</span>
                    </div>
                  ) : (
                    <pre className="text-[11px] font-mono text-foreground/70 whitespace-pre-wrap leading-relaxed" dir="ltr">
                      {previewData.example}
                    </pre>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              {!previewData ? (
                <button
                  onClick={generatePreview}
                  disabled={!newMetric.name || !newMetric.nameEn || !newMetric.description}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-thmanyah-blue text-white text-[12px] font-bold transition-all hover:bg-thmanyah-blue/90 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Eye className="w-3.5 h-3.5" />
                  معاينة
                </button>
              ) : !previewData.loading ? (
                <button
                  onClick={confirmAddMetric}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-thmanyah-green text-white text-[12px] font-bold transition-all hover:bg-thmanyah-green/90"
                >
                  <Check className="w-3.5 h-3.5" />
                  تأكيد وإضافة المعيار
                </button>
              ) : null}
              <button
                onClick={() => { setShowBuilder(false); setPreviewData(null); setNewMetric({ name: "", nameEn: "", description: "", type: "text", categoryOptions: "" }); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border/50 text-[12px] font-bold text-muted-foreground/60 hover:text-foreground transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Concurrency Setting */}
      <div className="rounded-2xl bg-card border border-border/50 p-6">
        <h3 className="text-[14px] font-display font-bold text-foreground/85 mb-3">إعدادات الأداء</h3>
        <div>
          <label className="text-[12px] font-bold text-foreground/70 block mb-1.5">عدد العمليات المتزامنة</label>
          <select className="w-full py-2.5 px-3 rounded-xl bg-muted/20 border border-border/50 text-[13px] font-bold text-foreground/80 focus:outline-none focus:ring-2 focus:ring-thmanyah-green/20">
            <option>2 عمليات</option>
            <option>4 عمليات</option>
            <option>8 عمليات</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function APIKeysTab() {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [keys, setKeys] = useState<ApiKeys>({ apify: "", openrouter: "" });
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setKeys(loadApiKeys());
  }, []);

  const handleSave = (id: keyof ApiKeys) => {
    saveApiKeys(keys);
    setSaved((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => setSaved((prev) => ({ ...prev, [id]: false })), 2000);
  };

  const apiKeyFields: { id: keyof ApiKeys; label: string; description: string; placeholder: string }[] = [
    { id: "apify", label: "Apify API Token", description: "مطلوب لجلب التغريدات من تويتر عبر Twitter Scraper", placeholder: "apify_api_..." },
    { id: "openrouter", label: "OpenRouter API Key", description: "مطلوب لتحليل المشاعر بالذكاء الاصطناعي — يدعم جميع النماذج", placeholder: "sk-or-..." },
  ];

  return (
    <div className="space-y-4">
      {/* Status banner */}
      <div className="card-stagger rounded-2xl bg-card border border-border/50 p-5">
        <h3 className="text-[14px] font-display font-bold text-foreground/85 mb-3">حالة الاتصال</h3>
        <div className="grid grid-cols-2 gap-3">
          {apiKeyFields.map((field) => {
            const hasKey = keys[field.id].trim().length > 0;
            return (
              <div key={field.id} className="flex items-center gap-2 p-3 rounded-xl bg-muted/20">
                {hasKey ? (
                  <CircleCheck className="w-4 h-4 text-thmanyah-green shrink-0" />
                ) : (
                  <CircleX className="w-4 h-4 text-thmanyah-red shrink-0" />
                )}
                <span className="text-[12px] font-bold text-foreground/70">{field.label}</span>
                <span className={`mr-auto text-[10px] font-bold ${hasKey ? "text-thmanyah-green" : "text-thmanyah-red"}`}>
                  {hasKey ? "مُفعّل" : "غير مُفعّل"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {apiKeyFields.map((field, i) => (
        <div key={field.id} className="card-stagger rounded-2xl bg-card border border-border/50 p-5" style={{ animationDelay: `${i * 0.05}s` }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-[13px] font-bold text-foreground/80">{field.label}</h4>
              <p className="text-[11px] font-bold text-muted-foreground/40">{field.description}</p>
            </div>
            <button onClick={() => setShowKeys((prev) => ({ ...prev, [field.id]: !prev[field.id] }))} className="p-1.5 rounded-lg hover:bg-muted/30 transition-colors">
              {showKeys[field.id] ? <EyeOff className="w-4 h-4 text-muted-foreground/40" /> : <Eye className="w-4 h-4 text-muted-foreground/40" />}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type={showKeys[field.id] ? "text" : "password"}
              value={keys[field.id]}
              onChange={(e) => setKeys((prev) => ({ ...prev, [field.id]: e.target.value }))}
              placeholder={field.placeholder}
              className="flex-1 py-2.5 px-3 rounded-xl bg-muted/20 border border-border/50 text-[13px] font-bold text-foreground/80 placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-thmanyah-green/20 dir-ltr text-left"
              dir="ltr"
            />
            <button
              onClick={() => handleSave(field.id)}
              className={`px-3 py-2.5 rounded-xl text-[12px] font-bold transition-all flex items-center gap-1.5 ${
                saved[field.id]
                  ? "bg-thmanyah-green text-white"
                  : "bg-foreground text-white hover:bg-foreground/90"
              }`}
            >
              {saved[field.id] ? <CircleCheck className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              {saved[field.id] ? "تم الحفظ" : "حفظ"}
            </button>
          </div>
        </div>
      ))}

      <div className="card-stagger rounded-2xl bg-muted/20 border border-border/30 p-5" style={{ animationDelay: "0.15s" }}>
        <p className="text-[12px] font-bold text-muted-foreground/50 leading-relaxed">
          المفاتيح تُحفظ محلياً في المتصفح وتُرسل بشكل آمن عبر HTTPS عند تشغيل التحليل.
          يمكنك أيضاً تعيينها كـ Supabase Secrets لتجنّب إدخالها في كل مرة.
        </p>
      </div>
    </div>
  );
}

function AccountsTab() {
  const platforms = [
    { name: "TikTok", color: "#ff0050", accounts: [
      { handle: "thmanyah", nameAr: "ثمانية" }, { handle: "thmanyahsports", nameAr: "ثمانية رياضة" },
      { handle: "thmanyahexit", nameAr: "ثمانية اكزت" }, { handle: "thmanyahliving", nameAr: "ثمانية ليڤنق" },
      { handle: "radiothmanyah", nameAr: "راديو ثمانية" },
    ]},
    { name: "Instagram", color: "#E4405F", accounts: [
      { handle: "thmanyah", nameAr: "ثمانية" }, { handle: "thmanyahsports", nameAr: "ثمانية رياضة" },
      { handle: "thmanyahexit", nameAr: "ثمانية اكزت" }, { handle: "thmanyahliving", nameAr: "ثمانية ليڤنق" },
      { handle: "radiothmanyah", nameAr: "راديو ثمانية" },
    ]},
    { name: "YouTube", color: "#FF0000", accounts: [
      { handle: "Thmanyah", nameAr: "ثمانية" }, { handle: "ThmanyahExit", nameAr: "ثمانية اكزت" },
      { handle: "RadioThmanyah", nameAr: "راديو ثمانية" }, { handle: "ThmanyahSports", nameAr: "ثمانية رياضة" },
    ]},
  ];

  return (
    <div className="space-y-4">
      {platforms.map((platform, pi) => (
        <div key={platform.name} className="card-stagger rounded-2xl bg-card border border-border/50 overflow-hidden" style={{ animationDelay: `${pi * 0.08}s` }}>
          <div className="flex items-center justify-between p-5 border-b border-border/30">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: platform.color }} />
              <h3 className="text-[14px] font-bold text-foreground/80">{platform.name}</h3>
              <span className="text-[11px] font-bold text-muted-foreground/40">{platform.accounts.length} حسابات</span>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/50 text-[11px] font-bold text-muted-foreground/60 hover:text-foreground transition-all">
              <Plus className="w-3 h-3" />إضافة حساب
            </button>
          </div>
          <div className="divide-y divide-border/20">
            {platform.accounts.map((account) => (
              <div key={account.handle} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/10 transition-colors">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: platform.color }}>
                  {account.nameAr.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[13px] font-bold text-foreground/80 block truncate">{account.nameAr}</span>
                  <span className="text-[11px] font-bold text-muted-foreground/40">@{account.handle}</span>
                </div>
                <div className="w-2 h-2 rounded-full bg-thmanyah-green" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Apify Actors Tab — Actor/scraper management
   ═══════════════════════════════════════════════════════════════════ */

interface ApifyActor {
  id: string;
  name: string;
  description: string;
  platform: string;
  platformColor: string;
  isActive: boolean;
  lastUsed: string | null;
  runCount: number;
  avgItems: number;
}

function ApifyActorsTab() {
  const [actors, setActors] = useState<ApifyActor[]>([
    {
      id: "apidojo~tweet-scraper",
      name: "Tweet Scraper",
      description: "جلب التغريدات من X/Twitter بناءً على كلمات مفتاحية أو حسابات محددة",
      platform: "X / Twitter",
      platformColor: "#1DA1F2",
      isActive: true,
      lastUsed: "2026-03-08T14:30:00Z",
      runCount: 47,
      avgItems: 250,
    },
    {
      id: "clockworks~tiktok-scraper",
      name: "TikTok Scraper",
      description: "جلب التعليقات والبيانات من فيديوهات تيك توك",
      platform: "TikTok",
      platformColor: "#ff0050",
      isActive: true,
      lastUsed: "2026-03-07T10:15:00Z",
      runCount: 23,
      avgItems: 180,
    },
    {
      id: "apify~instagram-scraper",
      name: "Instagram Comment Scraper",
      description: "جلب تعليقات وبيانات التفاعل من منشورات إنستغرام",
      platform: "Instagram",
      platformColor: "#E4405F",
      isActive: false,
      lastUsed: "2026-02-28T08:00:00Z",
      runCount: 12,
      avgItems: 150,
    },
    {
      id: "streamers~youtube-scraper",
      name: "YouTube Comment Scraper",
      description: "جلب تعليقات الفيديوهات وبيانات القناة من يوتيوب",
      platform: "YouTube",
      platformColor: "#FF0000",
      isActive: true,
      lastUsed: "2026-03-06T16:45:00Z",
      runCount: 31,
      avgItems: 320,
    },
    {
      id: "dev_fusion~linkedin-profile-scraper",
      name: "LinkedIn Profile Enricher",
      description: "إثراء الملفات الشخصية من لينكدإن — الاسم، المسمى، الخبرات، المهارات",
      platform: "LinkedIn",
      platformColor: "#0A66C2",
      isActive: false,
      lastUsed: null,
      runCount: 0,
      avgItems: 0,
    },
    {
      id: "epctex~google-trends-scraper",
      name: "Google Trends Scraper",
      description: "جلب بيانات الاهتمام بالبحث والمواضيع الرائجة من Google Trends",
      platform: "Google",
      platformColor: "#4285F4",
      isActive: false,
      lastUsed: "2026-01-15T12:00:00Z",
      runCount: 5,
      avgItems: 50,
    },
  ]);

  const toggleActor = (id: string) => {
    setActors((prev) => prev.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a)));
  };

  const formatLastUsed = (date: string | null) => {
    if (!date) return "لم يُستخدم بعد";
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "اليوم";
    if (diffDays === 1) return "أمس";
    if (diffDays < 7) return `منذ ${diffDays} أيام`;
    if (diffDays < 30) return `منذ ${Math.floor(diffDays / 7)} أسابيع`;
    return `منذ ${Math.floor(diffDays / 30)} أشهر`;
  };

  const activeCount = actors.filter((a) => a.isActive).length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="rounded-2xl bg-card border border-border/50 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-purple-500" />
            <h3 className="text-[14px] font-display font-bold text-foreground/85">الممثلين النشطين (Actors)</h3>
          </div>
          <span className="text-[11px] font-bold text-muted-foreground/40">{activeCount} من {actors.length} مُفعّل</span>
        </div>
        <p className="text-[11px] font-bold text-muted-foreground/40 leading-relaxed">
          أدر أدوات الجلب (Scrapers) المتاحة عبر Apify. فعّل أو عطّل كل أداة حسب احتياجاتك. الأدوات النشطة فقط ستُستخدم في عمليات الرصد التلقائي.
        </p>
      </div>

      {/* Actors List */}
      <div className="space-y-3">
        {actors.map((actor, i) => (
          <div
            key={actor.id}
            className={`card-stagger rounded-2xl bg-card border transition-all ${
              actor.isActive ? "border-border/50" : "border-border/20 opacity-60"
            }`}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="p-5">
              <div className="flex items-start gap-4">
                {/* Platform icon */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-[11px] font-bold shrink-0" style={{ backgroundColor: actor.platformColor }}>
                  {actor.platform.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[13px] font-bold text-foreground/85" dir="ltr">{actor.name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ backgroundColor: `${actor.platformColor}15`, color: actor.platformColor }}>
                      {actor.platform}
                    </span>
                    {actor.isActive ? (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-thmanyah-green/10 text-thmanyah-green">
                        <div className="w-1.5 h-1.5 rounded-full bg-thmanyah-green animate-pulse" /> نشط
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-muted/30 text-muted-foreground/40">معطّل</span>
                    )}
                  </div>
                  <p className="text-[11px] font-bold text-muted-foreground/50 leading-relaxed mb-2">{actor.description}</p>
                  <p className="text-[10px] font-bold text-muted-foreground/30 font-mono" dir="ltr">{actor.id}</p>
                </div>

                <button onClick={() => toggleActor(actor.id)} className="shrink-0 mt-1">
                  {actor.isActive ? (
                    <ToggleRight className="w-6 h-6 text-thmanyah-green" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-muted-foreground/30" />
                  )}
                </button>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/20">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-muted-foreground/30" />
                  <span className="text-[10px] font-bold text-muted-foreground/40">آخر استخدام: {formatLastUsed(actor.lastUsed)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-muted-foreground/30" />
                  <span className="text-[10px] font-bold text-muted-foreground/40">{actor.runCount} عملية</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3 h-3 text-muted-foreground/30" />
                  <span className="text-[10px] font-bold text-muted-foreground/40">~{actor.avgItems} عنصر/عملية</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add actor hint */}
      <div className="rounded-2xl bg-muted/20 border border-border/30 p-5">
        <p className="text-[12px] font-bold text-muted-foreground/50 leading-relaxed">
          لإضافة Actor جديد، ابحث في <span className="text-purple-500" dir="ltr">apify.com/store</span> عن الأداة المطلوبة وانسخ معرّف الـ Actor.
          تأكد من إضافة مفتاح Apify API في تبويب &quot;مفاتيح API&quot;.
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Token Calculator Tab — estimate API token usage
   ═══════════════════════════════════════════════════════════════════ */

function TokenCalculatorTab() {
  const [tweetCount, setTweetCount] = useState(100);
  const [avgWordCount, setAvgWordCount] = useState(35);
  const [metricsCount, setMetricsCount] = useState(5);
  const [modelId, setModelId] = useState(loadSelectedModel());

  const currentModel = AI_MODELS.find((m) => m.id === modelId) || AI_MODELS[0];

  // Token estimation logic
  // Arabic: ~1 word ≈ 3-4 tokens, English: ~1 word ≈ 1.3 tokens
  // We assume mostly Arabic content
  const TOKENS_PER_ARABIC_WORD = 3.5;
  const SYSTEM_PROMPT_TOKENS = 800; // base system prompt
  const METRICS_PROMPT_OVERHEAD = 120; // per metric in prompt
  const RESPONSE_TOKENS_PER_TWEET = 80 + (metricsCount * 25); // output per tweet

  const inputTokensPerTweet = Math.round(avgWordCount * TOKENS_PER_ARABIC_WORD);
  const systemPromptTotal = SYSTEM_PROMPT_TOKENS + (metricsCount * METRICS_PROMPT_OVERHEAD);

  // Batch size: assume 10 tweets per API call
  const batchSize = 10;
  const numBatches = Math.ceil(tweetCount / batchSize);

  const inputTokensPerBatch = systemPromptTotal + (inputTokensPerTweet * batchSize);
  const outputTokensPerBatch = RESPONSE_TOKENS_PER_TWEET * batchSize;

  const totalInputTokens = inputTokensPerBatch * numBatches;
  const totalOutputTokens = outputTokensPerBatch * numBatches;
  const totalTokens = totalInputTokens + totalOutputTokens;

  // Cost estimation (per 1M tokens, rough estimates)
  const MODEL_COSTS: Record<string, { input: number; output: number }> = {
    "google/gemini-2.5-pro-preview": { input: 1.25, output: 10.0 },
    "google/gemini-2.5-flash-preview": { input: 0.15, output: 0.6 },
    "anthropic/claude-sonnet-4": { input: 3.0, output: 15.0 },
    "anthropic/claude-haiku-4": { input: 0.8, output: 4.0 },
    "openai/gpt-4o": { input: 2.5, output: 10.0 },
    "openai/gpt-4o-mini": { input: 0.15, output: 0.6 },
    "meta-llama/llama-4-maverick": { input: 0.5, output: 0.7 },
    "deepseek/deepseek-r1": { input: 0.55, output: 2.19 },
  };

  const costs = MODEL_COSTS[modelId] || { input: 1.0, output: 5.0 };
  const inputCost = (totalInputTokens / 1_000_000) * costs.input;
  const outputCost = (totalOutputTokens / 1_000_000) * costs.output;
  const totalCost = inputCost + outputCost;

  const fmtTokens = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl bg-card border border-border/50 p-6">
        <div className="flex items-center gap-2 mb-3">
          <Calculator className="w-4 h-4 text-thmanyah-blue" />
          <h3 className="text-[14px] font-display font-bold text-foreground/85">حاسبة التوكنات والتكلفة</h3>
        </div>
        <p className="text-[11px] font-bold text-muted-foreground/40 leading-relaxed">
          احسب تقريبياً عدد التوكنات والتكلفة المتوقعة لكل عملية تحليل بناءً على عدد التغريدات ومتوسط طولها.
        </p>
      </div>

      {/* Input Controls */}
      <div className="rounded-2xl bg-card border border-border/50 p-6">
        <h4 className="text-[13px] font-bold text-foreground/80 mb-4">إعدادات الحساب</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-[11px] font-bold text-foreground/60 block mb-1.5">عدد التغريدات</label>
            <input
              type="number"
              value={tweetCount}
              onChange={(e) => setTweetCount(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              max={10000}
              className="w-full py-2.5 px-3 rounded-xl bg-muted/20 border border-border/50 text-[13px] font-bold text-foreground/80 focus:outline-none focus:ring-2 focus:ring-thmanyah-blue/20"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-foreground/60 block mb-1.5">متوسط عدد الكلمات/تغريدة</label>
            <input
              type="number"
              value={avgWordCount}
              onChange={(e) => setAvgWordCount(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              max={500}
              className="w-full py-2.5 px-3 rounded-xl bg-muted/20 border border-border/50 text-[13px] font-bold text-foreground/80 focus:outline-none focus:ring-2 focus:ring-thmanyah-blue/20"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-foreground/60 block mb-1.5">عدد معايير التحليل</label>
            <input
              type="number"
              value={metricsCount}
              onChange={(e) => setMetricsCount(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              max={20}
              className="w-full py-2.5 px-3 rounded-xl bg-muted/20 border border-border/50 text-[13px] font-bold text-foreground/80 focus:outline-none focus:ring-2 focus:ring-thmanyah-blue/20"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="text-[11px] font-bold text-foreground/60 block mb-1.5">نموذج الذكاء الاصطناعي</label>
          <select
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            className="w-full py-2.5 px-3 rounded-xl bg-muted/20 border border-border/50 text-[13px] font-bold text-foreground/80 focus:outline-none focus:ring-2 focus:ring-thmanyah-blue/20"
          >
            {AI_MODELS.map((m) => (
              <option key={m.id} value={m.id}>{m.name} ({m.provider})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="rounded-2xl bg-card border border-border/50 p-6">
        <h4 className="text-[13px] font-bold text-foreground/80 mb-4">نتائج الحساب التقريبية</h4>

        {/* Token breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="p-3 rounded-xl bg-thmanyah-blue/[0.06] border border-thmanyah-blue/10">
            <p className="text-[10px] font-bold text-thmanyah-blue/60 mb-1">توكنات الإدخال</p>
            <p className="text-lg font-bold text-thmanyah-blue">{fmtTokens(totalInputTokens)}</p>
          </div>
          <div className="p-3 rounded-xl bg-thmanyah-green/[0.06] border border-thmanyah-green/10">
            <p className="text-[10px] font-bold text-thmanyah-green/60 mb-1">توكنات الإخراج</p>
            <p className="text-lg font-bold text-thmanyah-green">{fmtTokens(totalOutputTokens)}</p>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/[0.06] border border-purple-500/10">
            <p className="text-[10px] font-bold text-purple-500/60 mb-1">إجمالي التوكنات</p>
            <p className="text-lg font-bold text-purple-500">{fmtTokens(totalTokens)}</p>
          </div>
          <div className="p-3 rounded-xl bg-thmanyah-amber/[0.06] border border-thmanyah-amber/10">
            <p className="text-[10px] font-bold text-thmanyah-amber/60 mb-1">التكلفة التقريبية</p>
            <p className="text-lg font-bold text-thmanyah-amber">${totalCost.toFixed(4)}</p>
          </div>
        </div>

        {/* Detailed breakdown */}
        <div className="rounded-xl bg-muted/10 border border-border/20 p-4 space-y-2">
          <p className="text-[11px] font-bold text-foreground/60 mb-2">تفاصيل الحساب</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[11px]">
            <span className="font-bold text-muted-foreground/50">توكنات/كلمة عربية:</span>
            <span className="font-bold text-foreground/70" dir="ltr">~{TOKENS_PER_ARABIC_WORD}</span>

            <span className="font-bold text-muted-foreground/50">توكنات/تغريدة (إدخال):</span>
            <span className="font-bold text-foreground/70" dir="ltr">~{inputTokensPerTweet}</span>

            <span className="font-bold text-muted-foreground/50">توكنات/تغريدة (إخراج):</span>
            <span className="font-bold text-foreground/70" dir="ltr">~{RESPONSE_TOKENS_PER_TWEET}</span>

            <span className="font-bold text-muted-foreground/50">System Prompt:</span>
            <span className="font-bold text-foreground/70" dir="ltr">~{systemPromptTotal.toLocaleString()} tokens</span>

            <span className="font-bold text-muted-foreground/50">حجم الدُفعة (Batch):</span>
            <span className="font-bold text-foreground/70" dir="ltr">{batchSize} tweets/call</span>

            <span className="font-bold text-muted-foreground/50">عدد طلبات API:</span>
            <span className="font-bold text-foreground/70" dir="ltr">{numBatches} requests</span>

            <span className="font-bold text-muted-foreground/50">تكلفة الإدخال:</span>
            <span className="font-bold text-foreground/70" dir="ltr">${inputCost.toFixed(4)} (${costs.input}/1M tokens)</span>

            <span className="font-bold text-muted-foreground/50">تكلفة الإخراج:</span>
            <span className="font-bold text-foreground/70" dir="ltr">${outputCost.toFixed(4)} (${costs.output}/1M tokens)</span>
          </div>
        </div>

        {/* Model cost comparison */}
        <div className="mt-4">
          <p className="text-[11px] font-bold text-foreground/60 mb-2">مقارنة التكلفة بين النماذج</p>
          <div className="space-y-1.5">
            {AI_MODELS.map((m) => {
              const mc = MODEL_COSTS[m.id] || { input: 1, output: 5 };
              const mInputCost = (totalInputTokens / 1_000_000) * mc.input;
              const mOutputCost = (totalOutputTokens / 1_000_000) * mc.output;
              const mTotal = mInputCost + mOutputCost;
              const maxCost = Math.max(...AI_MODELS.map((am) => {
                const amc = MODEL_COSTS[am.id] || { input: 1, output: 5 };
                return ((totalInputTokens / 1_000_000) * amc.input) + ((totalOutputTokens / 1_000_000) * amc.output);
              }));
              const barPct = maxCost > 0 ? (mTotal / maxCost) * 100 : 0;
              const isSelected = m.id === modelId;
              return (
                <div key={m.id} className={`flex items-center gap-3 p-2 rounded-lg transition-all ${isSelected ? "bg-thmanyah-blue/5 border border-thmanyah-blue/20" : ""}`}>
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                  <span className="text-[10px] font-bold text-foreground/70 w-36 truncate" dir="ltr">{m.name}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted/20 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${barPct}%`, backgroundColor: m.color }} />
                  </div>
                  <span className="text-[10px] font-bold text-foreground/70 w-16 text-left" dir="ltr">${mTotal.toFixed(4)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Note */}
      <div className="rounded-2xl bg-muted/20 border border-border/30 p-5">
        <p className="text-[12px] font-bold text-muted-foreground/50 leading-relaxed">
          التقديرات تقريبية وتعتمد على طبيعة النص. النصوص العربية تستهلك توكنات أكثر من الإنجليزية (~3.5x).
          الأسعار مأخوذة من OpenRouter وقد تختلف حسب مزود الخدمة.
        </p>
      </div>
    </div>
  );
}

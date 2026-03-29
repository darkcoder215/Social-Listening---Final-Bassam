import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Brain,
  TrendingUp,
  MessageSquare,
  Heart,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  FileText,
  Play,
  Loader2,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Hash,
  Sparkles,
  RefreshCw,
  Settings,
} from "lucide-react";
import { useDateRange } from "@/contexts/DateRangeContext";
import DateRangeFilter from "@/components/explore/DateRangeFilter";
import PageExplainer from "@/components/PageExplainer";
import { useAllPlatformComments } from "@/hooks/useAiAnalysisData";
import {
  runFullAnalysis,
  SAMPLE_COMMENTS,
  type AnalysisResult,
  type AnalysisProgress,
  type AiReportTheme,
  type AiReportIssue,
  type AiReportInsight,
  type AiReportRecommendation,
  type AnalyzedItem,
} from "@/lib/ai-analysis";
import { AI_MODELS, loadSelectedModel } from "@/lib/settings";
import { PLATFORM_COLORS, PLATFORM_LABELS, fmtNum, type Platform } from "@/lib/db-types";
import { PLATFORM_ICON_MAP } from "@/components/icons/PlatformIcons";
import { cn } from "@/lib/utils";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis,
} from "recharts";

/* ── Constants ── */

const SECTIONS = [
  { id: "overview", label: "نظرة عامة", icon: BarChart3 },
  { id: "sentiment", label: "المشاعر", icon: Heart },
  { id: "keywords", label: "الكلمات المفتاحية", icon: Hash },
  { id: "themes", label: "المواضيع", icon: TrendingUp },
  { id: "issues", label: "المشاكل", icon: AlertTriangle },
  { id: "insights", label: "الرؤى", icon: Lightbulb },
  { id: "recommendations", label: "التوصيات", icon: CheckCircle2 },
  { id: "summary", label: "الملخص", icon: FileText },
  { id: "comments", label: "التعليقات", icon: MessageSquare },
] as const;

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "#00C17A",
  negative: "#F24935",
  neutral: "#94a3b8",
};

const SENTIMENT_LABELS: Record<string, string> = {
  positive: "إيجابي",
  negative: "سلبي",
  neutral: "محايد",
};

const EMOTION_COLORS: Record<string, string> = {
  "فرح": "#00C17A",
  "حماس": "#34A853",
  "غضب": "#F24935",
  "إحباط": "#E4405F",
  "حزن": "#0072F9",
  "قلق": "#8B5CF6",
  "مفاجأة": "#FFBC0A",
  "محايد": "#94a3b8",
  "سخرية": "#ff0050",
};

const SEVERITY_COLORS: Record<string, string> = {
  high: "#F24935",
  medium: "#FFBC0A",
  low: "#00C17A",
};

const PRIORITY_LABELS: Record<string, string> = {
  high: "عالية",
  medium: "متوسطة",
  low: "منخفضة",
};

/* ── Skeleton ── */
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/20 ${className}`} />;
}

/* ── Section Heading ── */
function SectionHeading({ icon: Icon, title, color }: { icon: React.ElementType; title: string; color: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15`, color }}>
        <Icon className="w-5 h-5" strokeWidth={1.8} />
      </div>
      <h2 className="text-xl font-display font-bold text-foreground/90">{title}</h2>
      <div className="flex-1 h-px bg-border/50" />
    </div>
  );
}

/* ── KPI Card ── */
function KpiCard({ label, value, color, sub }: { label: string; value: string | number; color: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5 hover:shadow-md transition-shadow">
      <p className="text-[12px] font-bold text-muted-foreground/60 mb-1">{label}</p>
      <p className="text-3xl font-display font-bold" style={{ color }}>{typeof value === "number" ? fmtNum(value) : value}</p>
      {sub && <p className="text-[11px] font-bold text-muted-foreground/40 mt-1">{sub}</p>}
    </div>
  );
}

/* ── Main Page ── */
export default function AiAnalyses() {
  const navigate = useNavigate();
  const { dateRange } = useDateRange();
  const { data: supabaseComments, isLoading: commentsLoading } = useAllPlatformComments({
    dateFrom: dateRange.from,
    dateTo: dateRange.to,
    limit: 300,
  });

  // Use Supabase data if available, otherwise fall back to sample data
  const comments = supabaseComments && supabaseComments.length > 0 ? supabaseComments : SAMPLE_COMMENTS;
  const usingSampleData = !supabaseComments || supabaseComments.length === 0;

  const [activeSection, setActiveSection] = useState<string>("overview");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [progress, setProgress] = useState<AnalysisProgress>({ phase: "idle", percent: 0, message: "" });
  const [filterSentiment, setFilterSentiment] = useState<string | null>(null);

  const isRunning = progress.phase === "analyzing" || progress.phase === "generating-report" || progress.phase === "fetching";
  const hasResult = !!result;
  const currentModel = AI_MODELS.find((m) => m.id === loadSelectedModel());

  const handleRunAnalysis = useCallback(async () => {
    if (comments.length === 0) return;
    setResult(null);
    setFilterSentiment(null);
    try {
      const res = await runFullAnalysis(comments, setProgress);
      setResult(res);
    } catch (err: any) {
      setProgress({ phase: "error", percent: 0, message: "", error: err.message || "حدث خطأ غير متوقع" });
    }
  }, [comments]);

  // Derived data
  const sentimentPieData = useMemo(() => {
    if (!result) return [];
    return Object.entries(result.sentimentCounts).map(([key, value]) => ({
      name: SENTIMENT_LABELS[key] || key,
      value,
      key,
      color: SENTIMENT_COLORS[key] || "#94a3b8",
    }));
  }, [result]);

  const emotionBarData = useMemo(() => {
    if (!result) return [];
    return Object.entries(result.emotionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count, color: EMOTION_COLORS[name] || "#94a3b8" }));
  }, [result]);

  const platformBreakdown = useMemo(() => {
    if (!result) return [];
    const map: Record<string, number> = {};
    for (const item of result.items) {
      map[item.platform] = (map[item.platform] || 0) + 1;
    }
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([platform, count]) => ({ platform, count }));
  }, [result]);

  const filteredComments = useMemo(() => {
    if (!result) return [];
    if (!filterSentiment) return result.items;
    return result.items.filter((i) => i.sentiment === filterSentiment);
  }, [result, filterSentiment]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageExplainer
        icon={Brain}
        title="التحليل الذكي"
        description="تحليل شامل بالذكاء الاصطناعي لجميع التعليقات عبر المنصات — المشاعر والمواضيع والتوصيات"
        color="#8B5CF6"
      />

      {/* Filters & Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <DateRangeFilter />
        <div className="flex-1" />

        {/* Model badge */}
        {currentModel && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/30 border border-border/50">
            <Sparkles className="w-3.5 h-3.5" style={{ color: currentModel.color }} />
            <span className="text-[11px] font-bold text-muted-foreground">{currentModel.name}</span>
          </div>
        )}

        {/* Settings link */}
        <button
          onClick={() => navigate("/settings?tab=ai")}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/30 border border-border/50 hover:border-border hover:bg-muted/50 transition-all"
          title="إعدادات معايير التحليل"
        >
          <Settings className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[11px] font-bold text-muted-foreground">معايير التحليل</span>
        </button>

        {/* Run button */}
        <button
          onClick={handleRunAnalysis}
          disabled={isRunning || commentsLoading}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all",
            isRunning
              ? "bg-muted/20 text-muted-foreground cursor-wait"
              : "bg-[#8B5CF6] text-white hover:brightness-110"
          )}
        >
          {isRunning ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : hasResult ? (
            <RefreshCw className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {isRunning ? "جاري التحليل..." : hasResult ? "إعادة التحليل" : "بدء التحليل"}
        </button>
      </div>

      {/* Progress Bar */}
      {isRunning && (
        <div className="rounded-xl border border-border/50 bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold text-foreground/80">{progress.message}</span>
            <span className="text-[12px] font-bold text-muted-foreground">{progress.percent}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted/20 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#8B5CF6] transition-all duration-500"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Sample data notice */}
      {usingSampleData && !commentsLoading && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-[13px] font-bold text-amber-600 dark:text-amber-400">
            يتم استخدام بيانات تجريبية ({SAMPLE_COMMENTS.length} تعليق). اربط Supabase لتحليل بيانات حقيقية.
          </p>
        </div>
      )}

      {/* Error */}
      {progress.phase === "error" && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-[13px] font-bold text-red-600 dark:text-red-400">{progress.error}</p>
        </div>
      )}

      {/* Comment count preview */}
      {!hasResult && !isRunning && comments && (
        <div className="rounded-xl border border-border/50 bg-card p-6 text-center space-y-3">
          <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto" />
          <p className="text-[14px] font-bold text-foreground/70">
            تم جلب <span className="text-[#8B5CF6]">{comments.length}</span> تعليق من جميع المنصات
          </p>
          <div className="flex items-center justify-center gap-4">
            {["tiktok", "instagram", "youtube", "x"].map((p) => {
              const count = comments.filter((c) => c.platform === p).length;
              if (count === 0) return null;
              const Icon = PLATFORM_ICON_MAP[p];
              return (
                <div key={p} className="flex items-center gap-1.5 text-[12px] font-bold text-muted-foreground">
                  {Icon && <Icon className="w-4 h-4" />}
                  <span>{count}</span>
                </div>
              );
            })}
          </div>
          <p className="text-[12px] text-muted-foreground/50">اضغط "بدء التحليل" لتحليل هذه التعليقات بالذكاء الاصطناعي</p>
        </div>
      )}

      {/* ═══ Results ═══ */}
      {hasResult && (
        <>
          {/* Section Navigation */}
          <nav className="sticky top-[65px] z-20 bg-background/80 backdrop-blur-md border-b border-border/50 -mx-8 px-8 overflow-x-auto">
            <div className="flex items-center gap-1 py-2 min-w-max">
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                const active = activeSection === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-bold transition-all whitespace-nowrap",
                      active
                        ? "bg-[#8B5CF6]/10 text-[#8B5CF6]"
                        : "text-muted-foreground hover:text-foreground/70 hover:bg-muted/20"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* ── Overview Section ── */}
          {activeSection === "overview" && (
            <section className="space-y-6">
              <SectionHeading icon={BarChart3} title="نظرة عامة" color="#8B5CF6" />

              {/* KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard label="إجمالي التعليقات" value={result.items.length} color="#8B5CF6" />
                <KpiCard
                  label="إيجابي"
                  value={result.sentimentCounts.positive || 0}
                  color="#00C17A"
                  sub={`${Math.round(((result.sentimentCounts.positive || 0) / result.items.length) * 100)}%`}
                />
                <KpiCard
                  label="سلبي"
                  value={result.sentimentCounts.negative || 0}
                  color="#F24935"
                  sub={`${Math.round(((result.sentimentCounts.negative || 0) / result.items.length) * 100)}%`}
                />
                <KpiCard
                  label="محايد"
                  value={result.sentimentCounts.neutral || 0}
                  color="#94a3b8"
                  sub={`${Math.round(((result.sentimentCounts.neutral || 0) / result.items.length) * 100)}%`}
                />
              </div>

              {/* Platform breakdown */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {platformBreakdown.map(({ platform, count }) => {
                  const Icon = PLATFORM_ICON_MAP[platform];
                  return (
                    <div key={platform} className="rounded-2xl border border-border/50 bg-card p-4 flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{
                          backgroundColor: `${PLATFORM_COLORS[platform as Platform] || "#8B5CF6"}15`,
                          color: PLATFORM_COLORS[platform as Platform] || "#8B5CF6",
                        }}
                      >
                        {Icon ? <Icon className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-lg font-display font-bold text-foreground/90">{fmtNum(count)}</p>
                        <p className="text-[11px] font-bold text-muted-foreground/50">
                          {PLATFORM_LABELS[platform as Platform] || platform}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Model info */}
              <div className="rounded-xl border border-border/50 bg-card p-4 flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
                <span className="text-[12px] font-bold text-muted-foreground">
                  تم التحليل بواسطة {AI_MODELS.find((m) => m.id === result.model)?.name || result.model}
                  {" — "}
                  {new Date(result.analyzedAt).toLocaleString("ar-SA")}
                </span>
              </div>
            </section>
          )}

          {/* ── Sentiment Section ── */}
          {activeSection === "sentiment" && (
            <section className="space-y-6">
              <SectionHeading icon={Heart} title="تحليل المشاعر" color="#00C17A" />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sentiment Pie */}
                <div className="rounded-2xl border border-border/50 bg-card p-6">
                  <h3 className="text-[14px] font-bold text-foreground/70 mb-4">توزيع المشاعر</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={sentimentPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        cursor="pointer"
                        onClick={(entry: any) => {
                          setFilterSentiment((prev) => (prev === entry.key ? null : entry.key));
                          setActiveSection("comments");
                        }}
                      >
                        {sentimentPieData.map((entry) => (
                          <Cell key={entry.key} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [fmtNum(value), "تعليقات"]}
                        contentStyle={{ borderRadius: 12, fontSize: 12, fontWeight: 700 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex items-center justify-center gap-4 mt-2">
                    {sentimentPieData.map((d) => (
                      <button
                        key={d.key}
                        onClick={() => {
                          setFilterSentiment((prev) => (prev === d.key ? null : d.key));
                          setActiveSection("comments");
                        }}
                        className="flex items-center gap-1.5 text-[12px] font-bold text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        {d.name} ({d.value})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Emotion Bar */}
                <div className="rounded-2xl border border-border/50 bg-card p-6">
                  <h3 className="text-[14px] font-bold text-foreground/70 mb-4">توزيع العواطف</h3>
                  <div className="space-y-3">
                    {emotionBarData.map((d) => {
                      const maxVal = emotionBarData[0]?.count || 1;
                      return (
                        <div key={d.name} className="flex items-center gap-3">
                          <span className="text-[12px] font-bold text-muted-foreground w-16 text-left">{d.name}</span>
                          <div className="flex-1 h-7 rounded-full bg-muted/10 overflow-hidden relative">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.max((d.count / maxVal) * 100, 4)}%`,
                                backgroundColor: d.color,
                              }}
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-bold text-foreground/60">
                              {d.count}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ── Keywords Section ── */}
          {activeSection === "keywords" && (
            <section className="space-y-6">
              <SectionHeading icon={Hash} title="الكلمات المفتاحية" color="#0072F9" />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Keywords Bar Chart */}
                <div className="rounded-2xl border border-border/50 bg-card p-6">
                  <h3 className="text-[14px] font-bold text-foreground/70 mb-4">أكثر الكلمات تكراراً</h3>
                  <ResponsiveContainer width="100%" height={Math.max(result.topKeywords.slice(0, 15).length * 36, 200)}>
                    <BarChart
                      data={result.topKeywords.slice(0, 15)}
                      layout="vertical"
                      margin={{ top: 0, right: 40, bottom: 0, left: 0 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="word"
                        width={100}
                        tick={{ fontSize: 12, fontWeight: 700, fill: "var(--muted-foreground)" }}
                      />
                      <Tooltip
                        formatter={(value: number) => [value, "مرة"]}
                        contentStyle={{ borderRadius: 12, fontSize: 12, fontWeight: 700 }}
                      />
                      <Bar dataKey="count" fill="#0072F9" radius={[0, 8, 8, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Keywords Cloud Grid */}
                <div className="rounded-2xl border border-border/50 bg-card p-6">
                  <h3 className="text-[14px] font-bold text-foreground/70 mb-4">سحابة الكلمات</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.topKeywords.slice(0, 30).map((kw, i) => {
                      const maxCount = result.topKeywords[0]?.count || 1;
                      const ratio = kw.count / maxCount;
                      const size = 12 + ratio * 14;
                      const opacity = 0.4 + ratio * 0.6;
                      return (
                        <span
                          key={kw.word}
                          className="px-2.5 py-1 rounded-full border border-border/50 font-bold transition-colors hover:bg-[#0072F9]/10 hover:border-[#0072F9]/30 cursor-default"
                          style={{ fontSize: size, opacity }}
                          title={`${kw.count} مرة`}
                        >
                          {kw.word}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ── Themes Section ── */}
          {activeSection === "themes" && (
            <section className="space-y-6">
              <SectionHeading icon={TrendingUp} title="المواضيع الرئيسية" color="#FFBC0A" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.report.themes.map((theme, i) => (
                  <ThemeCard key={i} theme={theme} index={i} />
                ))}
              </div>
              {result.report.themes.length === 0 && (
                <p className="text-center text-muted-foreground/50 text-[13px] font-bold py-8">لا توجد مواضيع محددة</p>
              )}
            </section>
          )}

          {/* ── Issues Section ── */}
          {activeSection === "issues" && (
            <section className="space-y-6">
              <SectionHeading icon={AlertTriangle} title="المشاكل المحددة" color="#F24935" />
              <div className="space-y-4">
                {result.report.issues.map((issue, i) => (
                  <IssueCard key={i} issue={issue} index={i} />
                ))}
              </div>
              {result.report.issues.length === 0 && (
                <p className="text-center text-muted-foreground/50 text-[13px] font-bold py-8">لم يتم تحديد مشاكل</p>
              )}
            </section>
          )}

          {/* ── Insights Section ── */}
          {activeSection === "insights" && (
            <section className="space-y-6">
              <SectionHeading icon={Lightbulb} title="الرؤى" color="#FFBC0A" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.report.insights.map((insight, i) => (
                  <InsightCard key={i} insight={insight} index={i} />
                ))}
              </div>
              {result.report.insights.length === 0 && (
                <p className="text-center text-muted-foreground/50 text-[13px] font-bold py-8">لا توجد رؤى</p>
              )}
            </section>
          )}

          {/* ── Recommendations Section ── */}
          {activeSection === "recommendations" && (
            <section className="space-y-6">
              <SectionHeading icon={CheckCircle2} title="التوصيات" color="#00C17A" />
              <div className="space-y-4">
                {result.report.recommendations.map((rec, i) => (
                  <RecommendationCard key={i} rec={rec} index={i} />
                ))}
              </div>
              {result.report.recommendations.length === 0 && (
                <p className="text-center text-muted-foreground/50 text-[13px] font-bold py-8">لا توجد توصيات</p>
              )}
            </section>
          )}

          {/* ── Summary Section ── */}
          {activeSection === "summary" && (
            <section className="space-y-6">
              <SectionHeading icon={FileText} title="الملخص التنفيذي" color="#8B5CF6" />
              <div className="rounded-2xl border border-border/50 bg-card p-8 space-y-6">
                {result.report.overall_summary && (
                  <div>
                    <h3 className="text-[14px] font-bold text-foreground/70 mb-3">الملخص العام</h3>
                    <p className="text-[14px] font-bold text-foreground/60 leading-relaxed">{result.report.overall_summary}</p>
                  </div>
                )}
                {result.report.sentiment_analysis && (
                  <>
                    <div className="h-px bg-border/50" />
                    <div>
                      <h3 className="text-[14px] font-bold text-foreground/70 mb-3">تحليل المشاعر</h3>
                      <p className="text-[14px] font-bold text-foreground/60 leading-relaxed">{result.report.sentiment_analysis}</p>
                    </div>
                  </>
                )}
              </div>
            </section>
          )}

          {/* ── Comments Section ── */}
          {activeSection === "comments" && (
            <section className="space-y-6">
              <SectionHeading icon={MessageSquare} title="التعليقات المحللة" color="#0072F9" />

              {/* Filter pills */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setFilterSentiment(null)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[12px] font-bold border transition-all",
                    !filterSentiment ? "bg-[#8B5CF6]/10 border-[#8B5CF6]/30 text-[#8B5CF6]" : "border-border/50 text-muted-foreground hover:bg-muted/20"
                  )}
                >
                  الكل ({result.items.length})
                </button>
                {Object.entries(result.sentimentCounts).map(([key, count]) => (
                  <button
                    key={key}
                    onClick={() => setFilterSentiment((prev) => (prev === key ? null : key))}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-[12px] font-bold border transition-all",
                      filterSentiment === key
                        ? "border-current"
                        : "border-border/50 text-muted-foreground hover:bg-muted/20"
                    )}
                    style={filterSentiment === key ? { color: SENTIMENT_COLORS[key], backgroundColor: `${SENTIMENT_COLORS[key]}10` } : undefined}
                  >
                    {SENTIMENT_LABELS[key] || key} ({count})
                  </button>
                ))}
              </div>

              {/* Comment list */}
              <div className="space-y-3">
                {filteredComments.slice(0, 50).map((item, i) => (
                  <CommentCard key={i} item={item} />
                ))}
                {filteredComments.length > 50 && (
                  <p className="text-center text-muted-foreground/50 text-[12px] font-bold py-4">
                    عرض 50 من {filteredComments.length} تعليق
                  </p>
                )}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════ */

function ThemeCard({ theme, index }: { theme: AiReportTheme; index: number }) {
  return (
    <div
      className="rounded-2xl border border-border/50 bg-card p-5 hover:shadow-md transition-shadow card-stagger"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[14px] font-bold text-foreground/80">{theme.name}</h3>
        <span
          className="px-2 py-0.5 rounded-full text-[11px] font-bold"
          style={{
            backgroundColor: `${SENTIMENT_COLORS[theme.sentiment] || "#94a3b8"}15`,
            color: SENTIMENT_COLORS[theme.sentiment] || "#94a3b8",
          }}
        >
          {SENTIMENT_LABELS[theme.sentiment] || theme.sentiment}
        </span>
      </div>
      <p className="text-[13px] font-bold text-muted-foreground/60 leading-relaxed mb-3">{theme.description}</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full bg-muted/10 overflow-hidden">
          <div className="h-full rounded-full bg-[#FFBC0A]" style={{ width: `${theme.percentage}%` }} />
        </div>
        <span className="text-[11px] font-bold text-muted-foreground">{theme.percentage}%</span>
      </div>
    </div>
  );
}

function IssueCard({ issue, index }: { issue: AiReportIssue; index: number }) {
  return (
    <div
      className="rounded-2xl border border-border/50 bg-card p-5 hover:shadow-md transition-shadow card-stagger"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xl font-display font-bold text-muted-foreground/30">{index + 1}</span>
        <h3 className="text-[14px] font-bold text-foreground/80 flex-1">{issue.title}</h3>
        <span
          className="px-2 py-0.5 rounded-full text-[11px] font-bold"
          style={{
            backgroundColor: `${SEVERITY_COLORS[issue.severity]}15`,
            color: SEVERITY_COLORS[issue.severity],
          }}
        >
          {PRIORITY_LABELS[issue.severity] || issue.severity}
        </span>
        {issue.count > 0 && (
          <span className="text-[11px] font-bold text-muted-foreground/40">{issue.count} إشارة</span>
        )}
      </div>
      <p className="text-[13px] font-bold text-muted-foreground/60 leading-relaxed pr-8">{issue.description}</p>
    </div>
  );
}

function InsightCard({ insight, index }: { insight: AiReportInsight; index: number }) {
  return (
    <div
      className="rounded-2xl border border-border/50 bg-card p-5 hover:shadow-md transition-shadow card-stagger"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#FFBC0A]/10 flex items-center justify-center flex-shrink-0">
          <Lightbulb className="w-4 h-4 text-[#FFBC0A]" />
        </div>
        <div>
          <h3 className="text-[14px] font-bold text-foreground/80 mb-1">{insight.title}</h3>
          <p className="text-[13px] font-bold text-muted-foreground/60 leading-relaxed">{insight.description}</p>
        </div>
      </div>
    </div>
  );
}

function RecommendationCard({ rec, index }: { rec: AiReportRecommendation; index: number }) {
  return (
    <div
      className="rounded-2xl border border-border/50 bg-card p-5 hover:shadow-md transition-shadow card-stagger"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#00C17A]/10 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-4 h-4 text-[#00C17A]" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-[14px] font-bold text-foreground/80">{rec.title}</h3>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{
                backgroundColor: `${SEVERITY_COLORS[rec.priority]}15`,
                color: SEVERITY_COLORS[rec.priority],
              }}
            >
              {PRIORITY_LABELS[rec.priority] || rec.priority}
            </span>
          </div>
          <p className="text-[13px] font-bold text-muted-foreground/60 leading-relaxed">{rec.description}</p>
        </div>
      </div>
    </div>
  );
}

function CommentCard({ item }: { item: AnalyzedItem }) {
  const Icon = PLATFORM_ICON_MAP[item.platform];
  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        {/* Platform icon */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: `${PLATFORM_COLORS[item.platform as Platform] || "#8B5CF6"}15`,
            color: PLATFORM_COLORS[item.platform as Platform] || "#8B5CF6",
          }}
        >
          {Icon ? <Icon className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
        </div>

        <div className="flex-1 min-w-0">
          {/* Text */}
          <p className="text-[13px] font-bold text-foreground/70 leading-relaxed mb-2">{item.text}</p>

          {/* Badges */}
          <div className="flex items-center flex-wrap gap-1.5">
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{
                backgroundColor: `${SENTIMENT_COLORS[item.sentiment]}15`,
                color: SENTIMENT_COLORS[item.sentiment],
              }}
            >
              {SENTIMENT_LABELS[item.sentiment] || item.sentiment}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted/10 text-muted-foreground">
              {item.emotion}
            </span>
            {item.keywords.slice(0, 3).map((kw) => (
              <span key={kw} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0072F9]/10 text-[#0072F9]/70">
                {kw}
              </span>
            ))}
            <span className="text-[10px] font-bold text-muted-foreground/40 mr-auto">
              {PLATFORM_LABELS[item.platform as Platform] || item.platform}
            </span>
          </div>

          {/* Reason */}
          {item.reason && (
            <p className="text-[11px] font-bold text-muted-foreground/40 mt-1.5 leading-relaxed">{item.reason}</p>
          )}
        </div>
      </div>
    </div>
  );
}

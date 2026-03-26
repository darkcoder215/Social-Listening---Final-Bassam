import { useMemo } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis,
} from "recharts";
import { AlertTriangle } from "lucide-react";
import type { DrawerFilter } from "@/lib/db-types";
import type { SentimentAggregation } from "@/hooks/useSentimentData";
import WordCloud from "./WordCloud";

/* ── Colors ── */
const SENTIMENT_COLORS: Record<string, string> = {
  positive: "#00C17A",
  neutral: "#6B7280",
  mockery: "#F59E0B",
  negative: "#EF4444",
};

const SENTIMENT_LABELS: Record<string, string> = {
  positive: "إيجابي",
  neutral: "محايد",
  mockery: "سخرية",
  negative: "سلبي",
};

const HOSTILITY_COLORS: Record<string, string> = {
  none: "#00C17A",
  low: "#FBBF24",
  medium: "#F97316",
  high: "#EF4444",
};

const HOSTILITY_LABELS: Record<string, string> = {
  none: "معدوم",
  low: "منخفض",
  medium: "متوسط",
  high: "عالي",
};

const RELEVANCE_COLORS: Record<string, string> = {
  "directly about Thmanyah": "#0072F9",
  "not sure": "#9CA3AF",
  "not about Thmanyah": "#6B7280",
};

const RELEVANCE_LABELS: Record<string, string> = {
  "directly about Thmanyah": "مباشرة عن ثمانية",
  "not sure": "غير متأكد",
  "not about Thmanyah": "لا يخص ثمانية",
};

const RED_COLORS = ["#FCA5A5", "#F87171", "#EF4444", "#DC2626", "#B91C1C", "#991B1B"];
const GREEN_COLORS = ["#86EFAC", "#4ADE80", "#22C55E", "#16A34A", "#15803D", "#166534"];

/* ── Tooltip ── */
function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null;
  return (
    <div className="bg-[#1a1a2e] text-white px-3 py-2 rounded-xl shadow-xl border border-white/10 text-[11px] font-bold">
      <p className="text-white/60 mb-0.5">{payload[0].name || payload[0].payload?.name}</p>
      <p>{payload[0].value?.toLocaleString("en-US")} تعليق</p>
    </div>
  );
}

/* ── Skeleton ── */
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/20 ${className}`} />;
}

/* ── Props ── */
interface Props {
  data?: SentimentAggregation;
  isLoading: boolean;
  onFilterClick: (filter: DrawerFilter) => void;
  sampleNote?: string;
}

export default function SentimentPanel({ data, isLoading, onFilterClick, sampleNote }: Props) {
  // Prepare chart data
  const sentimentData = useMemo(() => {
    if (!data) return [];
    return ["positive", "neutral", "mockery", "negative"]
      .filter(k => data.sentimentCounts[k])
      .map(k => ({
        name: SENTIMENT_LABELS[k],
        value: data.sentimentCounts[k],
        key: k,
        color: SENTIMENT_COLORS[k],
      }));
  }, [data]);

  const hostilityData = useMemo(() => {
    if (!data) return [];
    return ["none", "low", "medium", "high"]
      .filter(k => data.hostilityCounts[k])
      .map(k => ({
        name: HOSTILITY_LABELS[k],
        value: data.hostilityCounts[k],
        key: k,
        color: HOSTILITY_COLORS[k],
      }));
  }, [data]);

  const relevanceData = useMemo(() => {
    if (!data) return [];
    return Object.keys(RELEVANCE_LABELS)
      .filter(k => data.relevanceCounts[k])
      .map(k => ({
        name: RELEVANCE_LABELS[k],
        value: data.relevanceCounts[k],
        key: k,
        color: RELEVANCE_COLORS[k],
      }));
  }, [data]);

  const topicsData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.topicsCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15)
      .map(([name, value]) => ({ name, value }));
  }, [data]);

  const techIssueTotal = useMemo(() => {
    if (!data) return 0;
    return Object.values(data.technicalIssuesCounts).reduce((s, v) => s + v, 0);
  }, [data]);

  const techIssuePct = data ? ((techIssueTotal / data.total) * 100).toFixed(1) : "0";

  const namesData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.namesCounts)
      .filter(([, count]) => count >= 2)
      .sort(([, a], [, b]) => b - a);
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[300px]" />
        <Skeleton className="h-[200px]" />
        <Skeleton className="h-[200px]" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4 overflow-y-auto custom-scrollbar">
      {/* Sample note */}
      {sampleNote && (
        <div className="px-3 py-2 rounded-lg bg-thmanyah-blue/5 border border-thmanyah-blue/10">
          <p className="text-[10px] font-bold text-thmanyah-blue/70">{sampleNote}</p>
        </div>
      )}

      {/* 1. Sentiment Donut */}
      <div className="bg-card rounded-xl border border-border/40 p-4">
        <h4 className="text-[12px] font-display font-bold text-foreground/70 mb-3">توزيع الانطباعات</h4>
        <div className="h-[240px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sentimentData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                dataKey="value"
                stroke="hsl(var(--card))"
                strokeWidth={3}
                cursor="pointer"
                animationDuration={800}
                onClick={(entry: any) => {
                  if (entry?.key) {
                    onFilterClick({ type: "sentiment", value: entry.key, label: `انطباع: ${entry.name}` });
                  }
                }}
              >
                {sentimentData.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-lg font-bold text-foreground/80" dir="ltr">{data.total.toLocaleString("ar-SA")}</div>
              <div className="text-[9px] font-bold text-muted-foreground/40">تعليق محلّل</div>
            </div>
          </div>
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-2 justify-center">
          {sentimentData.map(d => (
            <button
              key={d.key}
              onClick={() => onFilterClick({ type: "sentiment", value: d.key, label: `انطباع: ${d.name}` })}
              className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-[10px] font-bold text-muted-foreground/60">
                {d.name} ({d.value})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Hostility Bar Chart */}
      <div className="bg-card rounded-xl border border-border/40 p-4">
        <h4 className="text-[12px] font-display font-bold text-foreground/70 mb-3">مستوى العدائية</h4>
        <div className="h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hostilityData} layout="vertical">
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: "hsl(var(--muted-foreground))" }} width={60} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.15)" }} />
              <Bar
                dataKey="value"
                radius={[0, 6, 6, 0]}
                cursor="pointer"
                animationDuration={800}
                onClick={(entry: any) => {
                  if (entry?.key) {
                    onFilterClick({ type: "hostility", value: entry.key, label: `عدائية: ${entry.name}` });
                  }
                }}
              >
                {hostilityData.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Relevance Pie */}
      <div className="bg-card rounded-xl border border-border/40 p-4">
        <h4 className="text-[12px] font-display font-bold text-foreground/70 mb-3">صلة بثمانية</h4>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={relevanceData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                dataKey="value"
                stroke="hsl(var(--card))"
                strokeWidth={3}
                cursor="pointer"
                animationDuration={800}
                onClick={(entry: any) => {
                  if (entry?.key) {
                    onFilterClick({ type: "relevance", value: entry.key, label: `صلة: ${entry.name}` });
                  }
                }}
              >
                {relevanceData.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-3 mt-2 justify-center">
          {relevanceData.map(d => (
            <button
              key={d.key}
              onClick={() => onFilterClick({ type: "relevance", value: d.key, label: `صلة: ${d.name}` })}
              className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-[10px] font-bold text-muted-foreground/60">{d.name} ({d.value})</span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Top Topics */}
      {topicsData.length > 0 && (
        <div className="bg-card rounded-xl border border-border/40 p-4">
          <h4 className="text-[12px] font-display font-bold text-foreground/70 mb-3">أبرز المواضيع</h4>
          <div style={{ height: Math.max(200, topicsData.length * 28) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topicsData} layout="vertical" margin={{ left: 0 }}>
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: "hsl(var(--muted-foreground))" }} width={120} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.15)" }} />
                <Bar
                  dataKey="value"
                  fill="#0072F9"
                  radius={[0, 6, 6, 0]}
                  cursor="pointer"
                  animationDuration={800}
                  onClick={(entry: any) => {
                    if (entry?.name) {
                      onFilterClick({ type: "topic", value: entry.name, label: `موضوع: ${entry.name}` });
                    }
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 5. Technical Issues */}
      {techIssueTotal > 0 && (
        <div className={`bg-card rounded-xl border p-4 ${Number(techIssuePct) > 5 ? "border-red-500/30" : "border-border/40"}`}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className={`w-3.5 h-3.5 ${Number(techIssuePct) > 5 ? "text-red-500" : "text-muted-foreground/40"}`} />
            <h4 className="text-[12px] font-display font-bold text-foreground/70">مشاكل تقنية</h4>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${Number(techIssuePct) > 5 ? "bg-red-500/10 text-red-500" : "bg-muted/10 text-muted-foreground/60"}`}>
              {techIssueTotal} تعليق ({techIssuePct}%)
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.technicalIssuesCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([issue, count]) => (
                <button
                  key={issue}
                  onClick={() => onFilterClick({ type: "technical_issue", value: issue, label: `مشكلة: ${issue}` })}
                  className="px-2.5 py-1 rounded-lg bg-muted/5 border border-border/40 text-[10px] font-bold text-foreground/60 hover:border-border transition-colors"
                >
                  {issue} ({count})
                </button>
              ))}
          </div>
        </div>
      )}

      {/* 6. Word Clouds — Negative & Positive side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <WordCloud
          texts={data.negativeTexts}
          isLoading={false}
          onWordClick={(word) => onFilterClick({ type: "word", word, label: `كلمة: ${word}` })}
          colors={RED_COLORS}
          title="كلمات التعليقات السلبية"
          containerBg="rgba(239,68,68,0.03)"
          height={300}
        />
        <WordCloud
          texts={data.positiveTexts}
          isLoading={false}
          onWordClick={(word) => onFilterClick({ type: "word", word, label: `كلمة: ${word}` })}
          colors={GREEN_COLORS}
          title="كلمات التعليقات الإيجابية"
          containerBg="rgba(0,193,122,0.03)"
          height={300}
        />
      </div>

      {/* 7. Names Mentioned */}
      {namesData.length > 0 && (
        <div className="bg-card rounded-xl border border-border/40 p-4">
          <h4 className="text-[12px] font-display font-bold text-foreground/70 mb-3">أسماء مذكورة</h4>
          <div className="flex flex-wrap gap-1.5">
            {namesData.map(([name, count]) => (
              <button
                key={name}
                onClick={() => onFilterClick({ type: "name_mentioned", value: name, label: `اسم: ${name}` })}
                className="px-2.5 py-1 rounded-lg bg-muted/5 border border-border/40 text-[10px] font-bold text-foreground/60 hover:border-thmanyah-blue/30 hover:text-thmanyah-blue transition-all"
              >
                {name} <span className="text-muted-foreground/40">({count})</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

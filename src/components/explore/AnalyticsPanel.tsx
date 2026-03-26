import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
} from "recharts";
import { MessageSquare, Eye, Heart, TrendingUp } from "lucide-react";
import type { PlatformStats, ChartPoint, TopPost, AccountCount, DrawerFilter, Platform } from "@/lib/db-types";
import { fmtNum, PLATFORM_COLORS } from "@/lib/db-types";
import WordCloud from "./WordCloud";
import ProductChart from "./ProductChart";
import type { ProductMention } from "@/hooks/useProductMentions";

/* ── Skeleton ── */
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/20 ${className}`} />;
}

/* ── Shared dark tooltip ── */
function ChartTooltip({ active, payload, label, suffix }: any) {
  if (!active || !payload?.[0]) return null;
  return (
    <div className="bg-[#1a1a2e] text-white px-3 py-2 rounded-xl shadow-xl border border-white/10 text-[11px] font-bold">
      <p className="text-white/60 mb-0.5">{label}</p>
      <p>{payload[0].value?.toLocaleString("en-US")} {suffix}</p>
    </div>
  );
}

/* ── KPI Card ── */
function KPICard({ label, value, icon: Icon, color, bg, loading }: {
  label: string; value: number; icon: React.ElementType;
  color: string; bg: string; loading: boolean;
}) {
  return (
    <div className="bg-card rounded-xl border border-border/40 p-4 card-hover-lift">
      <div className="flex items-start justify-between mb-2">
        <div className={`p-2 rounded-lg ${bg}`}>
          <Icon className={`w-3.5 h-3.5 ${color}`} strokeWidth={1.8} />
        </div>
      </div>
      {loading ? (
        <Skeleton className="h-6 w-16 mb-1" />
      ) : (
        <div className="text-xl font-bold text-foreground/90 mb-0.5 counter-animate" dir="ltr">
          {fmtNum(value)}
        </div>
      )}
      <div className="text-[11px] font-bold text-muted-foreground/50">{label}</div>
    </div>
  );
}

const PIE_COLORS = ["#00C17A", "#0072F9", "#F24935", "#FFBC0A", "#8B5CF6"];

/* ── Main Panel ── */
interface Props {
  platform: Platform;
  stats?: PlatformStats;
  commentsPerDay?: ChartPoint[];
  topPosts?: TopPost[];
  postsPerDay?: ChartPoint[];
  commentsPerAccount?: AccountCount[];
  isLoading: boolean;
  showAccountPie: boolean;
  onChartClick?: (filter: DrawerFilter) => void;
  commentTexts?: string[];
  commentTextsLoading?: boolean;
  onWordClick?: (word: string) => void;
  productMentions?: ProductMention[];
  productMentionsLoading?: boolean;
  onProductClick?: (textTerm: string, productName: string, productId?: string) => void;
}

export default function AnalyticsPanel({
  platform, stats, commentsPerDay, topPosts, postsPerDay,
  commentsPerAccount, isLoading, showAccountPie, onChartClick,
  commentTexts, commentTextsLoading, onWordClick,
  productMentions, productMentionsLoading, onProductClick,
}: Props) {
  const color = PLATFORM_COLORS[platform];

  return (
    <div className="space-y-4 overflow-y-auto custom-scrollbar">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        <KPICard label="المنشورات" value={stats?.total_posts || 0} icon={TrendingUp} color="text-thmanyah-blue" bg="bg-thmanyah-blue/[0.06]" loading={isLoading} />
        <KPICard label="التعليقات" value={stats?.total_comments || 0} icon={MessageSquare} color="text-thmanyah-green" bg="bg-thmanyah-green/[0.06]" loading={isLoading} />
        <KPICard label="الإعجابات" value={stats?.total_likes || 0} icon={Heart} color="text-thmanyah-red" bg="bg-thmanyah-red/[0.06]" loading={isLoading} />
        <KPICard label="المشاهدات" value={stats?.total_views || 0} icon={Eye} color="text-thmanyah-amber" bg="bg-thmanyah-amber/[0.06]" loading={isLoading} />
      </div>

      {/* Comments Per Day — Bar Chart */}
      {commentsPerDay && commentsPerDay.length > 0 && (
        <div className="bg-card rounded-xl border border-border/40 p-4">
          <h4 className="text-[12px] font-display font-bold text-foreground/70 mb-3">التعليقات يومياً</h4>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={commentsPerDay}>
                <defs>
                  <linearGradient id={`bar-grad-${platform}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fontWeight: 700, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fontWeight: 700, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v) => v.toLocaleString("en-US")}
                />
                <Tooltip content={<ChartTooltip suffix="تعليق" />} cursor={{ fill: "hsl(var(--muted) / 0.15)" }} />
                <Bar
                  dataKey="count"
                  fill={`url(#bar-grad-${platform})`}
                  radius={[6, 6, 0, 0]}
                  cursor="pointer"
                  animationDuration={800}
                  onClick={(data: any) => {
                    if (onChartClick && data?.date) {
                      onChartClick({ type: "date", date: data.date, label: data.date });
                    }
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top Posts (Horizontal Bar) */}
      {topPosts && topPosts.length > 0 && (
        <div className="bg-card rounded-xl border border-border/40 p-4">
          <h4 className="text-[12px] font-display font-bold text-foreground/70 mb-3">الأكثر تفاعلاً</h4>
          <div className="space-y-2.5">
            {topPosts.slice(0, 5).map((p) => {
              const maxEng = topPosts[0].engagement || 1;
              const pct = Math.round((p.engagement / maxEng) * 100);
              return (
                <button
                  key={p.id}
                  onClick={() => onChartClick?.({ type: "post", postId: p.id, label: p.text.slice(0, 40) || p.id })}
                  className="w-full text-right group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-foreground/60 truncate flex-1">
                      {p.text.slice(0, 50) || "—"}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground/40 shrink-0" dir="ltr">
                      {fmtNum(p.engagement)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted/10 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 group-hover:opacity-80"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Comments Per Account (Donut) */}
      {showAccountPie && commentsPerAccount && commentsPerAccount.length > 0 && (
        <div className="bg-card rounded-xl border border-border/40 p-4">
          <h4 className="text-[12px] font-display font-bold text-foreground/70 mb-3">التعليقات حسب الحساب</h4>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={commentsPerAccount.map((a) => ({ name: a.accountAr || a.account, value: Number(a.count) }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  stroke="hsl(var(--card))"
                  strokeWidth={3}
                  cursor="pointer"
                  animationDuration={800}
                  onClick={(data: any) => {
                    const acc = commentsPerAccount.find((a) => (a.accountAr || a.account) === data?.name);
                    if (acc && onChartClick) {
                      onChartClick({ type: "account", account: acc.account, label: acc.accountAr || acc.account });
                    }
                  }}
                >
                  {commentsPerAccount.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }: any) =>
                    active && payload?.[0] ? (
                      <div className="bg-[#1a1a2e] text-white px-3 py-2 rounded-xl shadow-xl border border-white/10 text-[11px] font-bold">
                        <p className="text-white/60 mb-0.5">{payload[0].name}</p>
                        <p>{payload[0].value?.toLocaleString("en-US")} تعليق</p>
                      </div>
                    ) : null
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {commentsPerAccount.map((a, i) => (
              <div key={a.account} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="text-[10px] font-bold text-muted-foreground/60">{a.accountAr || a.account}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Posts Per Day — Area Chart */}
      {postsPerDay && postsPerDay.length > 0 && (
        <div className="bg-card rounded-xl border border-border/40 p-4">
          <h4 className="text-[12px] font-display font-bold text-foreground/70 mb-3">وتيرة النشر</h4>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={postsPerDay}>
                <defs>
                  <linearGradient id={`area-grad-${platform}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fontWeight: 700, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fontWeight: 700, fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip content={<ChartTooltip suffix="منشور" />} cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: "4 4" }} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#area-grad-${platform})`}
                  dot={{ r: 3, fill: color, stroke: "hsl(var(--card))", strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: color }}
                  animationDuration={800}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Word Cloud */}
      <WordCloud
        texts={commentTexts || []}
        isLoading={commentTextsLoading || false}
        onWordClick={onWordClick}
      />

      {/* Product Mentions */}
      <ProductChart
        data={productMentions}
        isLoading={productMentionsLoading || false}
        title="المنتجات"
        onProductClick={onProductClick}
      />
    </div>
  );
}

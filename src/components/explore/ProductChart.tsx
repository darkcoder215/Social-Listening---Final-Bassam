import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { BarChart3 } from "lucide-react";
import type { ProductMention } from "@/hooks/useProductMentions";

const BRAND_GREEN = "#00C17A";

const fmtAr = (n: number) => n.toLocaleString("ar-SA");

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/20 ${className}`} />;
}

interface Props {
  data?: ProductMention[];
  isLoading: boolean;
  title?: string;
  onProductClick?: (textTerm: string, productName: string, productId?: string) => void;
}

export default function ProductChart({
  data,
  isLoading,
  title = "تفاعل المنتجات",
  onProductClick,
}: Props) {
  const filtered = (data || []).filter(p => p.totalComments > 0).slice(0, 8);

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border/40 p-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-muted-foreground/40" />
          <h4 className="text-[12px] font-display font-bold text-foreground/70">{title}</h4>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (filtered.length === 0) return null;

  const chartHeight = Math.max(200, filtered.length * 32 + 40);

  return (
    <div className="bg-card rounded-xl border border-border/40 p-4">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-thmanyah-green/60" />
        <h4 className="text-[12px] font-display font-bold text-foreground/70">{title}</h4>
      </div>

      <div style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={filtered}
            layout="vertical"
            margin={{ top: 0, right: 40, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id="product-bar-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={BRAND_GREEN} stopOpacity={0.7} />
                <stop offset="100%" stopColor={BRAND_GREEN} stopOpacity={1} />
              </linearGradient>
            </defs>
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fontWeight: 700, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(v) => v.toLocaleString("en-US")}
            />
            <YAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fontWeight: 700, fill: "hsl(var(--foreground))", opacity: 0.7 }}
              width={110}
              orientation="right"
            />
            <Tooltip
              content={({ active, payload }: any) => {
                if (!active || !payload?.[0]) return null;
                const d = payload[0].payload as ProductMention;
                return (
                  <div className="bg-[#1a1a2e] text-white px-3 py-2 rounded-xl shadow-xl border border-white/10 text-[11px] font-bold" dir="rtl">
                    <p className="text-white/90 mb-1">{d.name}</p>
                    <p className="text-thmanyah-green">{fmtAr(d.totalComments)} تعليق</p>
                    <p className="text-thmanyah-red">{fmtAr(d.totalLikes)} إعجاب</p>
                    <p className="text-white/50">{fmtAr(d.postCount)} منشور</p>
                  </div>
                );
              }}
              cursor={{ fill: "hsl(var(--muted) / 0.1)" }}
            />
            <Bar
              dataKey="totalComments"
              fill="url(#product-bar-grad)"
              radius={[0, 6, 6, 0]}
              barSize={22}
              animationDuration={600}
              cursor="pointer"
              onClick={(data: any) => {
                if (onProductClick && data) {
                  onProductClick(data.firstTextTerm, data.name, data.id);
                }
              }}
              label={{
                position: "right",
                formatter: (v: number) => v.toLocaleString("en-US"),
                fontSize: 9,
                fontWeight: 700,
                fill: "hsl(var(--muted-foreground))",
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[10px] font-bold text-muted-foreground/30 text-center mt-2">أعلى ٨ منتجات تفاعلاً</p>
    </div>
  );
}

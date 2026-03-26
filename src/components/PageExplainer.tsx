import type { LucideIcon } from "lucide-react";

interface PageExplainerProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
}

export default function PageExplainer({
  icon: Icon,
  title,
  description,
  color,
}: PageExplainerProps) {
  return (
    <div
      className="card-stagger relative overflow-hidden rounded-2xl border border-border/40 p-6"
      style={{
        backgroundImage: `linear-gradient(135deg, ${color}06, transparent 60%)`,
        animationDelay: "0s",
      }}
    >
      {/* Subtle glow */}
      <div
        className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-[80px] opacity-20 pointer-events-none"
        style={{ backgroundColor: color }}
      />

      <div className="relative flex items-center gap-4">
        <div
          className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center animate-float"
          style={{
            backgroundColor: `${color}12`,
            border: `1px solid ${color}20`,
            color,
          }}
        >
          <Icon className="w-5 h-5" strokeWidth={1.8} />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-display font-bold text-foreground/90 leading-tight">
            {title}
          </h2>
          <p className="text-[12px] font-bold text-muted-foreground/50 mt-0.5 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

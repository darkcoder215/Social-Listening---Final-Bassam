import { useMemo } from "react";

/* ── Platform planets ── */
const PLANETS = [
  { label: "X", color: "#1DA1F2", size: 38, orbit: 90, speed: 28, icon: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
  { label: "TikTok", color: "#ff0050", size: 32, orbit: 130, speed: 36, icon: "M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.86a8.28 8.28 0 004.77 1.52V6.91a4.84 4.84 0 01-1-.22z" },
  { label: "IG", color: "#E4405F", size: 28, orbit: 60, speed: 22, icon: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" },
  { label: "YT", color: "#FF0000", size: 34, orbit: 110, speed: 42, icon: "M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" },
];

/* ── Sentiment meteors ── */
const METEORS = [
  { text: "محتوى استثنائي!", sentiment: "positive" as const, delay: 0, top: 18 },
  { text: "جودة عالية جداً", sentiment: "positive" as const, delay: 8, top: 55 },
  { text: "أتمنى تحسين الصوت", sentiment: "negative" as const, delay: 4, top: 35 },
  { text: "ننتظر الحلقة القادمة", sentiment: "neutral" as const, delay: 12, top: 72 },
  { text: "تغطية سريعة وممتازة", sentiment: "positive" as const, delay: 16, top: 45 },
  { text: "الإعلانات كثيرة", sentiment: "negative" as const, delay: 20, top: 25 },
];

const SENTIMENT_STYLES = {
  positive: { border: "rgba(0,193,122,0.4)", bg: "rgba(0,193,122,0.12)", text: "rgba(0,193,122,0.9)" },
  negative: { border: "rgba(242,73,53,0.4)", bg: "rgba(242,73,53,0.12)", text: "rgba(242,73,53,0.9)" },
  neutral: { border: "rgba(255,255,255,0.15)", bg: "rgba(255,255,255,0.06)", text: "rgba(255,255,255,0.5)" },
};

export default function SpaceHero() {
  /* Generate random stars once */
  const stars = useMemo(() => {
    const result: { x: number; y: number; size: number; opacity: number; twinkleDelay: number }[] = [];
    for (let i = 0; i < 80; i++) {
      result.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.6 + 0.15,
        twinkleDelay: Math.random() * 5,
      });
    }
    return result;
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#08080e] text-white p-8 min-h-[220px]">
      {/* ── Star field ── */}
      <div className="absolute inset-0 pointer-events-none">
        {stars.map((s, i) => (
          <div
            key={i}
            className="space-star absolute rounded-full bg-white"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              opacity: s.opacity,
              animationDelay: `${s.twinkleDelay}s`,
            }}
          />
        ))}
      </div>

      {/* ── Nebula glows ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-[100px] space-nebula-drift" style={{ background: "radial-gradient(circle, rgba(0,193,122,0.12) 0%, transparent 70%)" }} />
        <div className="absolute -bottom-16 left-[10%] w-56 h-56 rounded-full blur-[90px] space-nebula-drift-alt" style={{ background: "radial-gradient(circle, rgba(0,114,249,0.10) 0%, transparent 70%)" }} />
        <div className="absolute top-[20%] left-[60%] w-40 h-40 rounded-full blur-[80px] space-nebula-drift" style={{ background: "radial-gradient(circle, rgba(242,73,53,0.06) 0%, transparent 70%)", animationDelay: "3s" }} />
      </div>

      {/* ── Orbit system (right side) ── */}
      <div className="absolute top-1/2 left-[15%] -translate-y-1/2 hidden md:block pointer-events-none">
        {/* Central "sun" — Thmanyah logo glow */}
        <div className="absolute -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "radial-gradient(circle, rgba(0,193,122,0.25) 0%, transparent 70%)" }}>
          <div className="w-5 h-5 rounded-full bg-thmanyah-green/60 space-sun-pulse" />
        </div>

        {/* Orbit rings */}
        {[60, 90, 130].map((r) => (
          <div
            key={r}
            className="absolute rounded-full border border-white/[0.04]"
            style={{
              width: r * 2,
              height: r * 2,
              top: -r,
              left: -r,
            }}
          />
        ))}

        {/* Planet bodies */}
        {PLANETS.map((planet) => (
          <div
            key={planet.label}
            className="absolute space-orbit"
            style={{
              width: planet.orbit * 2,
              height: planet.orbit * 2,
              top: -planet.orbit,
              left: -planet.orbit,
              animationDuration: `${planet.speed}s`,
            }}
          >
            {/* Planet positioned at top of orbit circle */}
            <div
              className="absolute space-planet-glow"
              style={{
                width: planet.size,
                height: planet.size,
                top: -planet.size / 2,
                left: `calc(50% - ${planet.size / 2}px)`,
                borderRadius: "50%",
                background: `radial-gradient(circle at 35% 35%, ${planet.color}40, ${planet.color}15)`,
                border: `1.5px solid ${planet.color}50`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 0 ${planet.size / 2}px ${planet.color}20, inset 0 0 ${planet.size / 3}px ${planet.color}10`,
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill={planet.color}
                style={{ width: planet.size * 0.4, height: planet.size * 0.4, opacity: 0.8 }}
              >
                <path d={planet.icon} />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* ── Sentiment meteors ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {METEORS.map((m, i) => {
          const style = SENTIMENT_STYLES[m.sentiment];
          return (
            <div
              key={i}
              className="absolute space-meteor"
              style={{
                top: `${m.top}%`,
                right: "-220px",
                animationDelay: `${m.delay}s`,
              }}
            >
              {/* Tail */}
              <div
                className="absolute top-1/2 -translate-y-1/2 h-[1px] -left-12 w-12"
                style={{
                  background: `linear-gradient(to right, transparent, ${style.border})`,
                }}
              />
              {/* Body */}
              <div
                className="px-2.5 py-1 rounded-full text-[9px] font-bold whitespace-nowrap backdrop-blur-sm"
                style={{
                  background: style.bg,
                  border: `1px solid ${style.border}`,
                  color: style.text,
                }}
              >
                {m.text}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Text content ── */}
      <div className="relative z-10 flex items-center justify-between min-h-[160px]">
        <div className="max-w-md">
          <h2 className="text-2xl font-display font-bold text-white/90 mb-2">
            مرحباً بك في منصة الرصد الاجتماعي
          </h2>
          <p className="text-sm font-bold text-white/35 leading-relaxed">
            تتبع وحلل التفاعل الاجتماعي عبر جميع المنصات — X، TikTok، Instagram، و YouTube
          </p>
          {/* Sentiment legend */}
          <div className="flex items-center gap-3 mt-4">
            {([
              { label: "إيجابي", color: "#00C17A" },
              { label: "سلبي", color: "#F24935" },
              { label: "محايد", color: "rgba(255,255,255,0.4)" },
            ]).map((s) => (
              <div key={s.label} className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-[10px] font-bold" style={{ color: s.color }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useMemo } from "react";

const SOCIAL_PLATFORMS = [
  {
    name: "X / Twitter",
    color: "#1DA1F2",
    size: 48,
    orbitRadius: 155,
    orbitSpeed: 30,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: "TikTok",
    color: "#ff0050",
    size: 42,
    orbitRadius: 155,
    orbitSpeed: 30,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.86a8.28 8.28 0 004.77 1.52V6.91a4.84 4.84 0 01-1-.22z" />
      </svg>
    ),
  },
  {
    name: "Instagram",
    color: "#E4405F",
    size: 40,
    orbitRadius: 155,
    orbitSpeed: 30,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    name: "YouTube",
    color: "#FF0000",
    size: 44,
    orbitRadius: 155,
    orbitSpeed: 30,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    name: "Meltwater",
    color: "#0072F9",
    size: 38,
    orbitRadius: 155,
    orbitSpeed: 30,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M3 3v18h18V3H3zm16 16H5V5h14v14zM7 7h4v4H7V7zm6 0h4v4h-4V7zm-6 6h4v4H7v-4zm6 0h4v4h-4v-4z" />
      </svg>
    ),
  },
  {
    name: "AI Analysis",
    color: "#00C17A",
    size: 38,
    orbitRadius: 155,
    orbitSpeed: 30,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 2a1 1 0 011 1v2.07A8.001 8.001 0 0119.93 12H22a1 1 0 110 2h-2.07A8.001 8.001 0 0113 20.93V23a1 1 0 11-2 0v-2.07A8.001 8.001 0 014.07 14H2a1 1 0 110-2h2.07A8.001 8.001 0 0111 5.07V3a1 1 0 011-1zm0 5a5 5 0 100 10 5 5 0 000-10zm0 3a2 2 0 110 4 2 2 0 010-4z" />
      </svg>
    ),
  },
];

/* Sentiment meteors that fly across the screen */
const METEORS = [
  { text: "محتوى ممتاز!", sentiment: "positive" as const, delay: 0.8, y: 15, speed: 4 },
  { text: "أفضل بودكاست عربي", sentiment: "positive" as const, delay: 2.0, y: 75, speed: 3.5 },
  { text: "الإعلانات كثيرة", sentiment: "negative" as const, delay: 1.3, y: 35, speed: 4.5 },
  { text: "ننتظر المزيد", sentiment: "neutral" as const, delay: 2.6, y: 55, speed: 3.8 },
  { text: "تغطية رائعة", sentiment: "positive" as const, delay: 1.8, y: 85, speed: 4.2 },
  { text: "الصوت يحتاج تحسين", sentiment: "negative" as const, delay: 0.4, y: 25, speed: 3.2 },
  { text: "جودة سينمائية", sentiment: "positive" as const, delay: 3.0, y: 65, speed: 3.6 },
  { text: "أسلوب سرد مميز", sentiment: "positive" as const, delay: 2.3, y: 45, speed: 4.8 },
];

const SENTIMENT_STYLES = {
  positive: { border: "rgba(0,193,122,0.5)", bg: "rgba(0,193,122,0.15)", text: "rgba(0,193,122,0.95)" },
  negative: { border: "rgba(242,73,53,0.5)", bg: "rgba(242,73,53,0.15)", text: "rgba(242,73,53,0.95)" },
  neutral: { border: "rgba(255,255,255,0.2)", bg: "rgba(255,255,255,0.08)", text: "rgba(255,255,255,0.6)" },
};

interface SplashIntroProps {
  onComplete: () => void;
}

export default function SplashIntro({ onComplete }: SplashIntroProps) {
  const [phase, setPhase] = useState<"logo" | "orbit" | "text" | "exit">("logo");

  /* Generate random stars once */
  const stars = useMemo(() => {
    const result: { x: number; y: number; size: number; opacity: number; delay: number }[] = [];
    for (let i = 0; i < 150; i++) {
      result.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2.5 + 0.5,
        opacity: Math.random() * 0.7 + 0.1,
        delay: Math.random() * 5,
      });
    }
    return result;
  }, []);

  /* Shooting stars */
  const shootingStars = useMemo(() => {
    return Array.from({ length: 4 }).map((_, i) => ({
      delay: 0.5 + i * 1.2,
      y: 10 + Math.random() * 40,
      duration: 1 + Math.random() * 0.8,
    }));
  }, []);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase("orbit"), 1000),
      setTimeout(() => setPhase("text"), 3000),
      setTimeout(() => setPhase("exit"), 6000),
      setTimeout(() => onComplete(), 7000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const handleSkip = () => {
    setPhase("exit");
    setTimeout(() => onComplete(), 700);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center overflow-hidden transition-opacity duration-700 ${
        phase === "exit" ? "opacity-0" : "opacity-100"
      }`}
      style={{ background: "radial-gradient(ellipse at 50% 50%, #0a0a14 0%, #050508 50%, #020204 100%)" }}
    >
      {/* ── Skip button ── */}
      <button
        onClick={handleSkip}
        className="absolute top-6 left-6 z-10 flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.06] border border-white/[0.08] text-white/40 text-[12px] font-bold hover:text-white/70 hover:bg-white/[0.1] transition-all"
      >
        تخطي
      </button>

      {/* ── Star field ── */}
      <div className="absolute inset-0 overflow-hidden">
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
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
      </div>

      {/* ── Shooting stars ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {shootingStars.map((ss, i) => (
          <div
            key={i}
            className="splash-shooting-star"
            style={{
              top: `${ss.y}%`,
              animationDelay: `${ss.delay}s`,
              animationDuration: `${ss.duration}s`,
            }}
          />
        ))}
      </div>

      {/* ── Nebula glows ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute w-[500px] h-[500px] rounded-full blur-[150px] space-nebula-drift"
          style={{ top: "15%", left: "20%", background: "radial-gradient(circle, rgba(0,193,122,0.08) 0%, transparent 70%)" }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full blur-[120px] space-nebula-drift-alt"
          style={{ bottom: "10%", right: "15%", background: "radial-gradient(circle, rgba(0,114,249,0.06) 0%, transparent 70%)" }}
        />
        <div
          className="absolute w-[350px] h-[350px] rounded-full blur-[100px] space-nebula-drift"
          style={{ top: "50%", right: "30%", background: "radial-gradient(circle, rgba(242,73,53,0.04) 0%, transparent 70%)", animationDelay: "4s" }}
        />
        <div
          className="absolute w-[300px] h-[300px] rounded-full blur-[100px] space-nebula-drift-alt"
          style={{ top: "30%", left: "60%", background: "radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 70%)", animationDelay: "2s" }}
        />
      </div>

      {/* ── Sentiment Meteors ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {METEORS.map((m, i) => {
          const style = SENTIMENT_STYLES[m.sentiment];
          return (
            <div
              key={i}
              className="splash-sentiment-meteor"
              style={{
                top: `${m.y}%`,
                animationDelay: `${m.delay}s`,
                animationDuration: `${m.speed}s`,
              }}
            >
              {/* Comet tail */}
              <div
                className="absolute top-1/2 -translate-y-1/2 h-[1px] -right-16 w-16"
                style={{
                  background: `linear-gradient(to left, transparent, ${style.border})`,
                }}
              />
              {/* Body */}
              <div
                className="px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap backdrop-blur-sm"
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

      {/* ── Ambient orbit rings ── */}
      <div
        className={`absolute w-[340px] h-[340px] rounded-full border border-white/[0.04] transition-all duration-[2000ms] ${
          phase !== "logo" ? "scale-100 opacity-100" : "scale-0 opacity-0"
        }`}
      />
      <div
        className={`absolute w-[500px] h-[500px] rounded-full border border-white/[0.025] transition-all duration-[2500ms] delay-200 ${
          phase !== "logo" ? "scale-100 opacity-100" : "scale-0 opacity-0"
        }`}
      />
      <div
        className={`absolute w-[700px] h-[700px] rounded-full border border-white/[0.015] transition-all duration-[3000ms] delay-500 ${
          phase !== "logo" ? "scale-100 opacity-100" : "scale-0 opacity-0"
        }`}
      />

      {/* ── Central hub ── */}
      <div className="relative flex flex-col items-center">
        {/* Thmanyah Logo — the "Sun" */}
        <div
          className={`relative z-20 transition-all duration-700 ease-out ${
            phase === "logo"
              ? "scale-0 opacity-0"
              : phase === "exit"
              ? "scale-110 opacity-0"
              : "scale-100 opacity-100"
          }`}
        >
          {/* Sun glow layers */}
          <div className="absolute inset-0 w-32 h-32 rounded-full blur-[60px] space-sun-pulse" style={{ background: "rgba(0,193,122,0.25)" }} />
          <div className="absolute inset-[-8px] w-[calc(100%+16px)] h-[calc(100%+16px)] rounded-full blur-[30px] opacity-30" style={{ background: "rgba(0,193,122,0.15)" }} />
          <div className="relative w-32 h-32 bg-[#0a0a14]/80 backdrop-blur-sm rounded-full border border-thmanyah-green/20 flex items-center justify-center shadow-[0_0_80px_rgba(0,193,122,0.2),0_0_160px_rgba(0,193,122,0.05)]">
            <img
              src="/Usable/thamanyah.png"
              alt="Thmanyah"
              className="w-20 h-20"
              style={{ imageRendering: "-webkit-optimize-contrast" }}
            />
          </div>
        </div>

        {/* ── Orbiting planet icons ── */}
        <div
          className={`absolute inset-0 w-32 h-32 transition-all duration-1000 ${
            phase === "orbit" || phase === "text"
              ? "opacity-100 scale-100"
              : "opacity-0 scale-75"
          }`}
          style={{ margin: "auto" }}
        >
          {SOCIAL_PLATFORMS.map((platform, i) => {
            const total = SOCIAL_PLATFORMS.length;
            const angle = (360 / total) * i;
            const radius = 160;
            return (
              <div
                key={platform.name}
                className="splash-orbit-icon"
                style={
                  {
                    "--orbit-angle": `${angle}deg`,
                    "--orbit-radius": `${radius}px`,
                    "--orbit-delay": `${i * 0.12}s`,
                    "--platform-color": platform.color,
                  } as React.CSSProperties
                }
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm transition-transform duration-300 hover:scale-110 space-planet-glow"
                  style={{
                    background: `radial-gradient(circle at 35% 35%, ${platform.color}30, ${platform.color}10)`,
                    border: `1.5px solid ${platform.color}40`,
                    color: platform.color,
                    boxShadow: `0 0 20px ${platform.color}15, inset 0 0 12px ${platform.color}08`,
                  }}
                >
                  {platform.icon}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Connection lines (stardust trails) ── */}
        <svg
          className={`absolute w-[400px] h-[400px] -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 pointer-events-none transition-opacity duration-700 ${
            phase === "orbit" || phase === "text" ? "opacity-100" : "opacity-0"
          }`}
          viewBox="0 0 400 400"
        >
          <defs>
            {SOCIAL_PLATFORMS.map((platform, i) => (
              <linearGradient key={`grad-${i}`} id={`line-grad-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={platform.color} stopOpacity="0.2" />
                <stop offset="100%" stopColor={platform.color} stopOpacity="0.02" />
              </linearGradient>
            ))}
          </defs>
          {SOCIAL_PLATFORMS.map((platform, i) => {
            const total = SOCIAL_PLATFORMS.length;
            const angle = ((360 / total) * i - 90) * (Math.PI / 180);
            const cx = 200;
            const cy = 200;
            const radius = 160;
            const x2 = cx + radius * Math.cos(angle);
            const y2 = cy + radius * Math.sin(angle);
            return (
              <line
                key={platform.name}
                x1={cx}
                y1={cy}
                x2={x2}
                y2={y2}
                stroke={`url(#line-grad-${i})`}
                strokeWidth="0.8"
                className="splash-connection-line"
                style={{ animationDelay: `${1.2 + i * 0.1}s` }}
              />
            );
          })}
        </svg>

        {/* ── Title text ── */}
        <div
          className={`absolute top-[calc(50%+180px)] left-1/2 -translate-x-1/2 whitespace-nowrap transition-all duration-700 ${
            phase === "text"
              ? "opacity-100 translate-y-0"
              : phase === "exit"
              ? "opacity-0 translate-y-4"
              : "opacity-0 translate-y-8"
          }`}
        >
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-white/90 text-center mb-3 tracking-tight">
            الرصد الاجتماعي
          </h1>
          <p className="text-sm font-ui text-thmanyah-green/70 text-center font-light tracking-[0.25em] uppercase">
            Social Listening
          </p>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Twitter,
  FileSpreadsheet,
  Radio,
  Search,
  BarChart3,
  Settings,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

const SLIDES = [
  {
    id: "welcome",
    icon: null,
    platformIcons: [
      { color: "#1DA1F2", svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg> },
      { color: "#ff0050", svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.86a8.28 8.28 0 004.77 1.52V6.91a4.84 4.84 0 01-1-.22z" /></svg> },
      { color: "#E4405F", svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg> },
      { color: "#FF0000", svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg> },
    ],
    title: "منصة الرصد الاجتماعي",
    subtitle: "ثمانية",
    description: "منصة متكاملة لرصد وتحليل التفاعل الاجتماعي عبر جميع المنصات في مكان واحد",
    color: "#00C17A",
  },
  {
    id: "tweet",
    icon: Twitter,
    title: "تحليل التغريدات",
    subtitle: "ابحث وحلل أي تغريدة فوراً",
    description: "أدخل رابط تغريدة أو كلمة مفتاحية ليقوم الذكاء الاصطناعي بتحليل المشاعر والآراء والمواضيع تلقائياً مع تصنيف دقيق لكل تعليق",
    color: "#1DA1F2",
  },
  {
    id: "data",
    icon: FileSpreadsheet,
    title: "تحليل البيانات",
    subtitle: "ارفع ملفاتك وحللها",
    description: "ارفع ملفات CSV أو Excel تحتوي على بيانات اجتماعية وسيقوم النظام بتحليل المشاعر والمواضيع لكل سجل وعرض النتائج في جدول تفاعلي مع إمكانية التصدير",
    color: "#0072F9",
  },
  {
    id: "monitoring",
    icon: Radio,
    title: "الرصد المباشر",
    subtitle: "راقب حساباتك على كل المنصات",
    description: "تابع التعليقات والتفاعل على حسابات ثمانية عبر X و TikTok و Instagram و YouTube في الوقت الفعلي مع إحصائيات ورسوم بيانية تفاعلية",
    color: "#ff0050",
  },
  {
    id: "explore",
    icon: Search,
    title: "استكشاف البيانات",
    subtitle: "ابحث وفلتر بدقة",
    description: "تصفّح جميع الإشارات والتعليقات عبر المنصات المختلفة مع فلاتر متقدمة حسب المنصة والمشاعر والموضوع والفترة الزمنية",
    color: "#FFBC0A",
  },
  {
    id: "reports",
    icon: BarChart3,
    title: "التقارير",
    subtitle: "تقارير Meltwater التفاعلية",
    description: "ارفع تقارير Meltwater بصيغة Excel واحصل على عرض تفاعلي شامل يتضمن تحليل المشاعر والاتجاهات والرسوم البيانية التفصيلية",
    color: "#8B5CF6",
  },
  {
    id: "settings",
    icon: Settings,
    title: "الإعدادات",
    subtitle: "تحكم كامل بالمنصة",
    description: "أدر استيراد البيانات ومفاتيح API وإعدادات الذكاء الاصطناعي والحسابات المراقبة من مكان واحد مع تحكم كامل بجميع جوانب المنصة",
    color: "#00C17A",
  },
];

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [animating, setAnimating] = useState(false);
  const slide = SLIDES[currentSlide];
  const isFirst = currentSlide === 0;
  const isLast = currentSlide === SLIDES.length - 1;

  const goTo = (index: number) => {
    if (animating || index === currentSlide) return;
    setDirection(index > currentSlide ? "next" : "prev");
    setAnimating(true);
    setTimeout(() => {
      setCurrentSlide(index);
      setAnimating(false);
    }, 300);
  };

  const next = () => { if (!isLast) goTo(currentSlide + 1); else onComplete(); };
  const prev = () => { if (!isFirst) goTo(currentSlide - 1); };

  // keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") next();
      if (e.key === "ArrowRight") prev();
      if (e.key === "Escape") onComplete();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const Icon = slide.icon;

  return (
    <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center overflow-hidden" style={{ background: "radial-gradient(ellipse at 50% 50%, #0a0a14 0%, #050508 50%, #020204 100%)" }}>
      {/* Star field background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 80 }).map((_, i) => (
          <div
            key={i}
            className="space-star absolute rounded-full bg-white"
            style={{
              left: `${(i * 37 + 13) % 100}%`,
              top: `${(i * 53 + 7) % 100}%`,
              width: (i % 3) + 1,
              height: (i % 3) + 1,
              opacity: 0.1 + (i % 5) * 0.1,
              animationDelay: `${(i % 7) * 0.7}s`,
            }}
          />
        ))}
        {/* Nebula glows */}
        <div className="absolute w-[500px] h-[500px] rounded-full blur-[150px] space-nebula-drift transition-colors duration-700" style={{ top: "15%", left: "25%", background: `radial-gradient(circle, ${slide.color}10 0%, transparent 70%)` }} />
        <div className="absolute w-[400px] h-[400px] rounded-full blur-[120px] space-nebula-drift-alt transition-colors duration-700" style={{ bottom: "15%", right: "20%", background: `radial-gradient(circle, ${slide.color}08 0%, transparent 70%)` }} />
      </div>

      {/* Skip button */}
      <button
        onClick={onComplete}
        className="absolute top-6 left-6 z-10 flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.06] border border-white/[0.08] text-white/40 text-[12px] font-bold hover:text-white/70 hover:bg-white/[0.1] transition-all"
      >
        تخطي
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Slide counter */}
      <div className="absolute top-6 right-6 z-10 text-[11px] font-bold text-white/20">
        {currentSlide + 1} / {SLIDES.length}
      </div>

      {/* Slide Content */}
      <div className={`relative z-10 max-w-lg w-full px-8 text-center transition-all duration-300 ${animating ? (direction === "next" ? "opacity-0 translate-x-8" : "opacity-0 -translate-x-8") : "opacity-100 translate-x-0"}`}>
        {/* Icon area */}
        <div className="mb-8 flex justify-center">
          {isFirst && slide.platformIcons ? (
            <div className="relative">
              {/* Thmanyah logo center */}
              <div className="w-20 h-20 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center mx-auto mb-4">
                <img src="/Usable/thamanyah.png" alt="ثمانية" className="w-12 h-12" style={{ imageRendering: "-webkit-optimize-contrast" }} />
              </div>
              {/* Platform icons row */}
              <div className="flex items-center justify-center gap-3">
                {slide.platformIcons.map((p, i) => (
                  <div
                    key={i}
                    className="w-11 h-11 rounded-xl flex items-center justify-center animate-float"
                    style={{ backgroundColor: `${p.color}15`, border: `1px solid ${p.color}25`, color: p.color, animationDelay: `${i * 0.2}s` }}
                  >
                    {p.svg}
                  </div>
                ))}
              </div>
            </div>
          ) : Icon ? (
            <div className="relative">
              {/* Glow */}
              <div className="absolute inset-0 w-24 h-24 rounded-2xl blur-2xl opacity-20 mx-auto" style={{ backgroundColor: slide.color }} />
              <div
                className="relative w-24 h-24 rounded-2xl flex items-center justify-center mx-auto border animate-float"
                style={{ backgroundColor: `${slide.color}12`, borderColor: `${slide.color}25`, color: slide.color }}
              >
                <Icon className="w-10 h-10" strokeWidth={1.5} />
              </div>
            </div>
          ) : null}
        </div>

        {/* Text */}
        {isFirst && (
          <p className="text-[12px] font-bold text-thmanyah-green/60 tracking-[0.2em] uppercase mb-3">{slide.subtitle}</p>
        )}
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-white/90 mb-3 leading-tight">
          {slide.title}
        </h2>
        {!isFirst && (
          <p className="text-[13px] font-bold mb-4 tracking-wide" style={{ color: `${slide.color}90` }}>
            {slide.subtitle}
          </p>
        )}
        <p className="text-[14px] font-bold text-white/35 leading-relaxed max-w-md mx-auto">
          {slide.description}
        </p>
      </div>

      {/* Navigation */}
      <div className="absolute bottom-10 left-0 right-0 z-10 flex flex-col items-center gap-6">
        {/* Dots */}
        <div className="flex items-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-300 ${
                i === currentSlide
                  ? "w-8 h-2"
                  : "w-2 h-2 hover:bg-white/30"
              }`}
              style={{ backgroundColor: i === currentSlide ? slide.color : "rgba(255,255,255,0.1)" }}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          {!isFirst && (
            <button
              onClick={prev}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/50 text-[13px] font-bold hover:text-white/80 hover:bg-white/[0.1] transition-all"
            >
              <ChevronRight className="w-4 h-4" />
              السابق
            </button>
          )}
          <button
            onClick={next}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-white text-[13px] font-bold transition-all hover:brightness-110"
            style={{ backgroundColor: slide.color }}
          >
            {isLast ? "ابدأ الآن" : "التالي"}
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

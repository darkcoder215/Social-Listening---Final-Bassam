import { useNavigate } from "react-router-dom";
import { Compass, Brain, FileBarChart, Settings, ArrowLeft } from "lucide-react";
import SpaceHero from "@/components/SpaceHero";

const SECTIONS = [
  {
    labelAr: "استكشاف البيانات",
    description: "تصفح وحلل التعليقات والتفاعل عبر TikTok وInstagram وYouTube",
    icon: Compass,
    path: "/explore",
    color: "#00C17A",
    bgClass: "from-[#00C17A]/[0.06] to-[#00C17A]/[0.02]",
  },
  {
    labelAr: "التحليل الذكي",
    description: "تحليل شامل بالذكاء الاصطناعي للمشاعر والمواضيع والتوصيات",
    icon: Brain,
    path: "/ai-analyses",
    color: "#8B5CF6",
    bgClass: "from-purple-500/[0.06] to-purple-500/[0.02]",
  },
  {
    labelAr: "التقارير",
    description: "عرض وتحليل تقارير الرصد الاجتماعي من Meltwater",
    icon: FileBarChart,
    path: "/reports",
    color: "#ff0050",
    bgClass: "from-[#ff0050]/[0.06] to-[#ff0050]/[0.02]",
  },
  {
    labelAr: "الإعدادات",
    description: "إدارة الحسابات والمفاتيح والتفضيلات",
    icon: Settings,
    path: "/settings",
    color: "#0072F9",
    bgClass: "from-[#0072F9]/[0.06] to-[#0072F9]/[0.02]",
  },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* Logo header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="relative">
            <div className="absolute inset-0 bg-thmanyah-green/15 rounded-xl blur-md" />
            <div className="relative w-12 h-12 bg-card rounded-xl border border-border flex items-center justify-center">
              <img src="/Usable/thamanyah.png" alt="ثمانية" className="w-7 h-7 dark:invert-0 invert" style={{ imageRendering: "-webkit-optimize-contrast" }} />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground/90">منصة الرصد الاجتماعي</h1>
            <p className="text-[11px] font-bold text-muted-foreground/40">ثمانية — الإصدار 3.0</p>
          </div>
        </div>

        {/* Hero */}
        <SpaceHero />

        {/* Section Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {SECTIONS.map((section, i) => {
            const Icon = section.icon;
            return (
              <button
                key={section.path}
                onClick={() => navigate(section.path)}
                className={`card-stagger card-hover-lift group w-full text-right rounded-2xl bg-gradient-to-bl ${section.bgClass} border border-border/40 p-6 transition-all duration-300 hover:border-border hover:shadow-md`}
                style={{ animationDelay: `${0.1 + i * 0.08}s` }}
              >
                <div className="flex flex-col gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
                    style={{ backgroundColor: `${section.color}12`, color: section.color }}
                  >
                    <Icon className="w-6 h-6" strokeWidth={1.8} />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-bold text-foreground/85 group-hover:text-foreground transition-colors mb-1.5">
                      {section.labelAr}
                    </h3>
                    <p className="text-[12px] font-bold text-muted-foreground/50 leading-relaxed">
                      {section.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors">
                    <span>دخول</span>
                    <ArrowLeft className="w-3 h-3 transition-transform duration-300 group-hover:-translate-x-1" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import { useLocation, useNavigate } from "react-router-dom";
import {
  Compass,
  FileBarChart,
  Brain,
  Settings,
  ChevronDown,
  Home,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { TikTokIcon, InstagramIcon, YouTubeIcon, XIcon } from "@/components/icons/PlatformIcons";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function AppSidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [expandedSections, setExpandedSections] = useState<string[]>(["استكشاف البيانات"]);

  const toggleSection = (label: string) => {
    setExpandedSections((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const isActive = (path: string) => {
    if (path === "/explore") return location.pathname === "/explore";
    return location.pathname.startsWith(path);
  };

  const aiActive = isActive("/ai-analyses");
  const reportsActive = isActive("/reports");
  const settingsActive = isActive("/settings");
  const exploreActive = ["/explore", "/explore/tiktok", "/explore/instagram", "/explore/youtube", "/explore/x"].some(
    (p) => isActive(p)
  );

  /* ── Collapsed sidebar ── */
  if (collapsed) {
    return (
      <aside className="w-[52px] min-h-screen bg-sidebar flex flex-col items-center py-4 border-l border-sidebar-border">
        <button onClick={onToggle} className="p-2 rounded-lg hover:bg-sidebar-accent mb-4">
          <PanelLeftOpen className="w-4 h-4 text-sidebar-muted" />
        </button>
        <div className="flex-1 flex flex-col items-center gap-2 pt-2">
          <button
            onClick={() => navigate("/explore")}
            className={cn("p-2.5 rounded-xl transition-colors", exploreActive ? "bg-thmanyah-green/10" : "hover:bg-sidebar-accent")}
            title="استكشاف البيانات"
          >
            <Compass className={cn("w-[18px] h-[18px]", exploreActive ? "text-thmanyah-green" : "text-sidebar-muted")} />
          </button>

          {/* AI Analysis — distinct purple icon */}
          <button
            onClick={() => navigate("/ai-analyses")}
            className={cn("p-2.5 rounded-xl transition-colors", aiActive ? "bg-[#8B5CF6]/15" : "hover:bg-sidebar-accent")}
            title="التحليل الذكي"
          >
            <Brain className={cn("w-[18px] h-[18px]", aiActive ? "text-[#8B5CF6]" : "text-sidebar-muted")} />
          </button>

          <button
            onClick={() => navigate("/reports")}
            className={cn("p-2.5 rounded-xl transition-colors", reportsActive ? "bg-[#ff0050]/10" : "hover:bg-sidebar-accent")}
            title="تقارير Meltwater"
          >
            <FileBarChart className={cn("w-[18px] h-[18px]", reportsActive ? "text-[#ff0050]" : "text-sidebar-muted")} />
          </button>

          <button
            onClick={() => navigate("/settings")}
            className={cn("p-2.5 rounded-xl transition-colors", settingsActive ? "bg-thmanyah-green/10" : "hover:bg-sidebar-accent")}
            title="الإعدادات"
          >
            <Settings className={cn("w-[18px] h-[18px]", settingsActive ? "text-thmanyah-green" : "text-sidebar-muted")} />
          </button>
        </div>
      </aside>
    );
  }

  /* ── Expanded sidebar ── */
  return (
    <aside className="w-[260px] min-h-screen bg-sidebar text-sidebar-foreground flex flex-col border-l border-sidebar-border custom-scrollbar">
      {/* Header */}
      <div className="p-5 pb-3 flex items-center gap-3">
        <button onClick={() => navigate("/")} className="relative group" title="الرئيسية">
          <div className="absolute inset-0 bg-thmanyah-green/15 rounded-xl blur-md" />
          <div className="relative w-10 h-10 bg-sidebar-accent rounded-xl border border-sidebar-border flex items-center justify-center group-hover:bg-sidebar-accent/80 transition-colors">
            <img src="/Usable/thamanyah.png" alt="ثمانية" className="w-6 h-6 dark:invert-0 invert" style={{ imageRendering: "-webkit-optimize-contrast" }} />
          </div>
        </button>
        <div className="flex-1">
          <h2 className="text-sm font-bold text-sidebar-foreground/90 leading-tight">ثمانية</h2>
          <p className="text-[10px] font-bold text-sidebar-muted tracking-wide">الرصد الاجتماعي</p>
        </div>
        <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors">
          <PanelLeftClose className="w-4 h-4 text-sidebar-muted" />
        </button>
      </div>

      {/* Back to home */}
      <button
        onClick={() => navigate("/")}
        className="mx-4 mb-2 flex items-center gap-2 px-3 py-2 rounded-lg text-sidebar-muted hover:text-sidebar-foreground/80 hover:bg-sidebar-accent transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
        <span className="text-[11px] font-bold">الرئيسية</span>
      </button>

      <div className="mx-4 h-px bg-sidebar-border mb-2" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto custom-scrollbar">

        {/* ── Section: Data Exploration ── */}
        <p className="px-3 pt-2 pb-1 text-[10px] font-bold text-sidebar-muted/50 uppercase tracking-wider">البيانات</p>

        <div>
          <button
            onClick={() => toggleSection("استكشاف البيانات")}
            className={cn(
              "sidebar-nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-right relative group",
              exploreActive ? "bg-thmanyah-green/10 text-sidebar-foreground" : "text-sidebar-muted hover:text-sidebar-foreground/80 hover:bg-sidebar-accent"
            )}
          >
            <Compass className={cn("w-[18px] h-[18px] flex-shrink-0", exploreActive ? "text-thmanyah-green" : "text-sidebar-muted group-hover:text-sidebar-foreground/60")} strokeWidth={1.8} />
            <span className="flex-1 text-[13px] font-bold">استكشاف البيانات</span>
            <ChevronDown className={cn("w-3.5 h-3.5 text-sidebar-muted transition-transform duration-200", expandedSections.includes("استكشاف البيانات") && "rotate-180")} />
          </button>

          <div className={cn("overflow-hidden transition-all duration-300 ease-out", expandedSections.includes("استكشاف البيانات") ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0")}>
            <div className="mr-5 pr-3 border-r border-sidebar-border mt-0.5 mb-1 space-y-0.5">
              {[
                { labelAr: "نظرة عامة", path: "/explore", icon: Compass },
                { labelAr: "TikTok", path: "/explore/tiktok", icon: TikTokIcon },
                { labelAr: "Instagram", path: "/explore/instagram", icon: InstagramIcon },
                { labelAr: "YouTube", path: "/explore/youtube", icon: YouTubeIcon },
                { labelAr: "X", path: "/explore/x", icon: XIcon },
              ].map((child) => {
                const ChildIcon = child.icon;
                const childActive = isActive(child.path);
                return (
                  <button
                    key={child.path}
                    onClick={() => navigate(child.path)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-right transition-all duration-200",
                      childActive
                        ? "bg-thmanyah-green/10 text-thmanyah-green"
                        : "text-sidebar-muted hover:text-sidebar-foreground/70 hover:bg-sidebar-accent"
                    )}
                  >
                    {ChildIcon && <ChildIcon className="w-4 h-4 flex-shrink-0" />}
                    <span className="text-[12px] font-bold">{child.labelAr}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Section: Analysis ── */}
        <div className="mx-1 h-px bg-sidebar-border my-2" />
        <p className="px-3 pt-1 pb-1 text-[10px] font-bold text-sidebar-muted/50 uppercase tracking-wider">التحليلات</p>

        {/* AI Analysis — visually distinct with purple accent */}
        <button
          onClick={() => navigate("/ai-analyses")}
          className={cn(
            "sidebar-nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-right relative group",
            aiActive
              ? "bg-[#8B5CF6]/15 text-sidebar-foreground"
              : "text-sidebar-muted hover:text-sidebar-foreground/80 hover:bg-sidebar-accent"
          )}
        >
          {aiActive && <span className="sidebar-active-indicator" style={{ backgroundColor: "#8B5CF6" }} />}
          <div className={cn(
            "w-[18px] h-[18px] flex-shrink-0 flex items-center justify-center",
          )}>
            <Brain className={cn("w-[18px] h-[18px]", aiActive ? "text-[#8B5CF6]" : "text-sidebar-muted group-hover:text-sidebar-foreground/60")} strokeWidth={1.8} />
          </div>
          <span className="flex-1 text-[13px] font-bold">التحليل الذكي</span>
          <Sparkles className={cn("w-3 h-3", aiActive ? "text-[#8B5CF6]" : "text-sidebar-muted/40")} />
        </button>

        {/* Meltwater Reports — visually distinct with red/pink accent */}
        <button
          onClick={() => navigate("/reports")}
          className={cn(
            "sidebar-nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-right relative group",
            reportsActive
              ? "bg-[#ff0050]/10 text-sidebar-foreground"
              : "text-sidebar-muted hover:text-sidebar-foreground/80 hover:bg-sidebar-accent"
          )}
        >
          {reportsActive && <span className="sidebar-active-indicator" style={{ backgroundColor: "#ff0050" }} />}
          <FileBarChart className={cn("w-[18px] h-[18px] flex-shrink-0", reportsActive ? "text-[#ff0050]" : "text-sidebar-muted group-hover:text-sidebar-foreground/60")} strokeWidth={1.8} />
          <span className="flex-1 text-[13px] font-bold">تقارير Meltwater</span>
        </button>

        {/* ── Section: Settings ── */}
        <div className="mx-1 h-px bg-sidebar-border my-2" />
        <p className="px-3 pt-1 pb-1 text-[10px] font-bold text-sidebar-muted/50 uppercase tracking-wider">النظام</p>

        <button
          onClick={() => navigate("/settings")}
          className={cn(
            "sidebar-nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-right relative group",
            settingsActive
              ? "bg-thmanyah-green/10 text-sidebar-foreground"
              : "text-sidebar-muted hover:text-sidebar-foreground/80 hover:bg-sidebar-accent"
          )}
        >
          {settingsActive && <span className="sidebar-active-indicator" />}
          <Settings className={cn("w-[18px] h-[18px] flex-shrink-0", settingsActive ? "text-thmanyah-green" : "text-sidebar-muted group-hover:text-sidebar-foreground/60")} strokeWidth={1.8} />
          <span className="flex-1 text-[13px] font-bold">الإعدادات</span>
        </button>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border space-y-3">
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sidebar-muted hover:text-sidebar-foreground/80 hover:bg-sidebar-accent transition-colors"
        >
          {theme === "dark" ? (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          )}
          <span className="text-[11px] font-bold">{theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن"}</span>
        </button>

        <div className="flex items-center gap-2 px-2">
          <div className="w-2 h-2 rounded-full bg-thmanyah-green pulse-ring text-thmanyah-green" />
          <span className="text-[11px] font-bold text-sidebar-muted">متصل</span>
        </div>
      </div>
    </aside>
  );
}

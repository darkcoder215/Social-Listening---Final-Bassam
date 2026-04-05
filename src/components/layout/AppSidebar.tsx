import { useLocation, useNavigate } from "react-router-dom";
import {
  Compass,
  FileBarChart,
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

interface NavItem {
  labelAr: string;
  icon: React.ElementType;
  path?: string;
  children?: { labelAr: string; path: string; icon?: React.ElementType }[];
}

const NAV_ITEMS: NavItem[] = [
  {
    labelAr: "استكشاف البيانات",
    icon: Compass,
    children: [
      { labelAr: "نظرة عامة", path: "/explore", icon: Compass },
      { labelAr: "TikTok", path: "/explore/tiktok", icon: TikTokIcon },
      { labelAr: "Instagram", path: "/explore/instagram", icon: InstagramIcon },
      { labelAr: "YouTube", path: "/explore/youtube", icon: YouTubeIcon },
      { labelAr: "X", path: "/explore/x", icon: XIcon },
    ],
  },
  {
    labelAr: "التحليل بالذكاء الاصطناعي",
    icon: Sparkles,
    path: "/ai-analysis",
  },
  {
    labelAr: "تقارير Meltwater",
    icon: FileBarChart,
    path: "/reports",
  },
  {
    labelAr: "الإعدادات",
    icon: Settings,
    path: "/settings",
  },
];

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

  const isParentActive = (item: NavItem) => {
    if (item.path && isActive(item.path)) return true;
    return item.children?.some((child) => isActive(child.path)) ?? false;
  };

  if (collapsed) {
    return (
      <aside className="w-[52px] min-h-screen bg-sidebar flex flex-col items-center py-4 border-l border-sidebar-border">
        <button onClick={onToggle} className="p-2 rounded-lg hover:bg-sidebar-accent mb-4">
          <PanelLeftOpen className="w-4 h-4 text-sidebar-muted" />
        </button>
        <div className="flex-1 flex flex-col items-center gap-2 pt-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isParentActive(item);
            return (
              <button
                key={item.labelAr}
                onClick={() => {
                  if (item.path) navigate(item.path);
                  else if (item.children) navigate(item.children[0].path);
                }}
                className={cn(
                  "p-2.5 rounded-xl transition-colors",
                  active ? "bg-thmanyah-green/10" : "hover:bg-sidebar-accent"
                )}
                title={item.labelAr}
              >
                <Icon className={cn("w-[18px] h-[18px]", active ? "text-thmanyah-green" : "text-sidebar-muted")} />
              </button>
            );
          })}
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-[260px] min-h-screen bg-sidebar text-sidebar-foreground flex flex-col border-l border-sidebar-border custom-scrollbar">
      {/* Header */}
      <div className="p-5 pb-3 flex items-center gap-3">
        <button
          onClick={() => navigate("/")}
          className="relative group"
          title="الرئيسية"
        >
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
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto custom-scrollbar">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const hasChildren = !!item.children?.length;
          const isExpanded = expandedSections.includes(item.labelAr);
          const active = isParentActive(item);

          return (
            <div key={item.labelAr}>
              <button
                onClick={() => {
                  if (hasChildren) {
                    toggleSection(item.labelAr);
                  } else if (item.path) {
                    navigate(item.path);
                  }
                }}
                className={cn(
                  "sidebar-nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-right relative group",
                  active ? "bg-thmanyah-green/10 text-sidebar-foreground" : "text-sidebar-muted hover:text-sidebar-foreground/80 hover:bg-sidebar-accent"
                )}
              >
                {active && !hasChildren && <span className="sidebar-active-indicator" />}
                <Icon className={cn("w-[18px] h-[18px] flex-shrink-0", active ? "text-thmanyah-green" : "text-sidebar-muted group-hover:text-sidebar-foreground/60")} strokeWidth={1.8} />
                <span className="flex-1 text-[13px] font-bold">{item.labelAr}</span>
                {hasChildren && (
                  <ChevronDown className={cn("w-3.5 h-3.5 text-sidebar-muted transition-transform duration-200", isExpanded && "rotate-180")} />
                )}
              </button>

              {hasChildren && (
                <div className={cn("overflow-hidden transition-all duration-300 ease-out", isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0")}>
                  <div className="mr-5 pr-3 border-r border-sidebar-border mt-0.5 mb-1 space-y-0.5">
                    {item.children!.map((child) => {
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
              )}
            </div>
          );
        })}
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

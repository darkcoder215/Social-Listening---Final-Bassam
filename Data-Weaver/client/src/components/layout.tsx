import { Link, useLocation } from "wouter";
import { LayoutDashboard, Search, Settings, BarChart3, Moon, Sun, Eye, Shield } from "lucide-react";
import { SiX, SiTiktok, SiInstagram, SiYoutube } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [isDark, setIsDark] = useState(false);

  const { data: safeMode } = useQuery<{ enabled: boolean }>({
    queryKey: ["/api/safe-mode"],
  });

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
  };

  const platformTabs = [
    { path: "/", label: "نظرة عامة", icon: Eye },
    { path: "/x", label: "X", icon: SiX },
    { path: "/tiktok", label: "تيك توك", icon: SiTiktok },
    { path: "/instagram", label: "انستقرام", icon: SiInstagram },
    { path: "/youtube", label: "يوتيوب", icon: SiYoutube },
  ];

  const xSubNav = [
    { path: "/x", label: "لوحة التحكم", icon: LayoutDashboard },
    { path: "/x/explore", label: "استعراض البيانات", icon: Search },
    { path: "/x/admin", label: "الإدارة", icon: Settings, isAdmin: true },
  ];

  const isXSection = location.startsWith("/x") && !location.startsWith("/youtube");
  const isTikTokSection = location.startsWith("/tiktok");
  const isInstagramSection = location.startsWith("/instagram");
  const isYouTubeSection = location.startsWith("/youtube");
  const isOverview = location === "/" || location === "/overview";

  const getActivePlatform = () => {
    if (isXSection) return "/x";
    if (isTikTokSection) return "/tiktok";
    if (isInstagramSection) return "/instagram";
    if (isYouTubeSection) return "/youtube";
    return "/";
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">مرئيات جمهور «ثمانية»</span>
            </div>

            <nav className="flex items-center gap-1">
              {platformTabs.map((tab) => {
                const isActive = getActivePlatform() === tab.path;
                return (
                  <Link key={tab.path} href={tab.path}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      className="gap-2"
                      data-testid={`nav-platform-${tab.path.replace("/", "") || "overview"}`}
                    >
                      <tab.icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              {safeMode?.enabled && (
                <Badge variant="outline" className="gap-1 text-xs border-primary text-primary" data-testid="badge-safe-mode">
                  <Shield className="h-3 w-3" />
                  <span className="hidden sm:inline">الوضع الآمن</span>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                data-testid="button-theme-toggle"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        {isXSection && (
          <div className="border-t bg-muted/30">
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
              <nav className="flex items-center gap-1 h-10">
                {xSubNav.map((item) => {
                  const isActive = location === item.path;
                  return (
                    <Link key={item.path} href={item.path}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`gap-2 h-8 text-xs ${isActive ? "bg-accent" : ""}`}
                        data-testid={`nav-x-${item.path.replace("/x/", "").replace("/x", "dashboard")}`}
                      >
                        <item.icon className="h-3.5 w-3.5" />
                        <span>{item.label}</span>
                        {item.isAdmin && (
                          <Badge variant="secondary" className="text-[10px] px-1 py-0">
                            إدارة
                          </Badge>
                        )}
                      </Button>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}

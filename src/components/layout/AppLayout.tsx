import { Outlet, useLocation, useNavigate } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import { useEffect, useState } from "react";
import { DateRangeProvider } from "@/contexts/DateRangeContext";
import { Brain } from "lucide-react";

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [pageKey, setPageKey] = useState(location.pathname);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    setPageKey(location.pathname);
  }, [location.pathname]);

  const showAiFab = location.pathname !== "/ai-analyses";

  return (
    <DateRangeProvider>
      <div className="flex min-h-screen bg-background" dir="rtl">
        <AppSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <main className="flex-1 min-h-screen overflow-x-hidden">
          <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/50">
            <div className="flex items-center justify-between px-8 py-4">
              <PageTitle />
              <div className="text-[11px] font-bold text-muted-foreground/40 tracking-wide">الإصدار 3.0</div>
            </div>
          </header>
          <div key={pageKey} className="page-enter px-8 py-6">
            <Outlet />
          </div>
        </main>

        {/* Floating AI Analysis button — right side of screen */}
        {showAiFab && (
          <button
            onClick={() => navigate("/ai-analyses")}
            className="fixed right-6 bottom-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#8B5CF6] text-white shadow-lg shadow-[#8B5CF6]/25 hover:brightness-110 hover:scale-105 transition-all duration-200 group"
            title="التحليل الذكي"
          >
            <Brain className="w-5 h-5" strokeWidth={1.8} />
            <span className="text-[13px] font-bold">التحليل الذكي</span>
          </button>
        )}
      </div>
    </DateRangeProvider>
  );
}

function PageTitle() {
  const location = useLocation();
  const path = location.pathname;

  const titles: Record<string, string> = {
    "/explore": "نظرة عامة",
    "/explore/tiktok": "TikTok",
    "/explore/instagram": "Instagram",
    "/explore/youtube": "YouTube",
    "/explore/x": "X",
    "/ai-analyses": "التحليل الذكي — AI",
    "/reports": "تقارير Meltwater",
    "/settings": "الإعدادات",
  };

  return (
    <h1 className="text-lg font-display font-bold text-foreground/90">
      {titles[path] || "الصفحة"}
    </h1>
  );
}

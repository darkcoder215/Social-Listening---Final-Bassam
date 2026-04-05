import { Outlet, useLocation, useNavigate } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import { useEffect, useState } from "react";
import { DateRangeProvider } from "@/contexts/DateRangeContext";
import { Sparkles } from "lucide-react";

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [pageKey, setPageKey] = useState(location.pathname);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    setPageKey(location.pathname);
  }, [location.pathname]);

  const isReportsPage = location.pathname === "/reports";

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

        {/* Floating AI Analysis button — hidden on the reports page itself */}
        {!isReportsPage && (
          <button
            onClick={() => navigate("/reports")}
            className="fixed left-6 bottom-6 z-50 flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-l from-amber-500 to-amber-600 text-white font-bold text-[13px] shadow-xl shadow-amber-500/25 hover:shadow-2xl hover:shadow-amber-500/30 hover:scale-105 transition-all duration-300 group"
            title="التحليل بالذكاء الاصطناعي"
          >
            <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
            <span>التحليل بالذكاء الاصطناعي</span>
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
    "/reports": "التحليل بالذكاء الاصطناعي",
    "/settings": "الإعدادات",
  };

  return (
    <h1 className="text-lg font-display font-bold text-foreground/90">
      {titles[path] || "الصفحة"}
    </h1>
  );
}

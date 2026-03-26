import { useState, useCallback } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import SplashIntro from "@/components/SplashIntro";
import Onboarding from "@/components/Onboarding";
import Home from "./pages/Home";
import Overview from "./pages/explore/Overview";
import TikTokPage from "./pages/explore/TikTokPage";
import InstagramPage from "./pages/explore/InstagramPage";
import YouTubePage from "./pages/explore/YouTubePage";
import XPage from "./pages/explore/XPage";
import MeltwaterReport from "./pages/MeltwaterReport";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ONBOARDING_KEY = "thmanyah-onboarding-seen";

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem(ONBOARDING_KEY)
  );

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setShowOnboarding(false);
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="thmanyah-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {showSplash && <SplashIntro onComplete={handleSplashComplete} />}
        {!showSplash && showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
        <BrowserRouter>
          <Routes>
            {/* Home — no sidebar */}
            <Route path="/" element={<Home />} />

            {/* All section pages — with sidebar */}
            <Route element={<AppLayout />}>
              <Route path="/explore" element={<Overview />} />
              <Route path="/explore/tiktok" element={<TikTokPage />} />
              <Route path="/explore/instagram" element={<InstagramPage />} />
              <Route path="/explore/youtube" element={<YouTubePage />} />
              <Route path="/explore/x" element={<XPage />} />
              <Route path="/reports" element={<MeltwaterReport />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;

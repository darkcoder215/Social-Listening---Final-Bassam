import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mb-6">
          <img src="/Usable/thamanyah.png" alt="Thmanyah" className="h-12 w-12 mx-auto opacity-40" />
        </div>
        <h1 className="mb-4 text-6xl font-display font-black text-foreground">404</h1>
        <p className="mb-6 text-xl font-bold text-muted-foreground">الصفحة غير موجودة</p>
        <a
          href="/"
          className="inline-block px-8 py-3 bg-foreground text-primary-foreground font-bold rounded-full hover:bg-foreground/90 transition-colors"
        >
          العودة للرئيسية
        </a>
      </div>
    </div>
  );
};

export default NotFound;

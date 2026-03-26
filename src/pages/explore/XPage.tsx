import { Clock } from "lucide-react";

export default function XPage() {
  return (
    <div className="max-w-2xl mx-auto text-center py-20">
      <div className="w-16 h-16 rounded-2xl bg-muted/10 border border-border/40 flex items-center justify-center mx-auto mb-5">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-muted-foreground/30">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </div>
      <h2 className="text-xl font-display font-bold text-foreground/70 mb-2">
        قريباً
      </h2>
      <p className="text-[13px] font-bold text-muted-foreground/40 leading-relaxed mb-6">
        صفحة رصد X / تويتر قيد التطوير وستكون متاحة قريباً
      </p>
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/5 border border-border/30">
        <Clock className="w-4 h-4 text-muted-foreground/30" />
        <span className="text-[12px] font-bold text-muted-foreground/40">قيد التطوير</span>
      </div>
    </div>
  );
}

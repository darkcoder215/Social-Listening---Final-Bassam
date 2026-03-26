import { useState, useRef, useEffect } from "react";
import { CalendarDays } from "lucide-react";
import { useDateRange, type DatePreset } from "@/contexts/DateRangeContext";
import { Calendar } from "@/components/ui/calendar";

const PRESETS: { key: DatePreset; label: string }[] = [
  { key: "7d", label: "٧ أيام" },
  { key: "30d", label: "٣٠ يوم" },
  { key: "90d", label: "٩٠ يوم" },
  { key: "custom", label: "مخصص" },
];

function toArabicDate(iso: string): string {
  try {
    const d = new Date(iso);
    const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    return `${day} ${month} ${h}:${m}`;
  } catch {
    return "";
  }
}

function pad2(n: number) { return String(n).padStart(2, "0"); }

export default function DateRangeFilter() {
  const { dateRange, setPreset, setCustomRange } = useDateRange();
  const [showCustom, setShowCustom] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const [fromDate, setFromDate] = useState<Date | undefined>(() => new Date(dateRange.from));
  const [toDate, setToDate] = useState<Date | undefined>(() => new Date(dateRange.to));
  const [fromHour, setFromHour] = useState("00");
  const [fromMinute, setFromMinute] = useState("00");
  const [toHour, setToHour] = useState("23");
  const [toMinute, setToMinute] = useState("59");

  // Close panel on outside click
  useEffect(() => {
    if (!showCustom) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowCustom(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showCustom]);

  const handleApply = () => {
    if (!fromDate || !toDate) return;
    const fromISO = `${fromDate.getFullYear()}-${pad2(fromDate.getMonth() + 1)}-${pad2(fromDate.getDate())}T${fromHour}:${fromMinute}:00.000Z`;
    const toISO = `${toDate.getFullYear()}-${pad2(toDate.getMonth() + 1)}-${pad2(toDate.getDate())}T${toHour}:${toMinute}:59.999Z`;
    setCustomRange(fromISO, toISO);
    setShowCustom(false);
  };

  return (
    <div className="relative" ref={panelRef}>
      <div className="flex flex-wrap items-center gap-2">
        <CalendarDays className="w-4 h-4 text-muted-foreground/40" />
        <span className="text-[12px] font-bold text-muted-foreground/50">الفترة:</span>
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => {
              if (p.key === "custom") {
                setShowCustom(!showCustom);
              } else {
                setShowCustom(false);
                setPreset(p.key);
              }
            }}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
              (p.key === "custom" ? showCustom || dateRange.preset === "custom" : dateRange.preset === p.key)
                ? "bg-thmanyah-green text-white"
                : "bg-card border border-border/50 text-muted-foreground/60 hover:text-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}

        {/* Show active custom range as badge */}
        {dateRange.preset === "custom" && !showCustom && (
          <span className="px-2.5 py-1 rounded-lg bg-thmanyah-green/10 text-thmanyah-green text-[10px] font-bold">
            {toArabicDate(dateRange.from)} — {toArabicDate(dateRange.to)}
          </span>
        )}
      </div>

      {/* Custom Range Panel — slide down */}
      {showCustom && (
        <div className="absolute top-full right-0 mt-2 z-50 bg-card rounded-2xl border border-border/60 shadow-2xl p-5 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex gap-6" dir="rtl">
            {/* From */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-muted-foreground/60 block">من</span>
              <Calendar
                mode="single"
                selected={fromDate}
                onSelect={setFromDate}
                className="rounded-xl border border-border/30 bg-background"
              />
              <div className="flex items-center gap-2 justify-center">
                <select
                  value={fromHour}
                  onChange={(e) => setFromHour(e.target.value)}
                  className="px-2 py-1.5 rounded-lg border border-border/40 bg-background text-[11px] font-bold text-foreground/80 focus:outline-none focus:ring-1 focus:ring-thmanyah-green/30"
                  dir="ltr"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={pad2(i)}>{pad2(i)}</option>
                  ))}
                </select>
                <span className="text-muted-foreground/40 font-bold">:</span>
                <select
                  value={fromMinute}
                  onChange={(e) => setFromMinute(e.target.value)}
                  className="px-2 py-1.5 rounded-lg border border-border/40 bg-background text-[11px] font-bold text-foreground/80 focus:outline-none focus:ring-1 focus:ring-thmanyah-green/30"
                  dir="ltr"
                >
                  {[0, 15, 30, 45].map((m) => (
                    <option key={m} value={pad2(m)}>{pad2(m)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center">
              <div className="w-px h-full bg-border/30" />
            </div>

            {/* To */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-muted-foreground/60 block">إلى</span>
              <Calendar
                mode="single"
                selected={toDate}
                onSelect={setToDate}
                className="rounded-xl border border-border/30 bg-background"
              />
              <div className="flex items-center gap-2 justify-center">
                <select
                  value={toHour}
                  onChange={(e) => setToHour(e.target.value)}
                  className="px-2 py-1.5 rounded-lg border border-border/40 bg-background text-[11px] font-bold text-foreground/80 focus:outline-none focus:ring-1 focus:ring-thmanyah-green/30"
                  dir="ltr"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={pad2(i)}>{pad2(i)}</option>
                  ))}
                </select>
                <span className="text-muted-foreground/40 font-bold">:</span>
                <select
                  value={toMinute}
                  onChange={(e) => setToMinute(e.target.value)}
                  className="px-2 py-1.5 rounded-lg border border-border/40 bg-background text-[11px] font-bold text-foreground/80 focus:outline-none focus:ring-1 focus:ring-thmanyah-green/30"
                  dir="ltr"
                >
                  {[0, 15, 30, 45].map((m) => (
                    <option key={m} value={pad2(m)}>{pad2(m)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Apply button */}
          <div className="flex justify-end mt-4 pt-3 border-t border-border/30">
            <button
              onClick={handleApply}
              disabled={!fromDate || !toDate}
              className="px-5 py-2 rounded-xl bg-thmanyah-green text-white text-[12px] font-bold hover:bg-thmanyah-green/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              تطبيق
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type DatePreset = "7d" | "30d" | "90d" | "custom";

export interface DateRange {
  from: string; // ISO string
  to: string;   // ISO string
  preset: DatePreset;
}

interface DateRangeContextType {
  dateRange: DateRange;
  setPreset: (preset: DatePreset) => void;
  setCustomRange: (from: string, to: string) => void;
}

function makeRange(preset: DatePreset, from?: string, to?: string): DateRange {
  const now = new Date();
  const end = now.toISOString();
  if (preset === "custom" && from && to) {
    return { from, to, preset: "custom" };
  }
  const daysMap: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
  const d = new Date();
  d.setDate(d.getDate() - (daysMap[preset] || 7));
  return { from: d.toISOString(), to: end, preset };
}

const DateRangeContext = createContext<DateRangeContextType | null>(null);

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [dateRange, setDateRange] = useState<DateRange>(() => makeRange("7d"));

  const setPreset = useCallback((preset: DatePreset) => {
    setDateRange(makeRange(preset));
  }, []);

  const setCustomRange = useCallback((from: string, to: string) => {
    setDateRange({ from, to, preset: "custom" });
  }, []);

  return (
    <DateRangeContext.Provider value={{ dateRange, setPreset, setCustomRange }}>
      {children}
    </DateRangeContext.Provider>
  );
}

export function useDateRange() {
  const ctx = useContext(DateRangeContext);
  if (!ctx) throw new Error("useDateRange must be used within DateRangeProvider");
  return ctx;
}

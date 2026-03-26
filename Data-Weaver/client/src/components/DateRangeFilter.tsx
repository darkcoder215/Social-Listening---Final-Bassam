import { useState, useMemo, createContext, useContext, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, RotateCcw } from "lucide-react";
import { format, subDays } from "date-fns";
import { ar } from "date-fns/locale";
import { DateRange } from "react-day-picker";

interface DateRangeFilterProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

export function getDefaultDateRange(): DateRange {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const from = subDays(today, 7);
  from.setHours(0, 0, 0, 0);
  return { from, to: today };
}

interface DateRangeContextValue {
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
}

const DateRangeContext = createContext<DateRangeContextValue | null>(null);

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(getDefaultDateRange());
  return (
    <DateRangeContext.Provider value={{ dateRange, setDateRange }}>
      {children}
    </DateRangeContext.Provider>
  );
}

export function useDateRange(): DateRangeContextValue {
  const context = useContext(DateRangeContext);
  if (!context) {
    throw new Error("useDateRange must be used within a DateRangeProvider");
  }
  return context;
}

export function DateRangeFilter({ dateRange, onDateRangeChange }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);

  const handleReset = () => {
    onDateRangeChange(getDefaultDateRange());
  };

  const displayText = useMemo(() => {
    if (!dateRange?.from) return "اختر الفترة";
    if (!dateRange.to) return format(dateRange.from, "d MMM yyyy", { locale: ar });
    return `${format(dateRange.from, "d MMM", { locale: ar })} - ${format(dateRange.to, "d MMM yyyy", { locale: ar })}`;
  }, [dateRange]);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="justify-start text-right gap-2"
            data-testid="button-date-range"
          >
            <CalendarIcon className="h-4 w-4" />
            <span>{displayText}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={(range) => {
              onDateRangeChange(range);
              if (range?.from && range?.to) {
                setOpen(false);
              }
            }}
            numberOfMonths={2}
            locale={ar}
            dir="rtl"
          />
        </PopoverContent>
      </Popover>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleReset}
        className="gap-1"
        data-testid="button-reset-date"
      >
        <RotateCcw className="h-3 w-3" />
        آخر ٧ أيام
      </Button>
    </div>
  );
}

export function isDateInRange(dateStr: string, dateRange: DateRange | undefined): boolean {
  if (!dateRange?.from || !dateStr) return true;
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return true;
    
    const from = new Date(dateRange.from);
    from.setHours(0, 0, 0, 0);
    
    const to = dateRange.to ? new Date(dateRange.to) : new Date();
    to.setHours(23, 59, 59, 999);
    
    return date >= from && date <= to;
  } catch {
    return true;
  }
}

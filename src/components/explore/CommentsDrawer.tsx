import { useState } from "react";
import { X, SortAsc, Loader2, MessageSquare, AlertTriangle, RefreshCw } from "lucide-react";
import type { EnrichedComment } from "@/lib/db-types";
import CommentCard from "./CommentCard";
import { fmtNum } from "@/lib/db-types";

export type DrawerSort = "newest" | "oldest" | "most_likes";

const SORT_OPTIONS: { key: DrawerSort; label: string }[] = [
  { key: "newest", label: "الأحدث" },
  { key: "oldest", label: "الأقدم" },
  { key: "most_likes", label: "الأكثر تفاعلاً" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  comments: EnrichedComment[];
  total: number;
  isLoading: boolean;
  hasMore?: boolean;
  isFetchingMore?: boolean;
  onLoadMore?: () => void;
  sort?: DrawerSort;
  onSortChange?: (s: DrawerSort) => void;
  filterDetails?: string;
  error?: Error | null;
  onRetry?: () => void;
}

export default function CommentsDrawer({
  open, onClose, title, comments, total, isLoading,
  hasMore, isFetchingMore, onLoadMore,
  sort = "newest", onSortChange,
  filterDetails, error, onRetry,
}: Props) {
  const [showSort, setShowSort] = useState(false);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed top-0 left-0 z-50 h-full w-[50%] max-w-[700px] min-w-[360px] bg-background border-l border-border shadow-2xl flex flex-col animate-slide-in-left">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <div className="flex-1 min-w-0">
            <h3 className="text-[14px] font-display font-bold text-foreground/85 truncate">{title}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              {!isLoading && (
                <span className="px-2 py-0.5 rounded-full bg-thmanyah-green text-white text-[10px] font-bold" dir="ltr">
                  {fmtNum(total)} تعليق
                </span>
              )}
              {filterDetails && (
                <span className="text-[10px] font-bold text-muted-foreground/30 truncate">{filterDetails}</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted/10 transition-colors shrink-0">
            <X className="w-4 h-4 text-muted-foreground/50" />
          </button>
        </div>

        {/* Sort */}
        {onSortChange && (
          <div className="px-5 py-2.5 border-b border-border/30">
            <div className="relative">
              <button
                onClick={() => setShowSort(!showSort)}
                className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground/50 hover:text-foreground transition-colors"
              >
                <SortAsc className="w-3 h-3" />
                {SORT_OPTIONS.find((s) => s.key === sort)?.label || "ترتيب"}
              </button>
              {showSort && (
                <div className="absolute top-7 right-0 z-20 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[120px]">
                  {SORT_OPTIONS.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => { onSortChange(s.key); setShowSort(false); }}
                      className={`w-full text-right px-3 py-1.5 text-[11px] font-bold transition-colors ${
                        sort === s.key ? "text-thmanyah-green bg-thmanyah-green/5" : "text-foreground/70 hover:bg-muted/5"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {error ? (
            <div className="text-center py-12 space-y-3">
              <AlertTriangle className="w-8 h-8 mx-auto text-thmanyah-red/50" />
              <p className="text-[12px] font-bold text-thmanyah-red/70">حدث خطأ — حاول مرة أخرى</p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border/40 text-[11px] font-bold text-muted-foreground/60 hover:text-foreground transition-all"
                >
                  <RefreshCw className="w-3 h-3" /> إعادة المحاولة
                </button>
              )}
            </div>
          ) : isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl bg-card border border-border/40 p-4 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-muted/20" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-24 bg-muted/20 rounded" />
                      <div className="h-3 w-full bg-muted/15 rounded" />
                      <div className="h-3 w-2/3 bg-muted/10 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground/15" />
              <p className="text-[12px] font-bold text-muted-foreground/40">لا توجد تعليقات مطابقة</p>
              {filterDetails && (
                <p className="text-[10px] font-bold text-muted-foreground/25">{filterDetails}</p>
              )}
            </div>
          ) : (
            <>
              {comments.map((c) => <CommentCard key={c.id} comment={c} />)}

              {hasMore && onLoadMore && (
                <button
                  onClick={onLoadMore}
                  disabled={isFetchingMore}
                  className="w-full py-3 rounded-xl border border-border/40 text-[12px] font-bold text-muted-foreground/50 hover:text-foreground hover:border-border transition-all flex items-center justify-center gap-2"
                >
                  {isFetchingMore ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> جاري التحميل...</>
                  ) : (
                    "عرض المزيد"
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

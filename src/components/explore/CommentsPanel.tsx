import { useState } from "react";
import { Search, SortAsc, MessageSquare, Loader2 } from "lucide-react";
import CommentCard from "./CommentCard";
import type { EnrichedComment } from "@/lib/db-types";
import { fmtNum } from "@/lib/db-types";

export type CommentSort = "newest" | "oldest" | "most_likes" | "most_replies";

const SORT_OPTIONS: { key: CommentSort; label: string }[] = [
  { key: "newest", label: "الأحدث" },
  { key: "oldest", label: "الأقدم" },
  { key: "most_likes", label: "الأكثر إعجاباً" },
  { key: "most_replies", label: "الأكثر ردوداً" },
];

const PAGE_SIZE = 10;

interface Props {
  comments: EnrichedComment[];
  total: number;
  isLoading: boolean;
  isFetchingMore: boolean;
  hasMore: boolean;
  search: string;
  onSearchChange: (v: string) => void;
  sort: CommentSort;
  onSortChange: (v: CommentSort) => void;
  onLoadMore: () => void;
}

export default function CommentsPanel({
  comments, total, isLoading, isFetchingMore,
  hasMore, search, onSearchChange, sort, onSortChange, onLoadMore,
}: Props) {
  const [showSort, setShowSort] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Show only visibleCount comments from the loaded list
  const visibleComments = comments.slice(0, visibleCount);
  const canShowMore = visibleCount < comments.length || hasMore;

  const handleShowMore = () => {
    if (visibleCount < comments.length) {
      // Show more from already-loaded comments
      setVisibleCount((prev) => prev + PAGE_SIZE);
    } else if (hasMore) {
      // Need to fetch more from server, then bump visible count
      setVisibleCount((prev) => prev + PAGE_SIZE);
      onLoadMore();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <MessageSquare className="w-4 h-4 text-muted-foreground/40" />
        <h3 className="text-[14px] font-display font-bold text-foreground/80">
          التعليقات
        </h3>
        <span className="px-2 py-0.5 rounded-full bg-thmanyah-green text-white text-[10px] font-bold" dir="ltr">
          {fmtNum(total)}
        </span>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/30" />
        <input
          type="text"
          value={search}
          onChange={(e) => { onSearchChange(e.target.value); setVisibleCount(PAGE_SIZE); }}
          placeholder="ابحث في التعليقات..."
          className="w-full py-2.5 pr-9 pl-3 rounded-lg bg-muted/5 border border-border/40 text-[12px] font-bold text-foreground/80 placeholder:text-muted-foreground/25 focus:outline-none focus:ring-1 focus:ring-thmanyah-green/20 transition-all"
        />
      </div>

      {/* Sort */}
      <div className="relative mb-4">
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
                onClick={() => { onSortChange(s.key); setShowSort(false); setVisibleCount(PAGE_SIZE); }}
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

      {/* Showing count */}
      {!isLoading && comments.length > 0 && (
        <p className="text-[10px] font-bold text-muted-foreground/40 mb-2">
          عرض {fmtNum(Math.min(visibleCount, comments.length))} من {fmtNum(total)} تعليق
        </p>
      )}

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
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
          <div className="text-center py-12">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 text-muted-foreground/15" />
            <p className="text-[12px] font-bold text-muted-foreground/40">لا توجد تعليقات</p>
          </div>
        ) : (
          <>
            {visibleComments.map((c) => (
              <CommentCard key={c.id} comment={c} />
            ))}
            {canShowMore && (
              <button
                onClick={handleShowMore}
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
  );
}

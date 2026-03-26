import { useQuery, useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  YouTubeDataRow,
  PlatformStats,
  EnrichedComment,
  ChartPoint,
  TopPost,
  AccountCount,
} from "@/lib/db-types";

interface QueryOpts {
  account?: string;
  dateFrom?: string;
  dateTo?: string;
}

const QUERY_DEFAULTS = {
  staleTime: 5 * 60_000,
  gcTime: 30 * 60_000,
  refetchOnWindowFocus: false,
  placeholderData: keepPreviousData,
  retry: 2,
  retryDelay: 1000,
} as const;

/* ── Stats (head:true count only — no full table scan) ── */
export function useYouTubeStats(opts: QueryOpts) {
  const { account, dateFrom, dateTo } = opts;
  return useQuery<PlatformStats>({
    queryKey: ["youtube-stats", account, dateFrom, dateTo],
    queryFn: async () => {
      let q = (supabase as any)
        .from("youtube_data")
        .select("comment_id", { count: "exact", head: true });
      if (account) q = q.eq("account_name", account);
      if (dateFrom) q = q.gte("comment_published_at", dateFrom);
      if (dateTo) q = q.lte("comment_published_at", dateTo);
      const { count, error } = await q;
      if (error) throw error;
      return {
        total_posts: 0,
        total_comments: count ?? 0,
        total_likes: 0,
        total_shares: 0,
        total_views: 0,
      };
    },
    ...QUERY_DEFAULTS,
  });
}

/* ── Comments (paginated, infinite) ── */
export type CommentSort = "newest" | "oldest" | "most_likes" | "most_replies";

interface CommentOpts extends QueryOpts {
  search?: string;
  sort?: CommentSort;
  filterDate?: string;
  filterPostId?: string; // video_id
  filterPostIds?: string[]; // video_ids
  enabled?: boolean;
}

function sortConfig(sort: CommentSort) {
  const map: Record<CommentSort, { col: string; asc: boolean }> = {
    newest: { col: "comment_published_at", asc: false },
    oldest: { col: "comment_published_at", asc: true },
    most_likes: { col: "comment_like_count", asc: false },
    most_replies: { col: "comment_published_at", asc: false },
  };
  return map[sort];
}

export function useYouTubeComments(opts: CommentOpts) {
  const {
    account, dateFrom, dateTo, search,
    sort = "newest", filterDate, filterPostId, filterPostIds,
    enabled = true,
  } = opts;

  return useInfiniteQuery({
    queryKey: ["youtube-comments", account, dateFrom, dateTo, search, sort, filterDate, filterPostId, filterPostIds],
    enabled,
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const { col, asc } = sortConfig(sort);
      const from = pageParam * 100;
      const to = from + 99;

      let q = (supabase as any)
        .from("youtube_data")
        .select("*", { count: "exact" })
        .order(col, { ascending: asc })
        .range(from, to);

      if (account) q = q.eq("account_name", account);
      if (dateFrom) q = q.gte("comment_published_at", dateFrom);
      if (dateTo) q = q.lte("comment_published_at", dateTo);
      if (search) q = q.ilike("comment_text", `%${search}%`);
      if (filterDate) {
        q = q.gte("comment_published_at", filterDate + "T00:00:00");
        q = q.lt("comment_published_at", filterDate + "T23:59:59.999");
      }
      if (filterPostId) q = q.eq("video_id", filterPostId);
      if (filterPostIds && filterPostIds.length > 0) q = q.in("video_id", filterPostIds);

      const { data: comments, count, error } = await q;
      if (error) throw error;
      const rows = (comments || []) as YouTubeDataRow[];

      const items: EnrichedComment[] = rows.map((c) => ({
        id: c.comment_id,
        text: c.comment_text || "",
        createdAt: c.comment_published_at || "",
        likes: c.comment_like_count || 0,
        authorName: c.author_display_name || "مجهول",
        authorAvatar: c.author_thumbnail_url || undefined,
        isReply: c.comment_type === "reply" || !!c.parent_comment_id,
        replyCount: 0,
        parentPostId: c.video_id || undefined,
        parentPostText: c.video_title || undefined,
        parentPostUrl: c.video_url || undefined,
        parentPostThumbnail: c.video_thumbnail_url || undefined,
        platform: "youtube" as const,
        accountName: c.account_name || undefined,
      }));

      return { items, total: count || 0, page: pageParam };
    },
    getNextPageParam: (last) =>
      (last.page + 1) * 100 < last.total ? last.page + 1 : undefined,
    staleTime: 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: 1000,
  });
}

/* ── Comments Per Day (skip for YouTube — too heavy to scan 400K rows) ── */
export function useYouTubeCommentsPerDay(_opts: QueryOpts) {
  return useQuery<ChartPoint[]>({
    queryKey: ["youtube-comments-per-day", "disabled"],
    queryFn: async () => [],
    enabled: false,
    ...QUERY_DEFAULTS,
  });
}

/* ── Top Videos (lightweight: fetch 10 most-commented unique videos) ── */
export function useYouTubeTopPosts(opts: QueryOpts & { limit?: number }) {
  const { account, dateFrom, dateTo, limit = 10 } = opts;
  return useQuery<TopPost[]>({
    queryKey: ["youtube-top-posts", account, dateFrom, dateTo, limit],
    queryFn: async () => {
      // Fetch a batch of recent comments to extract unique video info
      let q = (supabase as any)
        .from("youtube_data")
        .select("video_id, video_title, video_url, video_view_count, video_like_count, video_comment_count, video_thumbnail_url, account_name")
        .order("comment_published_at", { ascending: false })
        .limit(500);
      if (account) q = q.eq("account_name", account);
      if (dateFrom) q = q.gte("comment_published_at", dateFrom);
      if (dateTo) q = q.lte("comment_published_at", dateTo);
      const { data, error } = await q;
      if (error) throw error;

      // Deduplicate by video_id and pick highest engagement
      const videoMap = new Map<string, any>();
      for (const row of data || []) {
        if (!row.video_id || videoMap.has(row.video_id)) continue;
        videoMap.set(row.video_id, row);
      }

      return Array.from(videoMap.values())
        .map((p) => ({
          id: p.video_id,
          text: p.video_title || "",
          url: p.video_url || "",
          engagement: (p.video_comment_count || 0) + (p.video_like_count || 0),
          likes: p.video_like_count || 0,
          comments: p.video_comment_count || 0,
          views: p.video_view_count || 0,
          account: p.account_name || "",
          accountAr: p.account_name || "",
          platform: "youtube" as const,
        }))
        .sort((a, b) => b.engagement - a.engagement)
        .slice(0, limit);
    },
    ...QUERY_DEFAULTS,
  });
}

/* ── Comments Per Account (head:true counts — lightweight) ── */
export function useYouTubeCommentsPerAccount(opts: { dateFrom?: string; dateTo?: string }) {
  const { dateFrom, dateTo } = opts;
  return useQuery<AccountCount[]>({
    queryKey: ["youtube-comments-per-account", dateFrom, dateTo],
    queryFn: async () => {
      // Use known account names and count each with head:true
      const accounts = ["ثمانية", "رياضة ثمانية", "مخرج ثمانية", "شركة ثمانية", "إذاعة ثمانية"];
      const results: AccountCount[] = [];

      for (const acc of accounts) {
        let q = (supabase as any)
          .from("youtube_data")
          .select("comment_id", { count: "exact", head: true })
          .eq("account_name", acc);
        if (dateFrom) q = q.gte("comment_published_at", dateFrom);
        if (dateTo) q = q.lte("comment_published_at", dateTo);
        const { count } = await q;
        if (count && count > 0) {
          results.push({ account: acc, accountAr: acc, count });
        }
      }

      return results.sort((a, b) => b.count - a.count);
    },
    ...QUERY_DEFAULTS,
  });
}

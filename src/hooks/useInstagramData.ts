import { useQuery, useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  InstagramCommentRow,
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

/* ── Stats (direct query — no RPC) ── */
export function useInstagramStats(opts: QueryOpts) {
  const { account, dateFrom, dateTo } = opts;
  return useQuery<PlatformStats>({
    queryKey: ["instagram-stats", account, dateFrom, dateTo],
    queryFn: async () => {
      let q = (supabase as any)
        .from("instagram_posts")
        .select("post_likes_count, post_comments_count, post_views_count");
      if (account) q = q.eq("account_username", account);
      if (dateFrom) q = q.gte("post_timestamp", dateFrom);
      if (dateTo) q = q.lte("post_timestamp", dateTo);
      const { data, error } = await q;
      if (error) throw error;
      const posts = data || [];
      return {
        total_posts: posts.length,
        total_likes: posts.reduce((s: number, p: any) => s + (p.post_likes_count || 0), 0),
        total_comments: posts.reduce((s: number, p: any) => s + (p.post_comments_count || 0), 0),
        total_shares: 0,
        total_views: posts.reduce((s: number, p: any) => s + (p.post_views_count || 0), 0),
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
  filterPostId?: string;
  filterPostIds?: string[];
  enabled?: boolean;
}

function sortConfig(sort: CommentSort) {
  const map: Record<CommentSort, { col: string; asc: boolean }> = {
    newest: { col: "comment_timestamp", asc: false },
    oldest: { col: "comment_timestamp", asc: true },
    most_likes: { col: "comment_likes", asc: false },
    most_replies: { col: "comment_timestamp", asc: false },
  };
  return map[sort];
}

export function useInstagramComments(opts: CommentOpts) {
  const {
    account, dateFrom, dateTo, search,
    sort = "newest", filterDate, filterPostId, filterPostIds,
    enabled = true,
  } = opts;

  return useInfiniteQuery({
    queryKey: ["instagram-comments", account, dateFrom, dateTo, search, sort, filterDate, filterPostId, filterPostIds],
    enabled,
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const { col, asc } = sortConfig(sort);
      const from = pageParam * 100;
      const to = from + 99;

      let q = (supabase as any)
        .from("instagram_comments")
        .select("*", { count: "exact" })
        .order(col, { ascending: asc })
        .range(from, to);

      if (account) q = q.eq("account_username", account);
      if (dateFrom) q = q.gte("comment_timestamp", dateFrom);
      if (dateTo) q = q.lte("comment_timestamp", dateTo);
      if (search) q = q.ilike("comment_text", `%${search}%`);
      if (filterDate) {
        q = q.gte("comment_timestamp", filterDate + "T00:00:00");
        q = q.lt("comment_timestamp", filterDate + "T23:59:59.999");
      }
      if (filterPostId) q = q.eq("post_id", filterPostId);
      if (filterPostIds && filterPostIds.length > 0) q = q.in("post_id", filterPostIds);

      const { data: comments, count, error } = await q;
      if (error) throw error;
      const rows = (comments || []) as InstagramCommentRow[];

      // Batch-fetch parent post info
      const postIds = [...new Set(rows.map((c) => c.post_id).filter(Boolean))] as string[];
      const postMap = new Map<string, { text: string; url: string; thumbnail: string }>();
      if (postIds.length > 0) {
        const { data: posts } = await (supabase as any)
          .from("instagram_posts")
          .select("post_id, post_caption, post_url, post_image_url")
          .in("post_id", postIds);
        for (const p of posts || []) {
          postMap.set(p.post_id, { text: p.post_caption || "", url: p.post_url || "", thumbnail: p.post_image_url || "" });
        }
      }

      const items: EnrichedComment[] = rows.map((c) => ({
        id: c.comment_id,
        text: c.comment_text || "",
        createdAt: c.comment_timestamp || "",
        likes: c.comment_likes || 0,
        authorName: c.comment_owner_username || "مجهول",
        authorAvatar: c.comment_owner_profile_pic || undefined,
        isVerified: c.comment_owner_is_verified || false,
        isReply: false,
        replyCount: 0,
        parentPostId: c.post_id || undefined,
        parentPostText: postMap.get(c.post_id || "")?.text,
        parentPostUrl: postMap.get(c.post_id || "")?.url,
        parentPostThumbnail: postMap.get(c.post_id || "")?.thumbnail || undefined,
        platform: "instagram" as const,
        accountName: c.account_name_ar || c.account_username || undefined,
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

/* ── Comments Per Day (from posts table) ── */
export function useInstagramCommentsPerDay(opts: QueryOpts) {
  const { account, dateFrom, dateTo } = opts;
  return useQuery<ChartPoint[]>({
    queryKey: ["instagram-comments-per-day", account, dateFrom, dateTo],
    queryFn: async () => {
      let q = (supabase as any)
        .from("instagram_posts")
        .select("post_timestamp, post_comments_count");
      if (account) q = q.eq("account_username", account);
      if (dateFrom) q = q.gte("post_timestamp", dateFrom);
      if (dateTo) q = q.lte("post_timestamp", dateTo);
      const { data, error } = await q;
      if (error) throw error;
      const perDay: Record<string, number> = {};
      for (const row of data || []) {
        const day = row.post_timestamp?.split("T")[0];
        if (day) perDay[day] = (perDay[day] || 0) + (row.post_comments_count || 0);
      }
      return Object.entries(perDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count }));
    },
    ...QUERY_DEFAULTS,
  });
}

/* ── Top Posts (direct query) ── */
export function useInstagramTopPosts(opts: QueryOpts & { limit?: number }) {
  const { account, dateFrom, dateTo, limit = 10 } = opts;
  return useQuery<TopPost[]>({
    queryKey: ["instagram-top-posts", account, dateFrom, dateTo, limit],
    queryFn: async () => {
      let q = (supabase as any)
        .from("instagram_posts")
        .select("post_id, post_caption, post_url, post_likes_count, post_comments_count, post_views_count, account_username, account_name_ar")
        .order("post_comments_count", { ascending: false })
        .limit(limit);
      if (account) q = q.eq("account_username", account);
      if (dateFrom) q = q.gte("post_timestamp", dateFrom);
      if (dateTo) q = q.lte("post_timestamp", dateTo);
      const { data, error } = await q;
      if (error) throw error;
      return ((data || []) as any[]).map((p) => ({
        id: p.post_id,
        text: p.post_caption || "",
        url: p.post_url || "",
        engagement: (p.post_comments_count || 0) + (p.post_likes_count || 0),
        likes: p.post_likes_count || 0,
        comments: p.post_comments_count || 0,
        views: p.post_views_count || 0,
        account: p.account_username || "",
        accountAr: p.account_name_ar || "",
        platform: "instagram" as const,
      }));
    },
    ...QUERY_DEFAULTS,
  });
}

/* ── Posts Per Day (direct query) ── */
export function useInstagramPostsPerDay(opts: QueryOpts) {
  const { account, dateFrom, dateTo } = opts;
  return useQuery<ChartPoint[]>({
    queryKey: ["instagram-posts-per-day", account, dateFrom, dateTo],
    queryFn: async () => {
      let q = (supabase as any)
        .from("instagram_posts")
        .select("post_timestamp");
      if (account) q = q.eq("account_username", account);
      if (dateFrom) q = q.gte("post_timestamp", dateFrom);
      if (dateTo) q = q.lte("post_timestamp", dateTo);
      const { data, error } = await q;
      if (error) throw error;
      const perDay: Record<string, number> = {};
      for (const row of data || []) {
        const day = row.post_timestamp?.split("T")[0];
        if (day) perDay[day] = (perDay[day] || 0) + 1;
      }
      return Object.entries(perDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count }));
    },
    ...QUERY_DEFAULTS,
  });
}

/* ── Comments Per Account (from posts table) ── */
export function useInstagramCommentsPerAccount(opts: { dateFrom?: string; dateTo?: string }) {
  const { dateFrom, dateTo } = opts;
  return useQuery<AccountCount[]>({
    queryKey: ["instagram-comments-per-account", dateFrom, dateTo],
    queryFn: async () => {
      let q = (supabase as any)
        .from("instagram_posts")
        .select("account_username, account_name_ar, post_comments_count");
      if (dateFrom) q = q.gte("post_timestamp", dateFrom);
      if (dateTo) q = q.lte("post_timestamp", dateTo);
      const { data, error } = await q;
      if (error) throw error;
      const counts: Record<string, { ar: string; count: number }> = {};
      for (const row of data || []) {
        const acc = row.account_username || "";
        if (!counts[acc]) counts[acc] = { ar: row.account_name_ar || "", count: 0 };
        counts[acc].count += row.post_comments_count || 0;
      }
      return Object.entries(counts)
        .map(([account, { ar, count }]) => ({ account, accountAr: ar, count }))
        .sort((a, b) => b.count - a.count);
    },
    ...QUERY_DEFAULTS,
  });
}

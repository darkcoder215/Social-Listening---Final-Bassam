import { useInfiniteQuery, useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { EnrichedComment, DrawerFilter } from "@/lib/db-types";
import type { DrawerSort } from "@/components/explore/CommentsDrawer";
import { PRODUCTS } from "@/lib/products";

const PAGE_SIZE = 20; // per platform per page

interface Opts {
  filter: DrawerFilter | null;
  dateFrom?: string;
  dateTo?: string;
  sort?: DrawerSort;
}

/* ── Helpers ── */

function extractFilterParams(filter: DrawerFilter | null) {
  return {
    filterDate: filter?.type === "date" ? (filter as any).date : undefined,
    searchWord: filter?.type === "word" ? (filter as any).word : undefined,
    filterPostId: filter?.type === "post" ? (filter as any).postId : undefined,
    productId: filter?.type === "product" ? (filter as any).productId : undefined,
  };
}

function applySortCol(sort: DrawerSort, platform: "tiktok" | "instagram" | "youtube") {
  const dateCol = { tiktok: "comment_create_time_iso", instagram: "comment_timestamp", youtube: "comment_published_at" }[platform];
  const likeCol = { tiktok: "comment_digg_count", instagram: "comment_likes", youtube: "comment_like_count" }[platform];
  return {
    col: sort === "most_likes" ? likeCol : dateCol,
    asc: sort === "oldest",
  };
}

function applyFilters(q: any, platform: "tiktok" | "instagram" | "youtube", dateFrom?: string, dateTo?: string, filterDate?: string, searchWord?: string, filterPostId?: string) {
  const dateCol = { tiktok: "comment_create_time_iso", instagram: "comment_timestamp", youtube: "comment_published_at" }[platform];
  const postIdCol = platform === "youtube" ? "video_id" : "post_id";

  if (dateFrom) q = q.gte(dateCol, dateFrom);
  if (dateTo) q = q.lte(dateCol, dateTo);
  if (filterDate) {
    q = q.gte(dateCol, filterDate + "T00:00:00");
    q = q.lt(dateCol, filterDate + "T23:59:59.999");
  }
  if (searchWord) q = q.ilike("comment_text", `%${searchWord}%`);
  if (filterPostId) q = q.eq(postIdCol, filterPostId);
  return q;
}

/**
 * For "product" filter: find post_ids matching a product's terms,
 * then return them for use with .in() filter.
 */
async function findPostIdsForProduct(
  productId: string,
  dateFrom?: string,
  dateTo?: string,
): Promise<{ tiktok: string[]; instagram: string[]; youtube: string[] }> {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return { tiktok: [], instagram: [], youtube: [] };

  const allTerms = [...product.textTerms, ...product.hashtags];
  if (allTerms.length === 0) return { tiktok: [], instagram: [], youtube: [] };

  // Search posts tables for matching descriptions
  const [ttRes, igRes, ytRes] = await Promise.all([
    // TikTok posts
    (async () => {
      const ids: string[] = [];
      for (const term of allTerms) {
        let q = (supabase as any)
          .from("tiktok_posts")
          .select("post_id")
          .ilike("post_description", `%${term}%`)
          .limit(200);
        if (dateFrom) q = q.gte("post_create_time", dateFrom);
        if (dateTo) q = q.lte("post_create_time", dateTo);
        const { data } = await q;
        for (const r of data || []) if (r.post_id) ids.push(r.post_id);
      }
      return [...new Set(ids)];
    })(),
    // Instagram posts
    (async () => {
      const ids: string[] = [];
      for (const term of allTerms) {
        let q = (supabase as any)
          .from("instagram_posts")
          .select("post_id")
          .ilike("post_caption", `%${term}%`)
          .limit(200);
        if (dateFrom) q = q.gte("post_timestamp", dateFrom);
        if (dateTo) q = q.lte("post_timestamp", dateTo);
        const { data } = await q;
        for (const r of data || []) if (r.post_id) ids.push(r.post_id);
      }
      return [...new Set(ids)];
    })(),
    // YouTube videos
    (async () => {
      const ids: string[] = [];
      for (const term of allTerms) {
        let q = (supabase as any)
          .from("youtube_data")
          .select("video_id")
          .ilike("video_title", `%${term}%`)
          .limit(500);
        if (dateFrom) q = q.gte("comment_published_at", dateFrom);
        if (dateTo) q = q.lte("comment_published_at", dateTo);
        const { data } = await q;
        for (const r of data || []) if (r.video_id) ids.push(r.video_id);
      }
      return [...new Set(ids)];
    })(),
  ]);

  return { tiktok: ttRes, instagram: igRes, youtube: ytRes };
}

/* ── Count query (lightweight, HEAD only) ── */

export function useOverviewCommentsCount(opts: Opts) {
  const { filter, dateFrom, dateTo } = opts;
  const { filterDate, searchWord, filterPostId, productId } = extractFilterParams(filter);

  return useQuery<number>({
    queryKey: ["overview-comments-count", filter, dateFrom, dateTo],
    enabled: !!filter,
    queryFn: async () => {
      // Product filter: find post_ids first, then count comments for those posts
      if (productId) {
        const postIds = await findPostIdsForProduct(productId, dateFrom, dateTo);
        const counts = await Promise.all([
          postIds.tiktok.length > 0 ? (async () => {
            let q = (supabase as any).from("tiktok_comments").select("comment_cid", { count: "exact", head: true }).in("post_id", postIds.tiktok);
            if (dateFrom) q = q.gte("comment_create_time_iso", dateFrom);
            if (dateTo) q = q.lte("comment_create_time_iso", dateTo);
            const { count } = await q;
            return count || 0;
          })() : 0,
          postIds.instagram.length > 0 ? (async () => {
            let q = (supabase as any).from("instagram_comments").select("comment_id", { count: "exact", head: true }).in("post_id", postIds.instagram);
            if (dateFrom) q = q.gte("comment_timestamp", dateFrom);
            if (dateTo) q = q.lte("comment_timestamp", dateTo);
            const { count } = await q;
            return count || 0;
          })() : 0,
          postIds.youtube.length > 0 ? (async () => {
            let q = (supabase as any).from("youtube_data").select("comment_id", { count: "exact", head: true }).in("video_id", postIds.youtube);
            if (dateFrom) q = q.gte("comment_published_at", dateFrom);
            if (dateTo) q = q.lte("comment_published_at", dateTo);
            const { count } = await q;
            return count || 0;
          })() : 0,
        ]);
        return counts[0] + counts[1] + counts[2];
      }

      // Standard filters
      const counts = await Promise.all([
        (async () => {
          let q = (supabase as any).from("tiktok_comments").select("comment_cid", { count: "exact", head: true });
          q = applyFilters(q, "tiktok", dateFrom, dateTo, filterDate, searchWord, filterPostId);
          const { count } = await q;
          return count || 0;
        })(),
        (async () => {
          let q = (supabase as any).from("instagram_comments").select("comment_id", { count: "exact", head: true });
          q = applyFilters(q, "instagram", dateFrom, dateTo, filterDate, searchWord, filterPostId);
          const { count } = await q;
          return count || 0;
        })(),
        (async () => {
          let q = (supabase as any).from("youtube_data").select("comment_id", { count: "exact", head: true });
          q = applyFilters(q, "youtube", dateFrom, dateTo, filterDate, searchWord, filterPostId);
          const { count } = await q;
          return count || 0;
        })(),
      ]);
      return counts[0] + counts[1] + counts[2];
    },
    staleTime: 30_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    retry: 2,
    retryDelay: 1000,
  });
}

/* ── Data query (paginated infinite) ── */

export function useOverviewComments(opts: Opts) {
  const { filter, dateFrom, dateTo, sort = "newest" } = opts;
  const { filterDate, searchWord, filterPostId, productId } = extractFilterParams(filter);

  return useInfiniteQuery({
    queryKey: ["overview-comments", filter, dateFrom, dateTo, sort],
    enabled: !!filter,
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const items: EnrichedComment[] = [];

      // For product filter, find post_ids first
      let productPostIds: { tiktok: string[]; instagram: string[]; youtube: string[] } | null = null;
      if (productId) {
        productPostIds = await findPostIdsForProduct(productId, dateFrom, dateTo);
      }

      await Promise.all([
        // TikTok
        (async () => {
          const s = applySortCol(sort, "tiktok");
          let q = (supabase as any)
            .from("tiktok_comments")
            .select("comment_cid, comment_text, comment_create_time_iso, comment_digg_count, comment_unique_id, comment_avatar_thumbnail, post_id, account_name_ar, account_username")
            .order(s.col, { ascending: s.asc })
            .range(from, to);

          if (productPostIds) {
            if (productPostIds.tiktok.length === 0) return; // no matching posts
            q = q.in("post_id", productPostIds.tiktok);
            if (dateFrom) q = q.gte("comment_create_time_iso", dateFrom);
            if (dateTo) q = q.lte("comment_create_time_iso", dateTo);
          } else {
            q = applyFilters(q, "tiktok", dateFrom, dateTo, filterDate, searchWord, filterPostId);
          }

          const { data } = await q;
          for (const c of data || []) {
            items.push({
              id: c.comment_cid,
              text: c.comment_text || "",
              createdAt: c.comment_create_time_iso || "",
              likes: c.comment_digg_count || 0,
              authorName: c.comment_unique_id || "مجهول",
              authorAvatar: c.comment_avatar_thumbnail || undefined,
              isReply: false,
              replyCount: 0,
              parentPostId: c.post_id || undefined,
              platform: "tiktok",
              accountName: c.account_name_ar || c.account_username || undefined,
            });
          }
        })(),
        // Instagram
        (async () => {
          const s = applySortCol(sort, "instagram");
          let q = (supabase as any)
            .from("instagram_comments")
            .select("comment_id, comment_text, comment_timestamp, comment_likes, comment_owner_username, comment_owner_profile_pic, post_id, account_name_ar, account_username")
            .order(s.col, { ascending: s.asc })
            .range(from, to);

          if (productPostIds) {
            if (productPostIds.instagram.length === 0) return;
            q = q.in("post_id", productPostIds.instagram);
            if (dateFrom) q = q.gte("comment_timestamp", dateFrom);
            if (dateTo) q = q.lte("comment_timestamp", dateTo);
          } else {
            q = applyFilters(q, "instagram", dateFrom, dateTo, filterDate, searchWord, filterPostId);
          }

          const { data } = await q;
          for (const c of data || []) {
            items.push({
              id: c.comment_id,
              text: c.comment_text || "",
              createdAt: c.comment_timestamp || "",
              likes: c.comment_likes || 0,
              authorName: c.comment_owner_username || "مجهول",
              authorAvatar: c.comment_owner_profile_pic || undefined,
              isReply: false,
              replyCount: 0,
              parentPostId: c.post_id || undefined,
              platform: "instagram",
              accountName: c.account_name_ar || c.account_username || undefined,
            });
          }
        })(),
        // YouTube
        (async () => {
          const s = applySortCol(sort, "youtube");
          let q = (supabase as any)
            .from("youtube_data")
            .select("comment_id, comment_text, comment_published_at, comment_like_count, author_display_name, author_thumbnail_url, video_id, video_title, video_thumbnail_url, account_name")
            .order(s.col, { ascending: s.asc })
            .range(from, to);

          if (productPostIds) {
            if (productPostIds.youtube.length === 0) return;
            q = q.in("video_id", productPostIds.youtube);
            if (dateFrom) q = q.gte("comment_published_at", dateFrom);
            if (dateTo) q = q.lte("comment_published_at", dateTo);
          } else {
            q = applyFilters(q, "youtube", dateFrom, dateTo, filterDate, searchWord, filterPostId);
          }

          const { data } = await q;
          for (const c of data || []) {
            items.push({
              id: c.comment_id,
              text: c.comment_text || "",
              createdAt: c.comment_published_at || "",
              likes: c.comment_like_count || 0,
              authorName: c.author_display_name || "مجهول",
              authorAvatar: c.author_thumbnail_url || undefined,
              isReply: false,
              replyCount: 0,
              parentPostId: c.video_id || undefined,
              parentPostText: c.video_title || undefined,
              parentPostThumbnail: c.video_thumbnail_url || undefined,
              platform: "youtube",
              accountName: c.account_name || undefined,
            });
          }
        })(),
      ]);

      // Client-side sort across platforms
      if (sort === "most_likes") {
        items.sort((a, b) => b.likes - a.likes);
      } else if (sort === "oldest") {
        items.sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
      } else {
        items.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      }

      return { items, page: pageParam };
    },
    getNextPageParam: (last) => last.items.length > 0 ? last.page + 1 : undefined,
    staleTime: 30_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: 1000,
  });
}

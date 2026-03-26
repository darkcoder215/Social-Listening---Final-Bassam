import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PlatformStats, TopPost, Platform } from "@/lib/db-types";

export type TimeGranularity = "day" | "week" | "month";

export interface TimelinePoint {
  date: string;
  tiktok: number;
  instagram: number;
  youtube: number;
}

interface OverviewResult {
  tiktok: PlatformStats;
  instagram: PlatformStats;
  youtube: PlatformStats;
  totals: { total_posts: number; total_likes: number; total_comments: number; total_views: number };
  trendingPosts: TopPost[];
  timeline: TimelinePoint[];
}

const empty: PlatformStats = { total_posts: 0, total_likes: 0, total_comments: 0, total_shares: 0, total_views: 0 };

/** Auto-select granularity based on date range span */
export function autoGranularity(dateFrom?: string, dateTo?: string): TimeGranularity {
  if (!dateFrom || !dateTo) return "day";
  const ms = new Date(dateTo).getTime() - new Date(dateFrom).getTime();
  const days = ms / (1000 * 60 * 60 * 24);
  if (days <= 60) return "day";
  if (days <= 180) return "week";
  return "month";
}

/** Group daily data into weeks or months client-side */
export function groupTimeline(
  daily: TimelinePoint[],
  granularity: TimeGranularity,
): TimelinePoint[] {
  if (granularity === "day") return daily;

  const grouped: Record<string, { tiktok: number; instagram: number; youtube: number }> = {};

  for (const pt of daily) {
    let key: string;
    if (granularity === "month") {
      key = pt.date.slice(0, 7); // YYYY-MM
    } else {
      const d = new Date(pt.date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      key = monday.toISOString().slice(0, 10);
    }
    if (!grouped[key]) grouped[key] = { tiktok: 0, instagram: 0, youtube: 0 };
    grouped[key].tiktok += pt.tiktok;
    grouped[key].instagram += pt.instagram;
    grouped[key].youtube += pt.youtube;
  }

  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({ date, ...counts }));
}

/**
 * Unified overview query — fetches everything in ONE useQuery.
 * Uses direct table queries (no RPCs) to avoid timeouts.
 * Sequential fetches to avoid exhausting Supabase connection pool.
 */
export function useOverviewData(dateFrom?: string, dateTo?: string) {
  return useQuery<OverviewResult>({
    queryKey: ["overview", dateFrom, dateTo],
    queryFn: async () => {
      // ── 1. TikTok posts (small table, fast) ──
      let ttQ = (supabase as any)
        .from("tiktok_posts")
        .select("post_id, post_like_count, post_comment_count, post_share_count, post_play_count, post_create_time, post_description, post_url, account_username, account_name_ar");
      if (dateFrom) ttQ = ttQ.gte("post_create_time", dateFrom);
      if (dateTo) ttQ = ttQ.lte("post_create_time", dateTo);
      const { data: ttPosts } = await ttQ;

      // ── 2. Instagram posts (small table, fast) ──
      let igQ = (supabase as any)
        .from("instagram_posts")
        .select("post_id, post_likes_count, post_comments_count, post_views_count, post_timestamp, post_caption, post_url, account_username, account_name_ar");
      if (dateFrom) igQ = igQ.gte("post_timestamp", dateFrom);
      if (dateTo) igQ = igQ.lte("post_timestamp", dateTo);
      const { data: igPosts } = await igQ;

      // ── 3. YouTube comment count only (head:true = no data transfer) ──
      let ytQ = (supabase as any)
        .from("youtube_data")
        .select("comment_id", { count: "exact", head: true });
      if (dateFrom) ytQ = ytQ.gte("comment_published_at", dateFrom);
      if (dateTo) ytQ = ytQ.lte("comment_published_at", dateTo);
      const { count: ytCount } = await ytQ;

      // ── Calculate stats from fetched data ──
      const tiktok: PlatformStats = {
        total_posts: ttPosts?.length || 0,
        total_likes: (ttPosts || []).reduce((s: number, p: any) => s + (p.post_like_count || 0), 0),
        total_comments: (ttPosts || []).reduce((s: number, p: any) => s + (p.post_comment_count || 0), 0),
        total_shares: (ttPosts || []).reduce((s: number, p: any) => s + (p.post_share_count || 0), 0),
        total_views: (ttPosts || []).reduce((s: number, p: any) => s + (p.post_play_count || 0), 0),
      };

      const instagram: PlatformStats = {
        total_posts: igPosts?.length || 0,
        total_likes: (igPosts || []).reduce((s: number, p: any) => s + (p.post_likes_count || 0), 0),
        total_comments: (igPosts || []).reduce((s: number, p: any) => s + (p.post_comments_count || 0), 0),
        total_shares: 0,
        total_views: (igPosts || []).reduce((s: number, p: any) => s + (p.post_views_count || 0), 0),
      };

      const youtube: PlatformStats = {
        total_posts: 0,
        total_comments: ytCount ?? 0,
        total_likes: 0,
        total_shares: 0,
        total_views: 0,
      };

      const totals = {
        total_posts: tiktok.total_posts + instagram.total_posts,
        total_likes: tiktok.total_likes + instagram.total_likes,
        total_comments: tiktok.total_comments + instagram.total_comments + youtube.total_comments,
        total_views: tiktok.total_views + instagram.total_views,
      };

      // ── Timeline from posts (not comments — fast!) ──
      const ttTimeline: Record<string, number> = {};
      for (const p of ttPosts || []) {
        const d = p.post_create_time?.split("T")[0];
        if (d) ttTimeline[d] = (ttTimeline[d] || 0) + (p.post_comment_count || 0);
      }
      const igTimeline: Record<string, number> = {};
      for (const p of igPosts || []) {
        const d = p.post_timestamp?.split("T")[0];
        if (d) igTimeline[d] = (igTimeline[d] || 0) + (p.post_comments_count || 0);
      }

      // ── YouTube timeline (fetch comment dates, limit 5000 to avoid heavy scan) ──
      const ytTimeline: Record<string, number> = {};
      let ytTlQ = (supabase as any)
        .from("youtube_data")
        .select("comment_published_at")
        .order("comment_published_at", { ascending: false })
        .limit(5000);
      if (dateFrom) ytTlQ = ytTlQ.gte("comment_published_at", dateFrom);
      if (dateTo) ytTlQ = ytTlQ.lte("comment_published_at", dateTo);
      const { data: ytRows } = await ytTlQ;
      for (const r of ytRows || []) {
        const d = r.comment_published_at?.split("T")[0];
        if (d) ytTimeline[d] = (ytTimeline[d] || 0) + 1;
      }

      const allDates = new Set([...Object.keys(ttTimeline), ...Object.keys(igTimeline), ...Object.keys(ytTimeline)]);
      const timeline: TimelinePoint[] = Array.from(allDates)
        .sort()
        .map((date) => ({
          date,
          tiktok: ttTimeline[date] || 0,
          instagram: igTimeline[date] || 0,
          youtube: ytTimeline[date] || 0,
        }));

      // ── Trending posts (already fetched — just sort) ──
      const mapTT = (p: any): TopPost => ({
        id: p.post_id || "",
        text: p.post_description || "",
        url: p.post_url || "",
        engagement: (p.post_comment_count || 0) + (p.post_like_count || 0) + (p.post_share_count || 0),
        likes: p.post_like_count || 0,
        comments: p.post_comment_count || 0,
        views: p.post_play_count || 0,
        account: p.account_username || "",
        accountAr: p.account_name_ar || "",
        platform: "tiktok" as Platform,
      });

      const mapIG = (p: any): TopPost => ({
        id: p.post_id || "",
        text: p.post_caption || "",
        url: p.post_url || "",
        engagement: (p.post_comments_count || 0) + (p.post_likes_count || 0),
        likes: p.post_likes_count || 0,
        comments: p.post_comments_count || 0,
        views: p.post_views_count || 0,
        account: p.account_username || "",
        accountAr: p.account_name_ar || "",
        platform: "instagram" as Platform,
      });

      const trendingPosts: TopPost[] = [
        ...(ttPosts || []).map(mapTT),
        ...(igPosts || []).map(mapIG),
      ]
        .sort((a, b) => b.engagement - a.engagement)
        .slice(0, 10);

      return { tiktok, instagram, youtube, totals, trendingPosts, timeline };
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    retry: 2,
    retryDelay: 1000,
  });
}

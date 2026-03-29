/**
 * Hook to fetch cross-platform comments for AI analysis.
 * Pulls from tiktok_comments, instagram_comments, youtube_data, and x_data.
 */
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CommentInput } from "@/lib/ai-analysis";

const QUERY_DEFAULTS = {
  staleTime: 5 * 60_000,
  gcTime: 30 * 60_000,
  refetchOnWindowFocus: false,
  placeholderData: keepPreviousData,
  retry: 2,
  retryDelay: 1000,
} as const;

interface Opts {
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  enabled?: boolean;
}

/**
 * Fetches comments from all platforms, returning them as CommentInput[]
 * ready to be sent to the AI analysis pipeline.
 */
export function useAllPlatformComments(opts: Opts = {}) {
  const { dateFrom, dateTo, limit = 200, enabled = true } = opts;

  return useQuery<CommentInput[]>({
    queryKey: ["ai-analysis-comments", dateFrom, dateTo, limit],
    enabled,
    queryFn: async () => {
      const results: CommentInput[] = [];
      const perPlatform = Math.ceil(limit / 4);

      // TikTok comments
      {
        let q = (supabase as any)
          .from("tiktok_comments")
          .select("comment_text, comment_unique_id, comment_create_time_iso, account_name_ar")
          .order("comment_create_time_iso", { ascending: false })
          .limit(perPlatform);
        if (dateFrom) q = q.gte("comment_create_time_iso", dateFrom);
        if (dateTo) q = q.lte("comment_create_time_iso", dateTo);
        const { data, error } = await q;
        if (error) console.error("[AiData] tiktok_comments error:", error.message);
        for (const r of data || []) {
          if (r.comment_text?.trim()) {
            results.push({
              text: r.comment_text,
              platform: "tiktok",
              author: r.comment_unique_id || undefined,
              date: r.comment_create_time_iso || undefined,
            });
          }
        }
      }

      // Instagram comments
      {
        let q = (supabase as any)
          .from("instagram_comments")
          .select("comment_text, comment_owner_username, comment_timestamp, account_name_ar")
          .order("comment_timestamp", { ascending: false })
          .limit(perPlatform);
        if (dateFrom) q = q.gte("comment_timestamp", dateFrom);
        if (dateTo) q = q.lte("comment_timestamp", dateTo);
        const { data, error } = await q;
        if (error) console.error("[AiData] instagram_comments error:", error.message);
        for (const r of data || []) {
          if (r.comment_text?.trim()) {
            results.push({
              text: r.comment_text,
              platform: "instagram",
              author: r.comment_owner_username || undefined,
              date: r.comment_timestamp || undefined,
            });
          }
        }
      }

      // YouTube comments
      {
        let q = (supabase as any)
          .from("youtube_data")
          .select("comment_text, author_display_name, comment_published_at, account_name")
          .order("comment_published_at", { ascending: false })
          .limit(perPlatform);
        if (dateFrom) q = q.gte("comment_published_at", dateFrom);
        if (dateTo) q = q.lte("comment_published_at", dateTo);
        const { data, error } = await q;
        if (error) console.error("[AiData] youtube_data error:", error.message);
        for (const r of data || []) {
          if (r.comment_text?.trim()) {
            results.push({
              text: r.comment_text,
              platform: "youtube",
              author: r.author_display_name || undefined,
              date: r.comment_published_at || undefined,
            });
          }
        }
      }

      // X / Twitter data
      {
        let q = (supabase as any)
          .from("x_data")
          .select("hit_sentence, author_name, date, sentiment")
          .order("date", { ascending: false })
          .limit(perPlatform);
        if (dateFrom) q = q.gte("date", dateFrom);
        if (dateTo) q = q.lte("date", dateTo);
        const { data, error } = await q;
        if (error) console.error("[AiData] x_data error:", error.message);
        for (const r of data || []) {
          if (r.hit_sentence?.trim()) {
            results.push({
              text: r.hit_sentence,
              platform: "x",
              author: r.author_name || undefined,
              date: r.date || undefined,
            });
          }
        }
      }

      return results;
    },
    ...QUERY_DEFAULTS,
  });
}

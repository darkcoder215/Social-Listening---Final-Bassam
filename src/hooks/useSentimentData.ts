import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { EnrichedComment } from "@/lib/db-types";

export interface AnalyzedComment {
  comment_cid: string;
  comment_text: string | null;
  sentiment: string | null;
  frequent_words: string | null;
  topics: string | null;
  names_mentioned: string | null;
  thmanyah_relevance: string | null;
  technical_issues: string | null;
  hostility_level: string | null;
  overview: string | null;
  comment_create_time_iso: string | null;
  comment_digg_count: number | null;
  comment_unique_id: string | null;
  comment_avatar_thumbnail: string | null;
  post_id: string | null;
  account_username: string | null;
  account_name_ar: string | null;
}

export interface SentimentAggregation {
  rows: AnalyzedComment[];
  total: number;
  sentimentCounts: Record<string, number>;
  hostilityCounts: Record<string, number>;
  relevanceCounts: Record<string, number>;
  topicsCounts: Record<string, number>;
  technicalIssuesCounts: Record<string, number>;
  namesCounts: Record<string, number>;
  negativeTexts: string[];
  positiveTexts: string[];
}

function countField(rows: AnalyzedComment[], field: keyof AnalyzedComment): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const val = row[field] as string | null;
    if (val && val.trim()) {
      counts[val] = (counts[val] || 0) + 1;
    }
  }
  return counts;
}

function countPipeSeparated(rows: AnalyzedComment[], field: keyof AnalyzedComment): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const val = row[field] as string | null;
    if (!val || !val.trim()) continue;
    const parts = val.split("|").map(s => s.trim()).filter(Boolean);
    for (const part of parts) {
      counts[part] = (counts[part] || 0) + 1;
    }
  }
  return counts;
}

export function useSentimentData() {
  return useQuery<SentimentAggregation>({
    queryKey: ["sentiment-data"],
    enabled: true,
    queryFn: async () => {
      console.log("[SentimentData] Fetching from TikTok_comments_rows_analyzed...");

      const { data, error } = await (supabase as any)
        .from("TikTok_comments_rows_analyzed")
        .select("comment_cid, comment_text, sentiment, frequent_words, topics, names_mentioned, thmanyah_relevance, technical_issues, hostility_level, overview, comment_create_time_iso, comment_digg_count, comment_unique_id, comment_avatar_thumbnail, post_id, account_username, account_name_ar");

      if (error) {
        console.error("[SentimentData] Query error:", error);
        throw error;
      }

      const rows = (data || []) as AnalyzedComment[];
      console.log("[SentimentData] Loaded", rows.length, "rows");
      if (rows.length > 0) {
        console.log("[SentimentData] Sample row:", rows[0]);
        console.log("[SentimentData] Sentiment values:", [...new Set(rows.map(r => r.sentiment))]);
        console.log("[SentimentData] Hostility values:", [...new Set(rows.map(r => r.hostility_level))]);
        console.log("[SentimentData] Relevance values:", [...new Set(rows.map(r => r.thmanyah_relevance))]);
      }

      const sentimentCounts = countField(rows, "sentiment");
      const hostilityCounts = countField(rows, "hostility_level");
      const relevanceCounts = countField(rows, "thmanyah_relevance");
      const topicsCounts = countPipeSeparated(rows, "topics");
      const technicalIssuesCounts = countField(rows, "technical_issues");
      // Remove "none" from technical issues
      delete technicalIssuesCounts["none"];
      const namesCounts = countPipeSeparated(rows, "names_mentioned");

      const negativeTexts = rows
        .filter(r => r.sentiment === "negative" || r.sentiment === "mockery")
        .map(r => r.comment_text || "")
        .filter(Boolean);

      const positiveTexts = rows
        .filter(r => r.sentiment === "positive")
        .map(r => r.comment_text || "")
        .filter(Boolean);

      console.log("[SentimentData] Counts:", { sentimentCounts, hostilityCounts, relevanceCounts });

      return {
        rows,
        total: rows.length,
        sentimentCounts,
        hostilityCounts,
        relevanceCounts,
        topicsCounts,
        technicalIssuesCounts,
        namesCounts,
        negativeTexts,
        positiveTexts,
      };
    },
    staleTime: 600_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    retry: 3,
    retryDelay: 2000,
  });
}

/** Convert analyzed rows to EnrichedComment[] filtered by a criteria */
export function filterAnalyzedComments(
  rows: AnalyzedComment[],
  filterType: string,
  filterValue: string,
): EnrichedComment[] {
  const filtered = rows.filter(r => {
    switch (filterType) {
      case "sentiment": return r.sentiment === filterValue;
      case "hostility": return r.hostility_level === filterValue;
      case "relevance": return r.thmanyah_relevance === filterValue;
      case "topic": return r.topics?.includes(filterValue);
      case "technical_issue": return r.technical_issues === filterValue;
      case "name_mentioned": return r.names_mentioned?.includes(filterValue);
      case "word": return r.comment_text?.includes(filterValue);
      default: return false;
    }
  });

  return filtered.map(r => ({
    id: r.comment_cid,
    text: r.comment_text || "",
    createdAt: r.comment_create_time_iso || "",
    likes: r.comment_digg_count || 0,
    authorName: r.comment_unique_id || "مجهول",
    authorAvatar: r.comment_avatar_thumbnail || undefined,
    isReply: false,
    replyCount: 0,
    parentPostId: r.post_id || undefined,
    platform: "tiktok" as const,
    accountName: r.account_name_ar || r.account_username || undefined,
    // Extra sentiment fields stored in optional fields
    sentimentLabel: r.sentiment || undefined,
    hostilityLabel: r.hostility_level !== "none" ? r.hostility_level : undefined,
    overviewText: r.overview || undefined,
  }));
}

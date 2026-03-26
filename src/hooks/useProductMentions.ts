import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCTS, type Product } from "@/lib/products";

export interface ProductMention {
  id: string;
  name: string;
  category: Product["category"];
  totalComments: number;
  totalLikes: number;
  postCount: number;
  firstTextTerm: string;
}

interface UseProductMentionsOpts {
  platform: "tiktok" | "instagram" | "youtube" | "all";
  account?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Find product matches from posts tables (lightweight — posts tables are small).
 * YouTube is skipped from post scanning (youtube_data is too large).
 * Returns product → post_ids mapping per platform.
 */
async function findProductPostIds(
  platform: "tiktok" | "instagram" | "youtube" | "all",
  account?: string,
  dateFrom?: string,
  dateTo?: string,
): Promise<{
  tiktok: Map<string, Set<string>>;
  instagram: Map<string, Set<string>>;
}> {
  const result = {
    tiktok: new Map<string, Set<string>>(),
    instagram: new Map<string, Set<string>>(),
  };

  const fetchPosts = async (
    table: string,
    selectCols: string,
    textCol: string,
    idCol: string,
    dateCol: string,
    accountCol: string,
    platformKey: "tiktok" | "instagram",
  ) => {
    let q = (supabase as any)
      .from(table)
      .select(selectCols);
    if (account) q = q.eq(accountCol, account);
    if (dateFrom) q = q.gte(dateCol, dateFrom);
    if (dateTo) q = q.lte(dateCol, dateTo);
    const { data, error } = await q;
    if (error) throw error;

    const seenIds = new Set<string>();
    for (const row of data || []) {
      const postId = row[idCol];
      if (!postId || seenIds.has(postId)) continue;
      seenIds.add(postId);

      const text = row[textCol] || "";
      if (!text) continue;

      for (const product of PRODUCTS) {
        const matched =
          product.hashtags.some(h => text.includes(h) || text.includes(`#${h}`)) ||
          product.textTerms.some(t => text.includes(t));

        if (matched) {
          if (!result[platformKey].has(product.id)) {
            result[platformKey].set(product.id, new Set());
          }
          result[platformKey].get(product.id)!.add(postId);
        }
      }
    }
  };

  // Sequential fetches to avoid connection pool exhaustion
  if (platform === "tiktok" || platform === "all") {
    await fetchPosts(
      "tiktok_posts", "post_id, post_description",
      "post_description", "post_id", "post_create_time", "account_username", "tiktok",
    );
  }

  if (platform === "instagram" || platform === "all") {
    await fetchPosts(
      "instagram_posts", "post_id, post_caption",
      "post_caption", "post_id", "post_timestamp", "account_username", "instagram",
    );
  }

  return result;
}

/**
 * Count actual comments for matching post_ids.
 * Uses HEAD-only COUNT queries — fast and accurate.
 */
async function countCommentsForProducts(
  postIdsByPlatform: {
    tiktok: Map<string, Set<string>>;
    instagram: Map<string, Set<string>>;
  },
  dateFrom?: string,
  dateTo?: string,
): Promise<ProductMention[]> {
  const allProductIds = new Set<string>();
  for (const map of [postIdsByPlatform.tiktok, postIdsByPlatform.instagram]) {
    for (const pid of map.keys()) allProductIds.add(pid);
  }

  const results: ProductMention[] = [];

  // Process sequentially to avoid connection exhaustion
  for (const productId of allProductIds) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) continue;

    const ttIds = postIdsByPlatform.tiktok.get(productId);
    const igIds = postIdsByPlatform.instagram.get(productId);
    const postCount = (ttIds?.size || 0) + (igIds?.size || 0);

    let totalComments = 0;

    // TikTok count
    if (ttIds && ttIds.size > 0) {
      let q = (supabase as any)
        .from("tiktok_comments")
        .select("comment_cid", { count: "exact", head: true })
        .in("post_id", [...ttIds]);
      if (dateFrom) q = q.gte("comment_create_time_iso", dateFrom);
      if (dateTo) q = q.lte("comment_create_time_iso", dateTo);
      const { count } = await q;
      totalComments += count || 0;
    }

    // Instagram count
    if (igIds && igIds.size > 0) {
      let q = (supabase as any)
        .from("instagram_comments")
        .select("comment_id", { count: "exact", head: true })
        .in("post_id", [...igIds]);
      if (dateFrom) q = q.gte("comment_timestamp", dateFrom);
      if (dateTo) q = q.lte("comment_timestamp", dateTo);
      const { count } = await q;
      totalComments += count || 0;
    }

    if (totalComments > 0) {
      results.push({
        id: product.id,
        name: product.name,
        category: product.category,
        totalComments,
        totalLikes: 0,
        postCount,
        firstTextTerm: product.textTerms[0] || product.name,
      });
    }
  }

  return results.sort((a, b) => b.totalComments - a.totalComments);
}

export function useProductMentions(opts: UseProductMentionsOpts) {
  const { platform, account, dateFrom, dateTo } = opts;

  return useQuery<ProductMention[]>({
    queryKey: ["product-mentions", platform, account, dateFrom, dateTo],
    queryFn: async () => {
      const postIdsByPlatform = await findProductPostIds(platform, account, dateFrom, dateTo);
      return countCommentsForProducts(postIdsByPlatform, dateFrom, dateTo);
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    retry: 2,
    retryDelay: 1000,
  });
}

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCTS } from "@/lib/products";

interface Opts {
  productId?: string;
  platform: "tiktok" | "instagram" | "youtube";
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Resolves a product ID to matching post_ids for a specific platform.
 * Used by platform pages to handle "product" drawer filter.
 */
export function useProductPostIds(opts: Opts) {
  const { productId, platform, dateFrom, dateTo } = opts;

  return useQuery<string[]>({
    queryKey: ["product-post-ids", productId, platform, dateFrom, dateTo],
    enabled: !!productId,
    queryFn: async () => {
      const product = PRODUCTS.find(p => p.id === productId);
      if (!product) return [];

      const allTerms = [...product.textTerms, ...product.hashtags];
      if (allTerms.length === 0) return [];

      const config = {
        tiktok: { table: "tiktok_posts", textCol: "post_description", idCol: "post_id", dateCol: "post_create_time", accountCol: "account_username" },
        instagram: { table: "instagram_posts", textCol: "post_caption", idCol: "post_id", dateCol: "post_timestamp", accountCol: "account_username" },
        youtube: { table: "youtube_data", textCol: "video_title", idCol: "video_id", dateCol: "comment_published_at", accountCol: "account_name" },
      }[platform];

      const ids = new Set<string>();

      for (const term of allTerms) {
        let q = (supabase as any)
          .from(config.table)
          .select(config.idCol)
          .ilike(config.textCol, `%${term}%`)
          .limit(200);
        if (dateFrom) q = q.gte(config.dateCol, dateFrom);
        if (dateTo) q = q.lte(config.dateCol, dateTo);
        const { data } = await q;
        for (const r of data || []) {
          const id = r[config.idCol];
          if (id) ids.add(id);
        }
      }

      return [...ids];
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    retry: 2,
    retryDelay: 1000,
  });
}

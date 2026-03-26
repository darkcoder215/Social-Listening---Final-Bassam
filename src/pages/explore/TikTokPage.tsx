import { useState, useCallback } from "react";
import { useDateRange } from "@/contexts/DateRangeContext";
import PlatformPage from "./PlatformPage";
import {
  useTikTokStats,
  useTikTokComments,
  useTikTokCommentsPerDay,
  useTikTokTopPosts,
  useTikTokPostsPerDay,
  useTikTokCommentsPerAccount,
} from "@/hooks/useTikTokData";
import type { CommentSort } from "@/components/explore/CommentsPanel";
import type { DrawerSort } from "@/components/explore/CommentsDrawer";
import type { DrawerFilter } from "@/lib/db-types";
import { TIKTOK_ACCOUNTS } from "@/lib/db-types";
import { TikTokIcon } from "@/components/icons/PlatformIcons";
import { useCommentTexts } from "@/hooks/useCommentTexts";
import { useProductMentions } from "@/hooks/useProductMentions";
import { useProductPostIds } from "@/hooks/useProductPostIds";
import { useSentimentData } from "@/hooks/useSentimentData";

export default function TikTokPage() {
  const { dateRange } = useDateRange();
  const [account, setAccount] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<CommentSort>("newest");
  const [drawerFilter, setDrawerFilter] = useState<DrawerFilter | null>(null);
  const [drawerSort, setDrawerSort] = useState<DrawerSort>("newest");

  // Debounce search
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = useCallback((v: string) => {
    setSearch(v);
    if (timer) clearTimeout(timer);
    setTimer(setTimeout(() => setDebouncedSearch(v), 400));
  }, [timer]);

  const qOpts = { account: account || undefined, dateFrom: dateRange.from, dateTo: dateRange.to };

  // Stats
  const { data: stats, isLoading: statsLoading } = useTikTokStats(qOpts);

  // Comments
  const commentsQ = useTikTokComments({
    ...qOpts,
    search: debouncedSearch || undefined,
    sort,
  });

  // Charts
  const { data: commentsPerDay } = useTikTokCommentsPerDay(qOpts);
  const { data: topPosts } = useTikTokTopPosts(qOpts);
  const { data: postsPerDay } = useTikTokPostsPerDay(qOpts);
  const { data: commentsPerAccount } = useTikTokCommentsPerAccount({
    dateFrom: dateRange.from,
    dateTo: dateRange.to,
  });

  // Comment texts for word cloud
  const { data: commentTexts, isLoading: commentTextsLoading } = useCommentTexts({
    platform: "tiktok", account: qOpts.account, dateFrom: qOpts.dateFrom, dateTo: qOpts.dateTo,
  });

  // Product mentions
  const { data: productMentions, isLoading: productMentionsLoading } = useProductMentions({
    platform: "tiktok", account: qOpts.account, dateFrom: qOpts.dateFrom, dateTo: qOpts.dateTo,
  });

  // Sentiment analysis (TikTok only)
  const { data: sentimentData, isLoading: sentimentLoading } = useSentimentData();

  // Product → post_ids resolution for drawer
  const { data: productPostIds } = useProductPostIds({
    productId: drawerFilter?.type === "product" ? drawerFilter.productId : undefined,
    platform: "tiktok",
    dateFrom: dateRange.from,
    dateTo: dateRange.to,
  });

  // Drawer comments
  const drawerQ = useTikTokComments({
    ...qOpts,
    sort: drawerSort as CommentSort,
    filterDate: drawerFilter?.type === "date" ? drawerFilter.date : undefined,
    filterPostId: drawerFilter?.type === "post" ? drawerFilter.postId : undefined,
    filterPostIds: drawerFilter?.type === "product" ? productPostIds : undefined,
    account: drawerFilter?.type === "account" ? drawerFilter.account : qOpts.account,
    search: drawerFilter?.type === "word" ? drawerFilter.word : undefined,
    enabled: !!drawerFilter && (drawerFilter.type !== "product" || !!productPostIds),
  });

  return (
    <PlatformPage
      platform="tiktok"
      icon={TikTokIcon as any}
      accounts={TIKTOK_ACCOUNTS}
      stats={stats}
      statsLoading={statsLoading}
      commentsResult={commentsQ.data}
      commentsLoading={commentsQ.isLoading}
      commentsFetchingMore={commentsQ.isFetchingNextPage}
      commentsHasMore={!!commentsQ.hasNextPage}
      fetchMoreComments={() => commentsQ.fetchNextPage()}
      commentsPerDay={commentsPerDay}
      topPosts={topPosts}
      postsPerDay={postsPerDay}
      commentsPerAccount={commentsPerAccount}
      chartsLoading={false}
      account={account}
      onAccountChange={setAccount}
      search={search}
      onSearchChange={handleSearch}
      sort={sort}
      onSortChange={setSort}
      drawerComments={drawerQ.data}
      drawerLoading={drawerQ.isLoading}
      drawerHasMore={!!drawerQ.hasNextPage}
      drawerFetchingMore={drawerQ.isFetchingNextPage}
      onDrawerLoadMore={() => drawerQ.fetchNextPage()}
      drawerFilter={drawerFilter}
      onDrawerFilterChange={setDrawerFilter}
      drawerSort={drawerSort}
      onDrawerSortChange={setDrawerSort}
      drawerError={drawerQ.error}
      onDrawerRetry={() => drawerQ.refetch()}
      commentTexts={commentTexts}
      commentTextsLoading={commentTextsLoading}
      productMentions={productMentions}
      productMentionsLoading={productMentionsLoading}
      sentimentData={sentimentData}
      sentimentLoading={sentimentLoading}
    />
  );
}

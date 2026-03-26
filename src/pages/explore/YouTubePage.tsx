import { useState, useCallback } from "react";
import { useDateRange } from "@/contexts/DateRangeContext";
import PlatformPage from "./PlatformPage";
import {
  useYouTubeStats,
  useYouTubeComments,
  useYouTubeCommentsPerDay,
  useYouTubeTopPosts,
  useYouTubeCommentsPerAccount,
} from "@/hooks/useYouTubeData";
import type { CommentSort } from "@/components/explore/CommentsPanel";
import type { DrawerSort } from "@/components/explore/CommentsDrawer";
import type { DrawerFilter } from "@/lib/db-types";
import { YOUTUBE_ACCOUNTS } from "@/lib/db-types";
import { YouTubeIcon } from "@/components/icons/PlatformIcons";
import { useCommentTexts } from "@/hooks/useCommentTexts";
import { useProductMentions } from "@/hooks/useProductMentions";
import { useProductPostIds } from "@/hooks/useProductPostIds";

export default function YouTubePage() {
  const { dateRange } = useDateRange();
  const [account, setAccount] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<CommentSort>("newest");
  const [drawerFilter, setDrawerFilter] = useState<DrawerFilter | null>(null);
  const [drawerSort, setDrawerSort] = useState<DrawerSort>("newest");

  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = useCallback((v: string) => {
    setSearch(v);
    if (timer) clearTimeout(timer);
    setTimer(setTimeout(() => setDebouncedSearch(v), 400));
  }, [timer]);

  const qOpts = { account: account || undefined, dateFrom: dateRange.from, dateTo: dateRange.to };

  const { data: stats, isLoading: statsLoading } = useYouTubeStats(qOpts);

  const commentsQ = useYouTubeComments({
    ...qOpts,
    search: debouncedSearch || undefined,
    sort,
  });

  const { data: commentsPerDay } = useYouTubeCommentsPerDay(qOpts);
  const { data: topPosts } = useYouTubeTopPosts(qOpts);
  const { data: commentsPerAccount } = useYouTubeCommentsPerAccount({
    dateFrom: dateRange.from,
    dateTo: dateRange.to,
  });

  // Comment texts for word cloud
  const { data: commentTexts, isLoading: commentTextsLoading } = useCommentTexts({
    platform: "youtube", account: qOpts.account, dateFrom: qOpts.dateFrom, dateTo: qOpts.dateTo,
  });

  // Product mentions
  const { data: productMentions, isLoading: productMentionsLoading } = useProductMentions({
    platform: "youtube", account: qOpts.account, dateFrom: qOpts.dateFrom, dateTo: qOpts.dateTo,
  });

  // Product → post_ids resolution for drawer
  const { data: productPostIds } = useProductPostIds({
    productId: drawerFilter?.type === "product" ? drawerFilter.productId : undefined,
    platform: "youtube",
    dateFrom: dateRange.from,
    dateTo: dateRange.to,
  });

  const drawerQ = useYouTubeComments({
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
      platform="youtube"
      icon={YouTubeIcon as any}
      accounts={YOUTUBE_ACCOUNTS}
      stats={stats}
      statsLoading={statsLoading}
      commentsResult={commentsQ.data}
      commentsLoading={commentsQ.isLoading}
      commentsFetchingMore={commentsQ.isFetchingNextPage}
      commentsHasMore={!!commentsQ.hasNextPage}
      fetchMoreComments={() => commentsQ.fetchNextPage()}
      commentsPerDay={commentsPerDay}
      topPosts={topPosts}
      postsPerDay={undefined}
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
    />
  );
}

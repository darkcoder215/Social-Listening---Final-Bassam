import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MessageCircle, 
  Heart, 
  Video,
  BarChart3,
  Users,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { SiTiktok } from "react-icons/si";
import { Link, useRoute } from "wouter";
import { getAccountLogo } from "@/lib/accountLogos";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { DateRangeFilter, isDateInRange, useDateRange } from "@/components/DateRangeFilter";
import { CommentsSidebar, CommentItem } from "@/components/CommentsSidebar";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

// Account colors for multi-line chart
const ACCOUNT_COLORS: Record<string, string> = {
  "ثمانية": "#000000",
  "رياضة ثمانية": "#22c55e",
  "معيشة ثمانية": "#3b82f6",
  "مخرج ثمانية": "#eab308",
  "إذاعة ثمانية": "#f97316",
};

function safeFormatDate(dateStr: string | undefined | null, formatStr: string = "d MMM yyyy"): string | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return format(d, formatStr, { locale: ar });
  } catch {
    return null;
  }
}

interface TikTokComment {
  accountNameAr: string;
  accountUsername: string;
  postUrl: string;
  postId: string;
  postDescription: string;
  commentCid: string;
  commentText: string;
  commentCreateTimeIso: string;
  commentDiggCount: number;
  commentUniqueId: string;
  commentAvatarThumbnail: string;
}

interface TikTokStats {
  totalComments: number;
  totalLikes: number;
  timeline: { date: string; count: number }[];
  accountTimeline: Record<string, number>[]; // For multi-line chart: { date, "ثمانية": 10, "رياضة ثمانية": 5 }
}

interface AccountSummary {
  username: string;
  nameAr: string;
  totalComments: number;
  totalVideos: number;
  totalLikes: number;
}

interface TikTokData {
  accounts: AccountSummary[];
  stats: TikTokStats;
  comments: TikTokComment[];
}

interface VideoComment {
  cid: string;
  text: string;
  createTime: string;
  likes: number;
  username: string;
  avatar: string;
}

interface TikTokVideo {
  postId: string;
  postUrl: string;
  postDescription: string;
  postCreateTime: string;
  postLikeCount: number;
  postCommentCount: number;
  comments: VideoComment[];
}

interface PaginationInfo {
  total: number;
  pageSize: number;
  hasMore: boolean;
  nextCursor: string | null;
}

interface AccountDetailData {
  username: string;
  nameAr: string;
  videos: TikTokVideo[];
  stats: TikTokStats;
  comments: TikTokComment[];
  pagination?: PaginationInfo;
}

export default function TikTok() {
  const [isAccountPage, params] = useRoute("/tiktok/:username");
  const username = params?.username;

  if (isAccountPage && username) {
    return <TikTokAccountDetail username={username} />;
  }

  return <TikTokOverview />;
}

function TikTokOverview() {
  const { dateRange, setDateRange } = useDateRange();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Build API URL with date params for server-side filtering
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (dateRange?.from) {
      params.set('startDate', dateRange.from.toISOString().split('T')[0]);
    }
    if (dateRange?.to) {
      params.set('endDate', dateRange.to.toISOString().split('T')[0]);
    }
    return `/api/sheets/tiktok${params.toString() ? '?' + params.toString() : ''}`;
  }, [dateRange]);

  const { data, isLoading, refetch } = useQuery<TikTokData>({
    queryKey: ["/api/sheets/tiktok", dateRange?.from?.toISOString(), dateRange?.to?.toISOString()],
    queryFn: async () => {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  const filteredData = useMemo(() => {
    if (!data) return null;
    
    // Data is already filtered by server
    const filteredComments = data.comments || [];

    // Build stats from filtered comments
    const accountStats: Record<string, { totalComments: number; totalVideos: number; totalLikes: number }> = {};
    const videoSet = new Set<string>();
    
    filteredComments.forEach(c => {
      if (!accountStats[c.accountUsername]) {
        accountStats[c.accountUsername] = { totalComments: 0, totalVideos: 0, totalLikes: 0 };
      }
      accountStats[c.accountUsername].totalComments++;
      accountStats[c.accountUsername].totalLikes += c.commentDiggCount;
      videoSet.add(`${c.accountUsername}:${c.postId}`);
    });

    // Use predefined accounts from API and merge with filtered stats
    const accounts: AccountSummary[] = (data.accounts || []).map(acc => {
      const stats = accountStats[acc.username] || { totalComments: 0, totalVideos: 0, totalLikes: 0 };
      const videoCount = Array.from(videoSet).filter(v => v.startsWith(acc.username + ':')).length;
      return {
        username: acc.username,
        nameAr: acc.nameAr,
        totalComments: stats.totalComments,
        totalVideos: videoCount,
        totalLikes: stats.totalLikes,
      };
    });

    const dateGroups: Record<string, number> = {};
    const accountDateGroups: Record<string, Record<string, number>> = {};
    
    filteredComments.forEach(c => {
      const date = c.commentCreateTimeIso?.split('T')[0];
      if (date) {
        dateGroups[date] = (dateGroups[date] || 0) + 1;
        if (!accountDateGroups[date]) accountDateGroups[date] = {};
        const accountName = c.accountNameAr || c.accountUsername;
        accountDateGroups[date][accountName] = (accountDateGroups[date][accountName] || 0) + 1;
      }
    });

    const timeline = Object.entries(dateGroups)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Create account timeline for multi-line chart
    const accountNames = accounts.map(a => a.nameAr);
    const accountTimeline = Object.entries(accountDateGroups)
      .map(([date, counts]) => {
        const entry: Record<string, any> = { date };
        accountNames.forEach(name => {
          entry[name] = counts[name] || 0;
        });
        return entry;
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      accounts,
      stats: {
        totalComments: filteredComments.length,
        totalLikes: filteredComments.reduce((sum, c) => sum + c.commentDiggCount, 0),
        timeline,
        accountTimeline,
      },
      comments: filteredComments,
    };
  }, [data, dateRange]);

  // Date-specific query for sidebar comments
  const { data: dateSpecificData, isLoading: isLoadingDateData } = useQuery<TikTokData>({
    queryKey: ["/api/sheets/tiktok", "date-specific", selectedDate],
    queryFn: async () => {
      if (!selectedDate) return { accounts: [], stats: { totalComments: 0, totalLikes: 0, timeline: [], accountTimeline: [] }, comments: [] };
      const res = await fetch(`/api/sheets/tiktok?startDate=${selectedDate}&endDate=${selectedDate}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    enabled: sidebarOpen && !!selectedDate,
  });

  const sidebarComments = useMemo<CommentItem[]>(() => {
    if (!selectedDate) return [];
    const commentsSource = dateSpecificData?.comments || filteredData?.comments || [];
    return commentsSource
      .filter(c => c.commentCreateTimeIso?.startsWith(selectedDate))
      .map(c => ({
        platform: "tiktok" as const,
        accountName: c.accountNameAr,
        text: c.commentText,
        timestamp: c.commentCreateTimeIso,
        username: c.commentUniqueId,
        likeCount: c.commentDiggCount,
        originalUrl: c.postUrl,
        profileThumbnail: c.commentAvatarThumbnail,
      }));
  }, [selectedDate, dateSpecificData, filteredData]);

  const handleDotClick = (payload: any) => {
    if (payload?.payload?.originalDate) {
      setSelectedDate(payload.payload.originalDate);
      setSidebarOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-black dark:bg-white">
            <SiTiktok className="h-6 w-6 text-white dark:text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">تيك توك</h1>
            <p className="text-muted-foreground">تحليل تعليقات حسابات ثمانية</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const accounts = filteredData?.accounts || [];
  const stats = filteredData?.stats;
  const totalComments = stats?.totalComments || 0;
  const totalLikes = stats?.totalLikes || 0;
  const totalVideos = accounts.reduce((sum, a) => sum + a.totalVideos, 0);
  const accountNames = accounts.map(a => a.nameAr);

  // Multi-line chart data with each account as a separate line
  const trendData = (stats?.accountTimeline || []).map(t => {
    const formatted = safeFormatDate(t.date as string, "MM/dd");
    if (!formatted) return null;
    const entry: Record<string, any> = { date: formatted, originalDate: t.date };
    accountNames.forEach(name => {
      entry[name] = t[name] || 0;
    });
    return entry;
  }).filter((t): t is Record<string, any> => t !== null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-black dark:bg-white">
            <SiTiktok className="h-6 w-6 text-white dark:text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">تيك توك</h1>
            <p className="text-muted-foreground">تحليل تعليقات حسابات ثمانية</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            data-testid="button-refresh-tiktok"
          >
            <RefreshCw className="h-4 w-4 ml-1" />
            تحديث
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm">إجمالي التعليقات</span>
            </div>
            <p className="text-2xl font-bold" data-testid="text-total-comments">
              {totalComments.toLocaleString("ar-SA")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Heart className="h-4 w-4" />
              <span className="text-sm">إجمالي الإعجابات</span>
            </div>
            <p className="text-2xl font-bold" data-testid="text-total-likes">
              {totalLikes.toLocaleString("ar-SA")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Video className="h-4 w-4" />
              <span className="text-sm">إجمالي الفيديوهات</span>
            </div>
            <p className="text-2xl font-bold" data-testid="text-total-videos">
              {totalVideos.toLocaleString("ar-SA")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Users className="h-4 w-4" />
              <span className="text-sm">الحسابات المتابعة</span>
            </div>
            <p className="text-2xl font-bold" data-testid="text-total-accounts">
              {accounts.length.toLocaleString("ar-SA")}
            </p>
          </CardContent>
        </Card>
      </div>

      {trendData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              التعليقات عبر الزمن (اضغط على يوم لعرض التفاصيل)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] cursor-pointer">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      direction: 'rtl'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '10px', direction: 'rtl' }}
                  />
                  {accountNames.map((name) => (
                    <Line 
                      key={name}
                      type="monotone" 
                      dataKey={name}
                      stroke={ACCOUNT_COLORS[name] || '#888888'}
                      strokeWidth={2}
                      dot={{ r: 3, cursor: "pointer", onClick: (e: any, payload: any) => handleDotClick(payload) }}
                      activeDot={{ r: 5, cursor: "pointer", onClick: (e: any, payload: any) => handleDotClick(payload) }}
                      name={name}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            الحسابات المتابعة
          </CardTitle>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <SiTiktok className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد بيانات في هذه الفترة</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {accounts.map((account) => (
                <Link
                  key={account.username}
                  href={`/tiktok/${account.username}`}
                  data-testid={`link-account-${account.username}`}
                >
                  <Card className="hover-elevate cursor-pointer transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={getAccountLogo(account.username || account.nameAr)} alt={account.nameAr} />
                          <AvatarFallback className="bg-black dark:bg-white">
                            <SiTiktok className="h-4 w-4 text-white dark:text-black" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{account.nameAr}</p>
                          <p className="text-sm text-muted-foreground truncate">@{account.username}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div>
                          <p className="font-bold">{account.totalComments.toLocaleString("ar-SA")}</p>
                          <p className="text-xs text-muted-foreground">تعليق</p>
                        </div>
                        <div>
                          <p className="font-bold">{account.totalVideos.toLocaleString("ar-SA")}</p>
                          <p className="text-xs text-muted-foreground">فيديو</p>
                        </div>
                        <div>
                          <p className="font-bold">{account.totalLikes.toLocaleString("ar-SA")}</p>
                          <p className="text-xs text-muted-foreground">إعجاب</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CommentsSidebar
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        selectedDate={selectedDate}
        comments={sidebarComments}
        isLoading={isLoadingDateData}
      />
    </div>
  );
}

function TikTokAccountDetail({ username }: { username: string }) {
  const { dateRange, setDateRange } = useDateRange();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [allComments, setAllComments] = useState<TikTokComment[]>([]);
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Build API URL with date params for server-side filtering
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (dateRange?.from) {
      params.set('startDate', dateRange.from.toISOString().split('T')[0]);
    }
    if (dateRange?.to) {
      params.set('endDate', dateRange.to.toISOString().split('T')[0]);
    }
    return `/api/sheets/tiktok/${username}${params.toString() ? '?' + params.toString() : ''}`;
  }, [username, dateRange]);

  const { data, isLoading } = useQuery<AccountDetailData>({
    queryKey: ["/api/sheets/tiktok", username, dateRange?.from?.toISOString(), dateRange?.to?.toISOString()],
    queryFn: async () => {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  // Reset pagination state when data or dateRange changes
  useEffect(() => {
    if (data) {
      setAllComments(data.comments || []);
      setCurrentCursor((data as any).pagination?.nextCursor || null);
      setHasMore((data as any).pagination?.hasMore || false);
    }
  }, [data, dateRange?.from?.toISOString(), dateRange?.to?.toISOString()]);

  // Load more function for pagination
  const loadMore = async () => {
    if (!currentCursor || isLoadingMore) return;
    
    setIsLoadingMore(true);
    try {
      const params = new URLSearchParams();
      if (dateRange?.from) {
        params.set('startDate', dateRange.from.toISOString().split('T')[0]);
      }
      if (dateRange?.to) {
        params.set('endDate', dateRange.to.toISOString().split('T')[0]);
      }
      params.set('cursor', currentCursor);
      
      const response = await fetch(`/api/sheets/tiktok/${username}?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch more');
      
      const moreData: AccountDetailData = await response.json();
      
      setAllComments(prev => [...prev, ...(moreData.comments || [])]);
      setCurrentCursor(moreData.pagination?.nextCursor || null);
      setHasMore(moreData.pagination?.hasMore || false);
    } catch (error) {
      console.error('Error loading more:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const filteredData = useMemo(() => {
    if (!data) return null;
    
    // Use all accumulated comments (includes paginated data), apply date filter for safety
    const filteredComments = allComments.filter(c => isDateInRange(c.commentCreateTimeIso, dateRange));

    const dateGroups: Record<string, number> = {};
    filteredComments.forEach(c => {
      const date = c.commentCreateTimeIso?.split('T')[0];
      if (date) dateGroups[date] = (dateGroups[date] || 0) + 1;
    });

    const timeline = Object.entries(dateGroups)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const videoMap: Record<string, TikTokVideo> = {};
    filteredComments.forEach(c => {
      if (!videoMap[c.postId]) {
        videoMap[c.postId] = {
          postId: c.postId,
          postUrl: c.postUrl,
          postDescription: c.postDescription,
          postCreateTime: "",
          postLikeCount: 0,
          postCommentCount: 0,
          comments: [],
        };
      }
      videoMap[c.postId].comments.push({
        cid: c.commentCid,
        text: c.commentText,
        createTime: c.commentCreateTimeIso,
        likes: c.commentDiggCount,
        username: c.commentUniqueId,
        avatar: c.commentAvatarThumbnail,
      });
    });

    return {
      ...data,
      videos: Object.values(videoMap),
      stats: {
        totalComments: filteredComments.length,
        totalLikes: filteredComments.reduce((sum, c) => sum + c.commentDiggCount, 0),
        timeline,
      },
      comments: filteredComments,
    };
  }, [data, allComments, dateRange]);

  // Compute most-commented video and latest video
  const { mostCommentedVideo, latestVideo } = useMemo(() => {
    const videos = filteredData?.videos || [];
    if (videos.length === 0) return { mostCommentedVideo: null, latestVideo: null };
    
    // Most commented video
    const mostCommented = videos.reduce((max, v) => 
      v.comments.length > (max?.comments.length || 0) ? v : max
    , videos[0]);
    
    // Latest video by comment date
    const latestByComment = videos.reduce((latest, v) => {
      const vLatestComment = v.comments.reduce((lc, c) => 
        c.createTime > (lc?.createTime || '') ? c : lc
      , v.comments[0]);
      const latestLatestComment = latest?.comments.reduce((lc, c) => 
        c.createTime > (lc?.createTime || '') ? c : lc
      , latest?.comments[0]);
      return (vLatestComment?.createTime || '') > (latestLatestComment?.createTime || '') ? v : latest;
    }, videos[0]);
    
    return { mostCommentedVideo: mostCommented, latestVideo: latestByComment };
  }, [filteredData?.videos]);

  // Date-specific query for sidebar comments
  const { data: dateSpecificData, isLoading: isLoadingDateData } = useQuery<AccountDetailData>({
    queryKey: ["/api/sheets/tiktok", username, "date-specific", selectedDate],
    queryFn: async () => {
      if (!selectedDate) return { username: "", nameAr: "", videos: [], stats: { totalComments: 0, totalLikes: 0, timeline: [], accountTimeline: [] }, comments: [] };
      const res = await fetch(`/api/sheets/tiktok/${username}?startDate=${selectedDate}&endDate=${selectedDate}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    enabled: sidebarOpen && !!selectedDate,
  });

  const sidebarComments = useMemo<CommentItem[]>(() => {
    if (!selectedDate) return [];
    const commentsSource = dateSpecificData?.comments || filteredData?.comments || [];
    const accountName = filteredData?.nameAr || username;
    return commentsSource
      .filter(c => c.commentCreateTimeIso?.startsWith(selectedDate))
      .map(c => ({
        platform: "tiktok" as const,
        accountName,
        text: c.commentText,
        timestamp: c.commentCreateTimeIso,
        username: c.commentUniqueId,
        likeCount: c.commentDiggCount,
        originalUrl: c.postUrl,
        profileThumbnail: c.commentAvatarThumbnail,
      }));
  }, [selectedDate, dateSpecificData, filteredData, username]);

  const handleDotClick = (payload: any) => {
    if (payload?.payload?.originalDate) {
      setSelectedDate(payload.payload.originalDate);
      setSidebarOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const videos = filteredData?.videos || [];
  const stats = filteredData?.stats;
  const nameAr = filteredData?.nameAr || username;

  const trendData = (stats?.timeline || []).map(t => {
    const formatted = safeFormatDate(t.date, "MM/dd");
    return formatted ? { date: formatted, count: t.count, originalDate: t.date } : null;
  }).filter((t): t is { date: string; count: number; originalDate: string } => t !== null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/tiktok">
            <Button variant="ghost" size="sm">
              ← العودة
            </Button>
          </Link>
          <div className="p-2 rounded-full bg-black dark:bg-white">
            <SiTiktok className="h-6 w-6 text-white dark:text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{nameAr}</h1>
            <p className="text-muted-foreground">@{username}</p>
          </div>
        </div>
        <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm">التعليقات</span>
            </div>
            <p className="text-2xl font-bold">
              {(stats?.totalComments || 0).toLocaleString("ar-SA")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Heart className="h-4 w-4" />
              <span className="text-sm">الإعجابات</span>
            </div>
            <p className="text-2xl font-bold">
              {(stats?.totalLikes || 0).toLocaleString("ar-SA")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Video className="h-4 w-4" />
              <span className="text-sm">الفيديوهات</span>
            </div>
            <p className="text-2xl font-bold">
              {videos.length.toLocaleString("ar-SA")}
            </p>
          </CardContent>
        </Card>
      </div>

      {(mostCommentedVideo || latestVideo) && (
        <div className="grid gap-4 md:grid-cols-2">
          {mostCommentedVideo && (
            <Card data-testid="card-most-commented-video">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  الفيديو الأكثر تعليقاً
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="min-w-0">
                  <p className="font-medium line-clamp-2 text-sm" data-testid="text-most-commented-title">
                    {mostCommentedVideo.postDescription || "فيديو"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1" data-testid="text-most-commented-count">
                    {mostCommentedVideo.comments.length.toLocaleString("ar-SA")} تعليق
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          {latestVideo && (
            <Card data-testid="card-latest-video">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  أحدث نشاط
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="min-w-0">
                  <p className="font-medium line-clamp-2 text-sm" data-testid="text-latest-video-title">
                    {latestVideo.postDescription || "فيديو"}
                  </p>
                  {latestVideo.comments[0]?.createTime && (
                    <p className="text-sm text-muted-foreground mt-1" data-testid="text-latest-video-date">
                      آخر تعليق: {safeFormatDate(latestVideo.comments[0].createTime, "d MMM yyyy")}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {trendData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">نشاط التعليقات (اضغط على يوم لعرض التفاصيل)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 cursor-pointer">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 4, cursor: "pointer", onClick: (e: any, payload: any) => handleDotClick(payload) }}
                    activeDot={{ r: 6, cursor: "pointer", onClick: (e: any, payload: any) => handleDotClick(payload) }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">الفيديوهات ({videos.length})</h2>
        {videos.map((video) => (
          <Card key={video.postId}>
            <CardHeader className="pb-2">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm line-clamp-2">{video.postDescription || "فيديو"}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {video.comments.length} تعليق
                  </p>
                </div>
                <a
                  href={video.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0"
                >
                  <Button variant="ghost" size="icon">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {video.comments.slice(0, 5).map((comment) => (
                  <div key={comment.cid} className="flex gap-3 p-3 rounded-md bg-muted/50">
                    <Avatar className="h-8 w-8">
                      {comment.avatar && (
                        <AvatarImage src={comment.avatar} alt={comment.username} />
                      )}
                      <AvatarFallback>{comment.username[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm">@{comment.username}</span>
                      <p className="text-sm mt-1">{comment.text}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {comment.likes}
                        </span>
                        {safeFormatDate(comment.createTime, "d MMM") && (
                          <span>{safeFormatDate(comment.createTime, "d MMM")}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {video.comments.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center">
                    +{video.comments.length - 5} تعليقات أخرى
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {hasMore && (
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              onClick={loadMore}
              disabled={isLoadingMore}
              data-testid="button-load-more"
            >
              {isLoadingMore ? (
                <>
                  <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
                  جاري التحميل...
                </>
              ) : (
                "تحميل المزيد"
              )}
            </Button>
          </div>
        )}
      </div>

      <CommentsSidebar
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        selectedDate={selectedDate}
        comments={sidebarComments}
        isLoading={isLoadingDateData}
      />
    </div>
  );
}

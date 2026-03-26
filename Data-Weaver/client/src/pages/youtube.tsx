import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MessageCircle, 
  ThumbsUp, 
  Play,
  Eye,
  BarChart3,
  Users,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { SiYoutube } from "react-icons/si";
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

// Channel colors for multi-line chart
const CHANNEL_COLORS: Record<string, string> = {
  "ثمانية": "#000000",
  "رياضة ثمانية": "#22c55e",
  "شركة ثمانية": "#3b82f6",
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

interface YouTubeComment {
  platform: string;
  accountName: string;
  accountChannelId: string;
  videoId: string;
  videoTitle: string;
  videoUrl: string;
  videoThumbnailUrl: string;
  commentId: string;
  commentText: string;
  commentPublishedAt: string;
  commentLikeCount: number;
  authorDisplayName: string;
  authorChannelUrl: string;
  authorThumbnailUrl?: string;
}

interface YouTubeStats {
  totalComments: number;
  totalLikes: number;
  timeline: { date: string; count: number }[];
  channelTimeline: Record<string, number>[];
}

interface ChannelSummary {
  channelId: string;
  name: string;
  totalComments: number;
  totalVideos: number;
  totalLikes: number;
}

interface YouTubeData {
  channels: ChannelSummary[];
  stats: YouTubeStats;
  comments: YouTubeComment[];
}

interface VideoComment {
  id: string;
  text: string;
  publishedAt: string;
  likeCount: number;
  authorDisplayName: string;
  authorThumbnailUrl?: string;
  commentType: string;
}

interface Video {
  videoId: string;
  videoTitle: string;
  videoDescription: string;
  videoPublishedAt: string;
  videoUrl: string;
  videoThumbnailUrl: string;
  videoLikeCount: number;
  videoViewCount: number;
  videoCommentCount: number;
  videoDuration: string;
  comments: VideoComment[];
}

interface PaginationInfo {
  total: number;
  pageSize: number;
  hasMore: boolean;
  nextCursor: string | null;
}

interface MostLikedComment {
  commentId: string;
  commentText: string;
  commentLikeCount: number;
  authorDisplayName: string;
  commentPublishedAt: string;
  video: {
    videoId: string;
    videoTitle: string;
    videoUrl: string;
    videoThumbnailUrl: string;
  };
}

interface MostCommentedVideo {
  videoId: string;
  videoTitle: string;
  videoUrl: string;
  videoThumbnailUrl: string;
  commentCount: number;
}

interface ChannelDetailData {
  channelId: string;
  name: string;
  videos: Video[];
  stats: YouTubeStats;
  comments: YouTubeComment[];
  pagination?: PaginationInfo;
  mostLikedComment?: MostLikedComment | null;
  mostCommentedVideo?: MostCommentedVideo | null;
}

export default function YouTube() {
  const [isChannelPage, params] = useRoute("/youtube/:channelId");
  const channelId = params?.channelId;

  if (isChannelPage && channelId) {
    return <YouTubeChannelDetail channelId={channelId} />;
  }

  return <YouTubeOverview />;
}

function YouTubeOverview() {
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
    return `/api/sheets/youtube${params.toString() ? '?' + params.toString() : ''}`;
  }, [dateRange]);

  const { data, isLoading, refetch } = useQuery<YouTubeData>({
    queryKey: ["/api/sheets/youtube", dateRange?.from?.toISOString(), dateRange?.to?.toISOString()],
    queryFn: async () => {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  const filteredData = useMemo(() => {
    if (!data) return null;
    
    // Use data directly from server - it's already computed correctly
    const filteredComments = data.comments || [];
    
    // Use channels with stats directly from server (already computed correctly by name-based matching)
    const channels: ChannelSummary[] = (data.channels || []).map(ch => ({
      channelId: ch.channelId,
      name: ch.name,
      totalComments: ch.totalComments || 0,
      totalVideos: ch.totalVideos || 0,
      totalLikes: ch.totalLikes || 0,
    }));

    const dateGroups: Record<string, number> = {};
    const channelDateGroups: Record<string, Record<string, number>> = {};
    
    filteredComments.forEach(c => {
      const date = c.commentPublishedAt?.split('T')[0];
      if (date) {
        dateGroups[date] = (dateGroups[date] || 0) + 1;
        if (!channelDateGroups[date]) channelDateGroups[date] = {};
        const channelName = c.accountName;
        channelDateGroups[date][channelName] = (channelDateGroups[date][channelName] || 0) + 1;
      }
    });

    const timeline = Object.entries(dateGroups)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Create channel timeline for multi-line chart
    const channelNames = channels.map(c => c.name);
    const channelTimeline = Object.entries(channelDateGroups)
      .map(([date, counts]) => {
        const entry: Record<string, any> = { date };
        channelNames.forEach(name => {
          entry[name] = counts[name] || 0;
        });
        return entry;
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      channels,
      stats: {
        totalComments: data.stats?.totalComments || filteredComments.length,
        totalLikes: data.stats?.totalLikes || filteredComments.reduce((sum, c) => sum + c.commentLikeCount, 0),
        timeline: data.stats?.timeline || timeline,
        channelTimeline: data.stats?.channelTimeline || channelTimeline,
      },
      comments: filteredComments,
    };
  }, [data, dateRange]);

  // Fetch comments for the selected date when clicking on chart
  const { data: dateSpecificData, isLoading: isLoadingDateData } = useQuery<any>({
    queryKey: ["/api/sheets/youtube", selectedDate],
    queryFn: async () => {
      if (!selectedDate) return null;
      const response = await fetch(`/api/sheets/youtube?startDate=${selectedDate}&endDate=${selectedDate}`);
      if (!response.ok) throw new Error("Failed to fetch date-specific data");
      return response.json();
    },
    enabled: !!selectedDate && sidebarOpen,
  });

  const sidebarComments = useMemo<CommentItem[]>(() => {
    if (!selectedDate) return [];
    
    // Use date-specific data if available, otherwise fall back to filtered comments
    const commentsSource = dateSpecificData?.comments || filteredData?.comments || [];
    const filtered = commentsSource.filter((c: any) => c.commentPublishedAt?.startsWith(selectedDate));
    
    return filtered.map((c: any) => ({
        platform: "youtube" as const,
        accountName: c.accountName,
        text: c.commentText,
        timestamp: c.commentPublishedAt,
        username: c.authorDisplayName,
        likeCount: c.commentLikeCount,
        originalUrl: c.videoUrl,
        profileThumbnail: c.authorThumbnailUrl,
        videoTitle: c.videoTitle,
        videoThumbnailUrl: c.videoThumbnailUrl,
      }));
  }, [selectedDate, filteredData, dateSpecificData]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-red-600">
            <SiYoutube className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">يوتيوب</h1>
            <p className="text-muted-foreground">تحليل تعليقات قنوات ثمانية</p>
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

  const channels = filteredData?.channels || [];
  const stats = filteredData?.stats;
  const totalComments = stats?.totalComments || 0;
  const totalLikes = stats?.totalLikes || 0;
  const totalVideos = channels.reduce((sum, c) => sum + c.totalVideos, 0);
  const channelNames = channels.map(c => c.name);

  // Multi-line chart data with each channel as a separate line
  const trendData = (stats?.channelTimeline || []).map(t => {
    const dateStr = String(t.date || '');
    const formatted = safeFormatDate(dateStr, "MM/dd");
    if (!formatted) return null;
    const entry: Record<string, any> = { date: formatted, originalDate: dateStr };
    channelNames.forEach(name => {
      entry[name] = t[name] || 0;
    });
    return entry;
  }).filter((t): t is Record<string, any> => t !== null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-red-600">
            <SiYoutube className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">يوتيوب</h1>
            <p className="text-muted-foreground">تحليل تعليقات قنوات ثمانية</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            data-testid="button-refresh-youtube"
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
              <ThumbsUp className="h-4 w-4" />
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
              <Play className="h-4 w-4" />
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
              <span className="text-sm">القنوات</span>
            </div>
            <p className="text-2xl font-bold" data-testid="text-total-channels">
              {channels.length.toLocaleString("ar-SA")}
            </p>
          </CardContent>
        </Card>
      </div>

      {trendData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">نشاط التعليقات (اضغط على يوم لعرض التفاصيل)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] cursor-pointer" data-testid="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={trendData}
                  onClick={(e: any) => {
                    if (e?.activePayload?.[0]?.payload) {
                      const payload = e.activePayload[0].payload;
                      const dateToUse = payload.originalDate || payload.date;
                      if (dateToUse) {
                        setSelectedDate(dateToUse);
                        setSidebarOpen(true);
                      }
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      direction: "rtl",
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: "10px", direction: "rtl" }} />
                  {channelNames.map((name) => (
                    <Line
                      key={name}
                      type="monotone"
                      dataKey={name}
                      stroke={CHANNEL_COLORS[name] || "#888888"}
                      strokeWidth={2}
                      dot={{ r: 5, cursor: "pointer" }}
                      activeDot={{ r: 7, cursor: "pointer" }}
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
          <CardTitle className="text-lg">قنوات ثمانية على يوتيوب</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {channels.map((channel) => (
              <Link key={channel.channelId} href={`/youtube/${channel.channelId}`}>
                <Card className="hover-elevate cursor-pointer h-full">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={getAccountLogo(channel.name)} alt={channel.name} />
                        <AvatarFallback className="bg-red-600">
                          <SiYoutube className="h-5 w-5 text-white" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold" data-testid={`text-channel-name-${channel.channelId}`}>
                          {channel.name}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-lg font-bold">{channel.totalComments.toLocaleString("ar-SA")}</p>
                        <p className="text-xs text-muted-foreground">تعليق</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">{channel.totalVideos.toLocaleString("ar-SA")}</p>
                        <p className="text-xs text-muted-foreground">فيديو</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">{channel.totalLikes.toLocaleString("ar-SA")}</p>
                        <p className="text-xs text-muted-foreground">إعجاب</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
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

function YouTubeChannelDetail({ channelId }: { channelId: string }) {
  const { dateRange, setDateRange } = useDateRange();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [allComments, setAllComments] = useState<YouTubeComment[]>([]);
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
    return `/api/sheets/youtube/${channelId}${params.toString() ? '?' + params.toString() : ''}`;
  }, [channelId, dateRange]);

  const { data, isLoading } = useQuery<ChannelDetailData>({
    queryKey: ["/api/sheets/youtube", channelId, dateRange?.from?.toISOString(), dateRange?.to?.toISOString()],
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
      
      const response = await fetch(`/api/sheets/youtube/${channelId}?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch more');
      
      const moreData: ChannelDetailData = await response.json();
      
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
    const filteredComments = allComments.filter(c => isDateInRange(c.commentPublishedAt, dateRange));

    const dateGroups: Record<string, number> = {};
    filteredComments.forEach(c => {
      const date = c.commentPublishedAt?.split('T')[0];
      if (date) dateGroups[date] = (dateGroups[date] || 0) + 1;
    });

    const timeline = Object.entries(dateGroups)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const videoMap: Record<string, Video> = {};
    filteredComments.forEach(c => {
      if (!videoMap[c.videoId]) {
        videoMap[c.videoId] = {
          videoId: c.videoId,
          videoTitle: c.videoTitle,
          videoDescription: "",
          videoPublishedAt: "",
          videoUrl: c.videoUrl,
          videoThumbnailUrl: c.videoThumbnailUrl,
          videoLikeCount: 0,
          videoViewCount: 0,
          videoCommentCount: 0,
          videoDuration: "",
          comments: [],
        };
      }
      videoMap[c.videoId].comments.push({
        id: c.commentId,
        text: c.commentText,
        publishedAt: c.commentPublishedAt,
        likeCount: c.commentLikeCount,
        authorDisplayName: c.authorDisplayName,
        authorThumbnailUrl: c.authorThumbnailUrl,
        commentType: "top_level",
      });
    });

    return {
      ...data,
      videos: Object.values(videoMap),
      stats: {
        totalComments: filteredComments.length,
        totalLikes: filteredComments.reduce((sum, c) => sum + c.commentLikeCount, 0),
        timeline,
      },
      comments: filteredComments,
    };
  }, [data, allComments, dateRange]);

  // Fetch comments for the selected date when clicking on chart
  const { data: dateSpecificData, isLoading: isLoadingDateData } = useQuery<any>({
    queryKey: ["/api/sheets/youtube", channelId, selectedDate],
    queryFn: async () => {
      if (!selectedDate) return null;
      const response = await fetch(`/api/sheets/youtube/${channelId}?startDate=${selectedDate}&endDate=${selectedDate}`);
      if (!response.ok) throw new Error("Failed to fetch date-specific data");
      return response.json();
    },
    enabled: !!selectedDate && sidebarOpen,
  });

  const sidebarComments = useMemo<CommentItem[]>(() => {
    if (!selectedDate) return [];
    
    // Use date-specific data if available
    const commentsSource = dateSpecificData?.comments || filteredData?.comments || [];
    const filtered = commentsSource.filter((c: any) => c.commentPublishedAt?.startsWith(selectedDate));
    
    return filtered.map((c: any) => ({
        platform: "youtube" as const,
        accountName: filteredData?.name || "",
        text: c.commentText,
        timestamp: c.commentPublishedAt,
        username: c.authorDisplayName,
        likeCount: c.commentLikeCount,
        originalUrl: c.videoUrl,
        profileThumbnail: c.authorThumbnailUrl,
      }));
  }, [selectedDate, filteredData, dateSpecificData]);

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
  const name = filteredData?.name || channelId;

  const trendData = (stats?.timeline || []).map(t => {
    const formatted = safeFormatDate(t.date, "MM/dd");
    return formatted ? { date: formatted, count: t.count, originalDate: t.date } : null;
  }).filter((t): t is { date: string; count: number; originalDate: string } => t !== null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/youtube">
            <Button variant="ghost" size="sm">
              ← العودة
            </Button>
          </Link>
          <div className="p-2 rounded-full bg-red-600">
            <SiYoutube className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{name}</h1>
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
            <p className="text-2xl font-bold" data-testid="text-channel-comments">
              {(stats?.totalComments || 0).toLocaleString("ar-SA")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <ThumbsUp className="h-4 w-4" />
              <span className="text-sm">الإعجابات</span>
            </div>
            <p className="text-2xl font-bold" data-testid="text-channel-likes">
              {(stats?.totalLikes || 0).toLocaleString("ar-SA")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Play className="h-4 w-4" />
              <span className="text-sm">الفيديوهات</span>
            </div>
            <p className="text-2xl font-bold" data-testid="text-channel-videos">
              {videos.length.toLocaleString("ar-SA")}
            </p>
          </CardContent>
        </Card>
      </div>

      {(data?.mostCommentedVideo || data?.mostLikedComment) && (
        <div className="grid gap-4 md:grid-cols-2">
          {data?.mostCommentedVideo && (
            <Card data-testid="card-most-commented-video">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  الفيديو الأكثر تعليقاً
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  {data.mostCommentedVideo.videoThumbnailUrl && (
                    <img
                      src={data.mostCommentedVideo.videoThumbnailUrl}
                      alt={data.mostCommentedVideo.videoTitle}
                      className="w-24 h-16 object-cover rounded-md shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium line-clamp-2 text-sm" data-testid="text-most-commented-title">
                      {data.mostCommentedVideo.videoTitle}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1" data-testid="text-most-commented-count">
                      {data.mostCommentedVideo.commentCount.toLocaleString("ar-SA")} تعليق
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {data?.mostLikedComment && (
            <Card data-testid="card-most-liked-comment">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4" />
                  التعليق الأكثر إعجاباً
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    {data.mostLikedComment.video.videoThumbnailUrl && (
                      <img
                        src={data.mostLikedComment.video.videoThumbnailUrl}
                        alt={data.mostLikedComment.video.videoTitle}
                        className="w-20 h-14 object-cover rounded-md shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {data.mostLikedComment.video.videoTitle}
                      </p>
                      <p className="text-sm mt-1 line-clamp-2" data-testid="text-most-liked-comment">
                        {data.mostLikedComment.commentText}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-medium">{data.mostLikedComment.authorDisplayName}</span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      {data.mostLikedComment.commentLikeCount.toLocaleString("ar-SA")}
                    </span>
                    {safeFormatDate(data.mostLikedComment.commentPublishedAt, "d MMM") && (
                      <span>{safeFormatDate(data.mostLikedComment.commentPublishedAt, "d MMM")}</span>
                    )}
                  </div>
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
            <div className="h-64 cursor-pointer" data-testid="channel-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={trendData}
                  onClick={(e: any) => {
                    if (e?.activePayload?.[0]?.payload) {
                      const payload = e.activePayload[0].payload;
                      const dateToUse = payload.originalDate || payload.date;
                      if (dateToUse) {
                        setSelectedDate(dateToUse);
                        setSidebarOpen(true);
                      }
                    }
                  }}
                >
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
                    dot={{ r: 5, cursor: "pointer" }}
                    activeDot={{ r: 7, cursor: "pointer" }}
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
          <Card key={video.videoId}>
            <CardHeader className="pb-2">
              <div className="flex items-start gap-4">
                {video.videoThumbnailUrl && (
                  <img
                    src={video.videoThumbnailUrl}
                    alt={video.videoTitle}
                    className="w-32 h-20 object-cover rounded-md shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold line-clamp-2">{video.videoTitle}</h3>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {video.comments.length.toLocaleString("ar-SA")} تعليق
                    </span>
                  </div>
                </div>
                <a
                  href={video.videoUrl}
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
                  <div key={comment.id} className="flex gap-3 p-3 rounded-md bg-muted/50">
                    <Avatar className="h-8 w-8">
                      {comment.authorThumbnailUrl && (
                        <AvatarImage src={comment.authorThumbnailUrl} alt={comment.authorDisplayName} />
                      )}
                      <AvatarFallback>{comment.authorDisplayName[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{comment.authorDisplayName}</span>
                        {comment.commentType === "reply" && (
                          <Badge variant="secondary" className="text-xs">رد</Badge>
                        )}
                      </div>
                      <p className="text-sm mt-1">{comment.text}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          {comment.likeCount}
                        </span>
                        {safeFormatDate(comment.publishedAt, "d MMM") && (
                          <span>{safeFormatDate(comment.publishedAt, "d MMM")}</span>
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

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, MessageSquare, Users, RefreshCw } from "lucide-react";
import { SiX, SiTiktok, SiInstagram, SiYoutube } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { DateRangeFilter, isDateInRange, useDateRange } from "@/components/DateRangeFilter";
import { CommentsSidebar, CommentItem } from "@/components/CommentsSidebar";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
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

function safeFormatDate(dateStr: string | undefined | null, formatStr: string = "MM/dd"): string | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return format(d, formatStr, { locale: ar });
  } catch {
    return null;
  }
}

interface XDataRow {
  date: string;
  time: string;
  hitSentence: string;
  openingText: string;
  authorHandle: string;
  authorName: string;
  likes: number;
  url: string;
}

interface TikTokComment {
  accountNameAr: string;
  commentText: string;
  commentCreateTimeIso: string;
  commentDiggCount: number;
  commentUniqueId: string;
  postUrl: string;
  commentAvatarThumbnail: string;
}

interface InstagramComment {
  accountNameAr: string;
  commentText: string;
  commentTimestamp: string;
  commentLikes: number;
  commentOwnerUsername: string;
  postUrl: string;
  commentOwnerProfilePic: string;
}

interface YouTubeComment {
  accountName: string;
  commentText: string;
  commentPublishedAt: string;
  commentLikeCount: number;
  authorDisplayName: string;
  videoUrl: string;
  authorThumbnailUrl: string;
}

interface PlatformStats {
  totalComments: number;
  totalLikes: number;
  timeline: { date: string; count: number }[];
}

interface XData {
  data: XDataRow[];
  stats: PlatformStats;
}

interface TikTokData {
  comments: TikTokComment[];
  stats: PlatformStats;
}

interface InstagramData {
  comments: InstagramComment[];
  stats: PlatformStats;
}

interface YouTubeData {
  comments: YouTubeComment[];
  stats: PlatformStats;
}

function parseXDateTime(date: string, time?: string): string {
  if (!date) return "";
  const cleanDate = date.replace(/^#+/, "");
  if (time) return `${cleanDate}T${time}:00`;
  return cleanDate;
}

export default function Overview() {
  const { dateRange, setDateRange } = useDateRange();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Build API URLs with date params for server-side filtering
  // Overview page uses nolimit=true to get ALL comments (no pagination)
  const buildApiUrl = useMemo(() => {
    return (baseUrl: string) => {
      const params = new URLSearchParams();
      if (dateRange?.from) {
        params.set('startDate', dateRange.from.toISOString().split('T')[0]);
      }
      if (dateRange?.to) {
        params.set('endDate', dateRange.to.toISOString().split('T')[0]);
      }
      // Request all comments without pagination for Overview page
      params.set('nolimit', 'true');
      return `${baseUrl}?${params.toString()}`;
    };
  }, [dateRange]);

  const dateKey = [dateRange?.from?.toISOString(), dateRange?.to?.toISOString()];

  const { data: xData, isLoading: xLoading, refetch: refetchX } = useQuery<XData>({
    queryKey: ["/api/sheets/x", ...dateKey],
    queryFn: async () => {
      const res = await fetch(buildApiUrl('/api/sheets/x'));
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  const { data: tiktokData, isLoading: tiktokLoading, refetch: refetchTikTok } = useQuery<TikTokData>({
    queryKey: ["/api/sheets/tiktok", ...dateKey],
    queryFn: async () => {
      const res = await fetch(buildApiUrl('/api/sheets/tiktok'));
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  const { data: instagramData, isLoading: instagramLoading, refetch: refetchInstagram } = useQuery<InstagramData>({
    queryKey: ["/api/sheets/instagram", ...dateKey],
    queryFn: async () => {
      const res = await fetch(buildApiUrl('/api/sheets/instagram'));
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  const { data: youtubeData, isLoading: youtubeLoading, refetch: refetchYouTube } = useQuery<YouTubeData>({
    queryKey: ["/api/sheets/youtube", ...dateKey],
    queryFn: async () => {
      const res = await fetch(buildApiUrl('/api/sheets/youtube'));
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  const isLoading = xLoading || tiktokLoading || instagramLoading || youtubeLoading;

  const refetchAll = () => {
    refetchX();
    refetchTikTok();
    refetchInstagram();
    refetchYouTube();
  };

  const filteredData = useMemo(() => {
    // Data is already filtered by server, just use it directly
    const xFiltered = xData?.data || [];

    const tiktokFiltered = tiktokData?.comments || [];

    // Data is already filtered by server
    const instagramFiltered = instagramData?.comments || [];

    const youtubeFiltered = youtubeData?.comments || [];

    const dateGroups: Record<string, { x: number; tiktok: number; instagram: number; youtube: number }> = {};

    xFiltered.forEach(row => {
      const date = row.date?.replace(/^#+/, "");
      if (date) {
        if (!dateGroups[date]) dateGroups[date] = { x: 0, tiktok: 0, instagram: 0, youtube: 0 };
        dateGroups[date].x++;
      }
    });

    tiktokFiltered.forEach(c => {
      const date = c.commentCreateTimeIso?.split('T')[0];
      if (date) {
        if (!dateGroups[date]) dateGroups[date] = { x: 0, tiktok: 0, instagram: 0, youtube: 0 };
        dateGroups[date].tiktok++;
      }
    });

    instagramFiltered.forEach(c => {
      const date = c.commentTimestamp?.split('T')[0];
      if (date) {
        if (!dateGroups[date]) dateGroups[date] = { x: 0, tiktok: 0, instagram: 0, youtube: 0 };
        dateGroups[date].instagram++;
      }
    });

    youtubeFiltered.forEach(c => {
      const date = c.commentPublishedAt?.split('T')[0];
      if (date) {
        if (!dateGroups[date]) dateGroups[date] = { x: 0, tiktok: 0, instagram: 0, youtube: 0 };
        dateGroups[date].youtube++;
      }
    });

    const timeline = Object.entries(dateGroups)
      .map(([date, counts]) => ({ 
        date, 
        ...counts,
        total: counts.x + counts.tiktok + counts.instagram + counts.youtube
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      x: {
        data: xFiltered,
        totalComments: xFiltered.length,
        totalLikes: xFiltered.reduce((sum, r) => sum + (r.likes ?? 0), 0),
      },
      tiktok: {
        comments: tiktokFiltered,
        totalComments: tiktokFiltered.length,
        totalLikes: tiktokFiltered.reduce((sum, c) => sum + c.commentDiggCount, 0),
      },
      instagram: {
        comments: instagramFiltered,
        totalComments: instagramFiltered.length,
        totalLikes: instagramFiltered.reduce((sum, c) => sum + c.commentLikes, 0),
      },
      youtube: {
        comments: youtubeFiltered,
        totalComments: youtubeFiltered.length,
        totalLikes: youtubeFiltered.reduce((sum, c) => sum + c.commentLikeCount, 0),
      },
      timeline,
    };
  }, [xData, tiktokData, instagramData, youtubeData, dateRange]);

  const sidebarComments = useMemo<CommentItem[]>(() => {
    if (!selectedDate) return [];
    
    const comments: CommentItem[] = [];

    filteredData.x.data
      .filter(row => row.date?.replace(/^#+/, "") === selectedDate)
      .forEach(row => {
        comments.push({
          platform: "x",
          accountName: "إكس",
          text: row.hitSentence || row.openingText,
          timestamp: parseXDateTime(row.date, row.time),
          username: row.authorHandle?.replace("@", "") || row.authorName,
          likeCount: row.likes ?? 0,
          originalUrl: row.url,
        });
      });

    filteredData.tiktok.comments
      .filter(c => c.commentCreateTimeIso?.startsWith(selectedDate))
      .forEach(c => {
        comments.push({
          platform: "tiktok",
          accountName: c.accountNameAr,
          text: c.commentText,
          timestamp: c.commentCreateTimeIso,
          username: c.commentUniqueId,
          likeCount: c.commentDiggCount,
          originalUrl: c.postUrl,
          profileThumbnail: c.commentAvatarThumbnail,
        });
      });

    filteredData.instagram.comments
      .filter(c => c.commentTimestamp?.startsWith(selectedDate))
      .forEach(c => {
        comments.push({
          platform: "instagram",
          accountName: c.accountNameAr,
          text: c.commentText,
          timestamp: c.commentTimestamp,
          username: c.commentOwnerUsername,
          likeCount: c.commentLikes,
          originalUrl: c.postUrl,
          profileThumbnail: c.commentOwnerProfilePic,
        });
      });

    filteredData.youtube.comments
      .filter(c => c.commentPublishedAt?.startsWith(selectedDate))
      .forEach(c => {
        comments.push({
          platform: "youtube",
          accountName: c.accountName,
          text: c.commentText,
          timestamp: c.commentPublishedAt,
          username: c.authorDisplayName,
          likeCount: c.commentLikeCount,
          originalUrl: c.videoUrl,
          profileThumbnail: c.authorThumbnailUrl,
        });
      });

    return comments.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [selectedDate, filteredData]);

  const handleDotClick = (payload: any) => {
    if (payload?.payload?.date) {
      setSelectedDate(payload.payload.date);
      setSidebarOpen(true);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toLocaleString("ar-SA");
  };

  const platforms = [
    { 
      id: "x", 
      name: "X (تويتر)", 
      icon: SiX, 
      bgColor: "bg-black dark:bg-white",
      iconClass: "text-white dark:text-black",
      href: "/x",
      data: filteredData.x,
    },
    { 
      id: "tiktok", 
      name: "تيك توك", 
      icon: SiTiktok, 
      bgColor: "bg-[#00f2ea]",
      iconClass: "text-black",
      href: "/tiktok",
      data: filteredData.tiktok,
    },
    { 
      id: "instagram", 
      name: "انستقرام", 
      icon: SiInstagram, 
      bgColor: "bg-gradient-to-br from-purple-500 to-pink-500",
      iconClass: "text-white",
      href: "/instagram",
      data: filteredData.instagram,
    },
    { 
      id: "youtube", 
      name: "يوتيوب", 
      icon: SiYoutube, 
      bgColor: "bg-red-600",
      iconClass: "text-white",
      href: "/youtube",
      data: filteredData.youtube,
    },
  ];

  const totalMentions = platforms.reduce((sum, p) => sum + (p.data?.totalComments || 0), 0);
  const totalEngagement = platforms.reduce((sum, p) => sum + (p.data?.totalLikes || 0), 0);

  const trendData = filteredData.timeline.map(t => ({
    ...t,
    dateLabel: safeFormatDate(t.date) || t.date,
  }));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">نظرة عامة</h1>
            <p className="text-muted-foreground">ملخص شامل لجميع المنصات</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">نظرة عامة</h1>
            <p className="text-muted-foreground">ملخص شامل لجميع المنصات</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
          <Button
            size="sm"
            variant="outline"
            onClick={refetchAll}
            data-testid="button-refresh-overview"
          >
            <RefreshCw className="h-4 w-4 ml-1" />
            تحديث
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-total-mentions">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              إجمالي التعليقات
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(totalMentions)}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-total-engagement">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              إجمالي الإعجابات
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(totalEngagement)}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-platforms-count">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              المنصات النشطة
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {platforms.filter(p => (p.data?.totalComments || 0) > 0).length}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-avg-comments">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              متوسط التعليقات
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(Math.round(totalMentions / platforms.length))}
            </div>
          </CardContent>
        </Card>
      </div>

      {trendData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">نشاط التعليقات عبر المنصات (اضغط على يوم لعرض التفاصيل)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 cursor-pointer">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="dateLabel" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="x"
                    name="إكس"
                    stroke="#1DA1F2"
                    strokeWidth={2}
                    dot={{ r: 3, cursor: "pointer", onClick: (e: any, payload: any) => handleDotClick(payload) }}
                    activeDot={{ r: 5, cursor: "pointer", onClick: (e: any, payload: any) => handleDotClick(payload) }}
                  />
                  <Line
                    type="monotone"
                    dataKey="tiktok"
                    name="تيك توك"
                    stroke="#00f2ea"
                    strokeWidth={2}
                    dot={{ r: 3, cursor: "pointer", onClick: (e: any, payload: any) => handleDotClick(payload) }}
                    activeDot={{ r: 5, cursor: "pointer", onClick: (e: any, payload: any) => handleDotClick(payload) }}
                  />
                  <Line
                    type="monotone"
                    dataKey="instagram"
                    name="انستقرام"
                    stroke="#E1306C"
                    strokeWidth={2}
                    dot={{ r: 3, cursor: "pointer", onClick: (e: any, payload: any) => handleDotClick(payload) }}
                    activeDot={{ r: 5, cursor: "pointer", onClick: (e: any, payload: any) => handleDotClick(payload) }}
                  />
                  <Line
                    type="monotone"
                    dataKey="youtube"
                    name="يوتيوب"
                    stroke="#FF0000"
                    strokeWidth={2}
                    dot={{ r: 3, cursor: "pointer", onClick: (e: any, payload: any) => handleDotClick(payload) }}
                    activeDot={{ r: 5, cursor: "pointer", onClick: (e: any, payload: any) => handleDotClick(payload) }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {platforms.map((platform) => (
          <Link key={platform.id} href={platform.href}>
            <Card className="hover-elevate cursor-pointer h-full" data-testid={`card-platform-${platform.id}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-md ${platform.bgColor}`}>
                    <platform.icon className={`h-5 w-5 ${platform.iconClass}`} />
                  </div>
                  <CardTitle>{platform.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">التعليقات</p>
                    <p className="text-xl font-bold">
                      {formatNumber(platform.data?.totalComments || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">الإعجابات</p>
                    <p className="text-xl font-bold">
                      {formatNumber(platform.data?.totalLikes || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <CommentsSidebar
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        selectedDate={selectedDate}
        comments={sidebarComments}
        isLoading={false}
      />
    </div>
  );
}

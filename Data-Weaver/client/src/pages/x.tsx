import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MessageCircle, 
  Heart, 
  Repeat2,
  Eye,
  RefreshCw,
  ExternalLink,
  BarChart3,
} from "lucide-react";
import { SiX } from "react-icons/si";
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
} from "recharts";

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

function parseXDateTime(date: string, time?: string): string {
  if (!date) return "";
  const cleanDate = date.replace(/^#+/, "");
  if (time) {
    return `${cleanDate}T${time}:00`;
  }
  return cleanDate;
}

interface XDataRow {
  date: string;
  time: string;
  documentId: string;
  url: string;
  authorName: string;
  authorHandle: string;
  openingText: string;
  hitSentence: string;
  language: string;
  sentiment: string;
  engagement: number;
  likes: number;
  replies: number;
  reposts: number;
  views: number;
  inputName: string;
}

interface XStats {
  totalComments: number;
  totalLikes: number;
  totalReplies: number;
  totalReposts: number;
  totalViews: number;
  timeline: { date: string; count: number }[];
}

interface XData {
  data: XDataRow[];
  stats: XStats;
}

export default function XPage() {
  const { dateRange, setDateRange } = useDateRange();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery<XData>({
    queryKey: ["/api/sheets/x"],
  });

  const filteredData = useMemo(() => {
    if (!data) return null;
    
    const filteredRows = data.data?.filter(row => {
      const dateTime = parseXDateTime(row.date, row.time);
      return isDateInRange(dateTime, dateRange);
    }) || [];

    const dateGroups: Record<string, number> = {};
    filteredRows.forEach(row => {
      const date = row.date?.replace(/^#+/, "");
      if (date) dateGroups[date] = (dateGroups[date] || 0) + 1;
    });

    const timeline = Object.entries(dateGroups)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      data: filteredRows,
      stats: {
        totalComments: filteredRows.length,
        totalLikes: filteredRows.reduce((sum, r) => sum + r.likes, 0),
        totalReplies: filteredRows.reduce((sum, r) => sum + r.replies, 0),
        totalReposts: filteredRows.reduce((sum, r) => sum + r.reposts, 0),
        totalViews: filteredRows.reduce((sum, r) => sum + r.views, 0),
        timeline,
      },
    };
  }, [data, dateRange]);

  const sidebarComments = useMemo<CommentItem[]>(() => {
    if (!selectedDate || !filteredData?.data) return [];
    return filteredData.data
      .filter(row => row.date?.replace(/^#+/, "") === selectedDate)
      .map(row => ({
        platform: "x" as const,
        accountName: "إكس",
        text: row.hitSentence || row.openingText,
        timestamp: parseXDateTime(row.date, row.time),
        username: row.authorHandle?.replace("@", "") || row.authorName,
        likeCount: row.likes,
        originalUrl: row.url,
      }));
  }, [selectedDate, filteredData]);

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
            <SiX className="h-6 w-6 text-white dark:text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">إكس (تويتر)</h1>
            <p className="text-muted-foreground">تحليل التغريدات والردود</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
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

  const rows = filteredData?.data || [];
  const stats = filteredData?.stats;
  const totalComments = stats?.totalComments || 0;
  const totalLikes = stats?.totalLikes || 0;
  const totalReplies = stats?.totalReplies || 0;
  const totalReposts = stats?.totalReposts || 0;
  const totalViews = stats?.totalViews || 0;

  const trendData = (stats?.timeline || []).map(t => {
    const formatted = safeFormatDate(t.date, "MM/dd");
    return formatted ? { date: formatted, count: t.count, originalDate: t.date } : null;
  }).filter((t): t is { date: string; count: number; originalDate: string } => t !== null);

  const sentimentCounts: Record<string, number> = {};
  rows.forEach(row => {
    if (row.sentiment) {
      sentimentCounts[row.sentiment] = (sentimentCounts[row.sentiment] || 0) + 1;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-black dark:bg-white">
            <SiX className="h-6 w-6 text-white dark:text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">إكس (تويتر)</h1>
            <p className="text-muted-foreground">تحليل التغريدات والردود</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            data-testid="button-refresh-x"
          >
            <RefreshCw className="h-4 w-4 ml-1" />
            تحديث
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm">التغريدات</span>
            </div>
            <p className="text-2xl font-bold" data-testid="text-total-tweets">
              {totalComments.toLocaleString("ar-SA")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm">الردود</span>
            </div>
            <p className="text-2xl font-bold" data-testid="text-total-replies">
              {totalReplies.toLocaleString("ar-SA")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Heart className="h-4 w-4" />
              <span className="text-sm">الإعجابات</span>
            </div>
            <p className="text-2xl font-bold" data-testid="text-total-likes">
              {totalLikes.toLocaleString("ar-SA")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Repeat2 className="h-4 w-4" />
              <span className="text-sm">إعادة التغريد</span>
            </div>
            <p className="text-2xl font-bold" data-testid="text-total-reposts">
              {totalReposts.toLocaleString("ar-SA")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Eye className="h-4 w-4" />
              <span className="text-sm">المشاهدات</span>
            </div>
            <p className="text-2xl font-bold" data-testid="text-total-views">
              {totalViews.toLocaleString("ar-SA")}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {trendData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">نشاط التغريدات (اضغط على يوم لعرض التفاصيل)</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              توزيع المشاعر
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(sentimentCounts).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(sentimentCounts).map(([sentiment, count]) => (
                  <div key={sentiment} className="flex items-center justify-between">
                    <span className="text-sm">{sentiment}</span>
                    <span className="font-medium">{count.toLocaleString("ar-SA")}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>لا توجد بيانات مشاعر متاحة</p>
                <p className="text-sm mt-1">سيتم عرض توزيع المشاعر عند توفر البيانات</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">أحدث التغريدات ({rows.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rows.slice(0, 20).map((row, index) => (
              <div key={row.documentId || index} className="p-4 rounded-md bg-muted/50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">{row.authorName}</span>
                      <span className="text-sm text-muted-foreground">{row.authorHandle}</span>
                    </div>
                    <p className="text-sm">{row.hitSentence || row.openingText}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                      {safeFormatDate(row.date?.replace(/^#+/, "")) && (
                        <span>{safeFormatDate(row.date?.replace(/^#+/, ""))}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {row.likes.toLocaleString("ar-SA")}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {row.replies.toLocaleString("ar-SA")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Repeat2 className="h-3 w-3" />
                        {row.reposts.toLocaleString("ar-SA")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {row.views.toLocaleString("ar-SA")}
                      </span>
                    </div>
                  </div>
                  {row.url && (
                    <a
                      href={row.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0"
                    >
                      <Button variant="ghost" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <CommentsSidebar
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        selectedDate={selectedDate}
        comments={sidebarComments}
      />
    </div>
  );
}

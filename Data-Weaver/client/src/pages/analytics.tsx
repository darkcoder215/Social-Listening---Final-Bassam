import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MessageCircle, 
  Heart, 
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowRight,
} from "lucide-react";
import { SiTiktok, SiInstagram, SiYoutube, SiX } from "react-icons/si";
import { Link, useRoute } from "wouter";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

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

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface AnalyticsProps {
  platform: "x" | "tiktok" | "instagram" | "youtube";
  identifier: string;
}

export default function Analytics() {
  const [, paramsX] = useRoute("/analytics/x/:identifier");
  const [, paramsTikTok] = useRoute("/analytics/tiktok/:identifier");
  const [, paramsInstagram] = useRoute("/analytics/instagram/:identifier");
  const [, paramsYouTube] = useRoute("/analytics/youtube/:identifier");

  if (paramsX?.identifier) {
    return <AnalyticsPage platform="x" identifier={paramsX.identifier} />;
  }
  if (paramsTikTok?.identifier) {
    return <AnalyticsPage platform="tiktok" identifier={paramsTikTok.identifier} />;
  }
  if (paramsInstagram?.identifier) {
    return <AnalyticsPage platform="instagram" identifier={paramsInstagram.identifier} />;
  }
  if (paramsYouTube?.identifier) {
    return <AnalyticsPage platform="youtube" identifier={paramsYouTube.identifier} />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">التحليلات</h1>
      <p className="text-muted-foreground">اختر منصة وحساب لعرض التحليلات</p>
    </div>
  );
}

function AnalyticsPage({ platform, identifier }: AnalyticsProps) {
  const platformConfig = {
    x: {
      icon: SiX,
      color: "bg-black dark:bg-white",
      iconColor: "text-white dark:text-black",
      name: "إكس (تويتر)",
      backUrl: "/x",
      apiUrl: "/api/sheets/x",
    },
    tiktok: {
      icon: SiTiktok,
      color: "bg-[#00f2ea]",
      iconColor: "text-black",
      name: "تيك توك",
      backUrl: `/tiktok/${identifier}`,
      apiUrl: `/api/sheets/tiktok/${identifier}`,
    },
    instagram: {
      icon: SiInstagram,
      color: "bg-gradient-to-br from-purple-500 to-pink-500",
      iconColor: "text-white",
      name: "انستقرام",
      backUrl: `/instagram/${identifier}`,
      apiUrl: `/api/sheets/instagram/${identifier}`,
    },
    youtube: {
      icon: SiYoutube,
      color: "bg-red-600",
      iconColor: "text-white",
      name: "يوتيوب",
      backUrl: `/youtube/${identifier}`,
      apiUrl: `/api/sheets/youtube/${identifier}`,
    },
  };

  const config = platformConfig[platform];
  const Icon = config.icon;

  const { data, isLoading } = useQuery<any>({
    queryKey: [config.apiUrl],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
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

  const stats = data?.stats || {};
  const totalComments = stats.totalComments || 0;
  const totalLikes = stats.totalLikes || 0;
  const timeline = stats.timeline || [];
  
  let posts: any[] = [];
  let postLabel = "المنشورات";
  
  if (platform === "tiktok") {
    posts = data?.posts || [];
    postLabel = "المنشورات";
  } else if (platform === "instagram") {
    posts = data?.posts || [];
    postLabel = "المنشورات";
  } else if (platform === "youtube") {
    posts = data?.videos || [];
    postLabel = "الفيديوهات";
  }

  const trendData = timeline.map((t: any) => {
    const formatted = safeFormatDate(t.date, "MM/dd");
    return formatted ? { date: formatted, count: t.count } : null;
  }).filter((t: any): t is { date: string; count: number } => t !== null);

  const mostCommentedPost = posts.length > 0
    ? posts.reduce((max: any, p: any) => 
        (p.comments?.length || 0) > (max.comments?.length || 0) ? p : max
      , posts[0])
    : null;

  const mostLikedComment = data?.stats?.mostLikedComment;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href={config.backUrl}>
            <Button variant="ghost" size="sm">
              ← العودة
            </Button>
          </Link>
          <div className={`p-2 rounded-full ${config.color}`}>
            <Icon className={`h-6 w-6 ${config.iconColor}`} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">تحليلات {config.name}</h1>
            <p className="text-muted-foreground">{data?.nameAr || data?.name || identifier}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm">إجمالي التعليقات</span>
            </div>
            <p className="text-2xl font-bold" data-testid="analytics-total-comments">
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
            <p className="text-2xl font-bold" data-testid="analytics-total-likes">
              {totalLikes.toLocaleString("ar-SA")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <BarChart3 className="h-4 w-4" />
              <span className="text-sm">{postLabel}</span>
            </div>
            <p className="text-2xl font-bold" data-testid="analytics-total-posts">
              {posts.length.toLocaleString("ar-SA")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">متوسط التعليقات</span>
            </div>
            <p className="text-2xl font-bold" data-testid="analytics-avg-comments">
              {posts.length > 0 
                ? Math.round(totalComments / posts.length).toLocaleString("ar-SA")
                : "0"
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {trendData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">نشاط التعليقات عبر الزمن</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
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
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              توزيع المشاعر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>لا توجد بيانات مشاعر متاحة</p>
              <p className="text-sm mt-1">سيتم عرض توزيع المشاعر عند توفر التحليل</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              تصنيف المواضيع
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>لا توجد بيانات مواضيع متاحة</p>
              <p className="text-sm mt-1">سيتم عرض تصنيف المواضيع عند توفر التحليل</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {mostCommentedPost && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">أكثر محتوى تعليقاً</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-md bg-muted/50">
              <p className="text-sm line-clamp-3">
                {platform === "youtube" 
                  ? mostCommentedPost.videoTitle 
                  : (mostCommentedPost.postDescription || mostCommentedPost.postCaption || "بدون وصف")
                }
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <MessageCircle className="h-3 w-3" />
                <span>{(mostCommentedPost.comments?.length || 0).toLocaleString("ar-SA")} تعليق</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

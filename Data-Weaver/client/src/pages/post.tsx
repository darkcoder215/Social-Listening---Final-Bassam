import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowRight, ExternalLink, Eye, Heart, MessageCircle, 
  Share2, Quote, RotateCcw, Clock, CheckCircle2, AlertCircle,
  User, Calendar, MapPin, Globe
} from "lucide-react";
import type { Mention } from "@shared/schema";
import { format } from "date-fns";

interface PostDetailResponse {
  post: Mention;
  thread: Mention[];
}

const SENTIMENT_LABELS: Record<string, string> = {
  "إيجابي": "إيجابي",
  "سلبي": "سلبي",
  "محايد": "محايد",
};

export default function PostDetail() {
  const params = useParams<{ id: string }>();
  const postId = params.id;

  const { data, isLoading, error } = useQuery<PostDetailResponse>({
    queryKey: ["/api/post", postId],
    queryFn: async () => {
      const res = await fetch(`/api/post/${postId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!postId,
  });

  const formatDate = (dateString: string | null | Date) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "yyyy/MM/dd 'الساعة' HH:mm");
    } catch {
      return String(dateString);
    }
  };

  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return "-";
    return num.toLocaleString("ar-SA");
  };

  const getSentimentBadge = (sentiment: string | null) => {
    if (!sentiment) return null;
    const colors: Record<string, string> = {
      "إيجابي": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      "سلبي": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      "محايد": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    };
    return (
      <Badge className={`${colors[sentiment] || ""} text-lg px-4 py-1 no-default-hover-elevate no-default-active-elevate`}>
        {SENTIMENT_LABELS[sentiment] || sentiment}
      </Badge>
    );
  };

  const getAnalysisStatusBanner = (status: string | null) => {
    if (status === "done") return null;
    
    const configs: Record<string, { bg: string; icon: typeof Clock; text: string }> = {
      pending: { 
        bg: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800", 
        icon: Clock, 
        text: "بانتظار التحليل - هذا المنشور في قائمة الانتظار للتحليل الذكي" 
      },
      processing: { 
        bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800", 
        icon: Clock, 
        text: "قيد التحليل - جارٍ تحليل هذا المنشور الآن" 
      },
      failed: { 
        bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800", 
        icon: AlertCircle, 
        text: "فشل التحليل - حدث خطأ أثناء تحليل هذا المنشور" 
      },
    };
    
    const config = configs[status || "pending"] || configs.pending;
    const Icon = config.icon;
    
    return (
      <div className={`flex items-center gap-3 p-4 rounded-lg border ${config.bg}`}>
        <Icon className="h-5 w-5 shrink-0" />
        <span className="text-sm">{config.text}</span>
      </div>
    );
  };

  const renderLink = (url: string | null, label?: string) => {
    if (!url) return null;
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
        onClick={(e) => e.stopPropagation()}
        dir="ltr"
      >
        {label || url}
        <ExternalLink className="h-3 w-3" />
      </a>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-32" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-medium mb-2">المنشور غير موجود</h2>
        <p className="text-muted-foreground mb-4">
          المنشور الذي تبحث عنه غير موجود أو تم حذفه.
        </p>
        <Link href="/explore">
          <Button>
            العودة لاستعراض البيانات
            <ArrowRight className="h-4 w-4 mr-2" />
          </Button>
        </Link>
      </div>
    );
  }

  const { post, thread } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/explore">
          <Button variant="ghost" size="sm" data-testid="button-back">
            العودة
            <ArrowRight className="h-4 w-4 mr-2" />
          </Button>
        </Link>
        <Badge variant="secondary">{post.platform || "منصة غير معروفة"}</Badge>
      </div>

      {getAnalysisStatusBanner(post.analysisStatus)}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{post.authorName || "مؤلف غير معروف"}</p>
                    {post.authorHandle && (
                      <p className="text-sm text-muted-foreground" dir="ltr">@{post.authorHandle}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {formatDate(post.dateTime)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {post.title && (
                <h2 className="text-lg font-medium">{post.title}</h2>
              )}
              
              <div className="prose prose-sm dark:prose-invert max-w-none" dir="auto">
                <p className="whitespace-pre-wrap">{post.text || post.hitSentence || post.openingText || "لا يوجد محتوى"}</p>
              </div>

              {post.hashtags && (
                <div className="flex flex-wrap gap-2">
                  {post.hashtags.split(/[,\s]+/).filter(Boolean).map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      #{tag.replace(/^#/, "")}
                    </Badge>
                  ))}
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-muted rounded-lg">
                  <Eye className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="font-mono text-lg font-medium" dir="ltr">{formatNumber(post.reach)}</p>
                  <p className="text-xs text-muted-foreground">الوصول</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <Heart className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="font-mono text-lg font-medium" dir="ltr">{formatNumber(post.likes)}</p>
                  <p className="text-xs text-muted-foreground">الإعجابات</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <MessageCircle className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="font-mono text-lg font-medium" dir="ltr">{formatNumber(post.replies)}</p>
                  <p className="text-xs text-muted-foreground">الردود</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <Share2 className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="font-mono text-lg font-medium" dir="ltr">{formatNumber(post.shares)}</p>
                  <p className="text-xs text-muted-foreground">المشاركات</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-muted rounded-lg">
                  <Quote className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="font-mono text-lg font-medium" dir="ltr">{formatNumber(post.quotes)}</p>
                  <p className="text-xs text-muted-foreground">الاقتباسات</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <RotateCcw className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="font-mono text-lg font-medium" dir="ltr">{formatNumber(post.reposts)}</p>
                  <p className="text-xs text-muted-foreground">إعادة النشر</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <MessageCircle className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="font-mono text-lg font-medium" dir="ltr">{formatNumber(post.comments)}</p>
                  <p className="text-xs text-muted-foreground">التعليقات</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <Eye className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="font-mono text-lg font-medium" dir="ltr">{formatNumber(post.views)}</p>
                  <p className="text-xs text-muted-foreground">المشاهدات</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {thread && thread.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">
                  الثريد ({thread.length} منشورات مرتبطة)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {thread.map((item, index) => (
                  <div 
                    key={item.id} 
                    className={`relative pr-6 ${index === 0 ? "border-r-4 border-primary bg-muted/50 -mr-2 p-4 rounded-lg" : "border-r-2 border-muted pb-4"}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium">
                        {item.authorName || item.authorHandle || "غير معروف"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(item.dateTime)}
                      </span>
                      {item.id === post.id && (
                        <Badge variant="secondary" className="text-xs">الحالي</Badge>
                      )}
                    </div>
                    <p className="text-sm" dir="auto">
                      {item.text || item.hitSentence || "لا يوجد محتوى"}
                    </p>
                    {item.id !== post.id && (
                      <Link href={`/post/${item.id}`}>
                        <Button variant="ghost" size="sm" className="mt-2">
                          عرض المنشور
                        </Button>
                      </Link>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">معلومات المصدر</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Globe className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-muted-foreground">المصدر</p>
                  <p className="font-medium truncate">{post.sourceName || "-"}</p>
                  {post.sourceDomain && (
                    <p className="text-xs text-muted-foreground truncate" dir="ltr">{post.sourceDomain}</p>
                  )}
                </div>
              </div>
              
              {post.url && (
                <div className="pt-2">
                  {renderLink(post.url, "عرض المنشور الأصلي")}
                </div>
              )}
              
              {post.originalTweetUrl && post.originalTweetUrl !== post.url && (
                <div className="pt-2">
                  {renderLink(post.originalTweetUrl, "عرض التغريدة الأصلية")}
                </div>
              )}

              {(post.country || post.region || post.city) && (
                <div className="flex items-start gap-3 pt-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-muted-foreground">الموقع</p>
                    <p className="font-medium">
                      {[post.city, post.region, post.country].filter(Boolean).join("، ") || "-"}
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <p className="text-muted-foreground">نوع المحتوى</p>
                <p className="font-medium">{post.contentType || "-"}</p>
              </div>

              <div className="pt-2">
                <p className="text-muted-foreground">اللغة</p>
                <p className="font-medium">{post.language || "-"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">التحليل الذكي</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {post.analysisStatus === "done" ? (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">الشعور</p>
                    {getSentimentBadge(post.aiSentiment)}
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">هدف الشعور</p>
                    <p className="font-medium">{post.sentimentTarget || "-"}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">نوع المحتوى</p>
                    <Badge variant="outline">{post.contentVertical || "-"}</Badge>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">الموضوع</p>
                    <Badge variant="outline">{post.aiTopic || "-"}</Badge>
                  </div>

                  {post.confidenceScore !== null && post.confidenceScore !== undefined && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">درجة الثقة</p>
                      <div className="flex items-center gap-3">
                        <Progress value={post.confidenceScore * 100} className="flex-1 h-2" />
                        <span className="text-sm font-mono" dir="ltr">
                          {(post.confidenceScore * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  )}

                  {post.analyzedAt && (
                    <div className="pt-2 text-xs text-muted-foreground">
                      تم التحليل في {formatDate(post.analyzedAt)}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {post.analysisStatus === "processing" ? "جارٍ التحليل" : "بانتظار التحليل"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {post.mwSentiment && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">بيانات Meltwater</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">شعور MW</p>
                  <p className="font-medium">{post.mwSentiment}</p>
                </div>
                {post.mwKeyphrases && (
                  <div>
                    <p className="text-muted-foreground mb-1">العبارات الرئيسية</p>
                    <div className="flex flex-wrap gap-1">
                      {post.mwKeyphrases.split(/[,;]+/).filter(Boolean).map((phrase, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {phrase.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

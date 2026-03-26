import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ChevronLeft, ChevronRight, Filter, X, ExternalLink, 
  Clock, AlertCircle, CheckCircle2, Loader2
} from "lucide-react";
import type { ExploreResponse } from "@shared/schema";
import { format } from "date-fns";

const PLATFORMS = [
  { value: "Twitter", label: "تويتر" },
  { value: "Facebook", label: "فيسبوك" },
  { value: "Instagram", label: "انستجرام" },
  { value: "YouTube", label: "يوتيوب" },
  { value: "TikTok", label: "تيك توك" },
  { value: "Reddit", label: "ريديت" },
  { value: "News", label: "أخبار" },
  { value: "Blog", label: "مدونات" },
];

const VERTICALS = [
  { value: "رياضة", label: "رياضة" },
  { value: "محتوى ثمانية الأصلي", label: "محتوى ثمانية الأصلي" },
  { value: "غير واضح", label: "غير واضح" },
];

const SENTIMENTS = [
  { value: "إيجابي", label: "إيجابي" },
  { value: "سلبي", label: "سلبي" },
  { value: "محايد", label: "محايد" },
];

const TOPICS = [
  { value: "جودة المحتوى", label: "جودة المحتوى" },
  { value: "الاشتراك والتسعير", label: "الاشتراك والتسعير" },
  { value: "الحياد والتحيز", label: "الحياد والتحيز" },
  { value: "إشادة", label: "إشادة" },
  { value: "انتقاد", label: "انتقاد" },
  { value: "نقل رياضي", label: "نقل رياضي" },
  { value: "محتوى ديني أو قيمي", label: "محتوى ديني أو قيمي" },
  { value: "محتوى ثقافي أو معرفي", label: "محتوى ثقافي أو معرفي" },
  { value: "غير ذلك", label: "غير ذلك" },
];

const STATUSES = [
  { value: "pending", label: "بانتظار التحليل" },
  { value: "processing", label: "قيد التحليل" },
  { value: "done", label: "تم التحليل" },
  { value: "failed", label: "فشل التحليل" },
];

const SENTIMENT_LABELS: Record<string, string> = {
  "إيجابي": "إيجابي",
  "سلبي": "سلبي",
  "محايد": "محايد",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "بانتظار التحليل",
  processing: "قيد التحليل",
  done: "تم التحليل",
  failed: "فشل التحليل",
};

const SORT_OPTIONS = [
  { value: "date_time", label: "التاريخ" },
  { value: "reach", label: "الوصول" },
  { value: "engagement", label: "التفاعل" },
  { value: "source_name", label: "المصدر" },
];

export default function Explore() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  
  const [filters, setFilters] = useState({
    from: searchParams.get("from") || "",
    to: searchParams.get("to") || "",
    platform: searchParams.get("platform") || "",
    contentVertical: searchParams.get("contentVertical") || "",
    aiSentiment: searchParams.get("aiSentiment") || "",
    aiTopic: searchParams.get("aiTopic") || "",
    analysisStatus: searchParams.get("analysisStatus") || "",
    sortBy: searchParams.get("sortBy") || "date_time",
    sortOrder: (searchParams.get("sortOrder") || "desc") as "asc" | "desc",
    page: parseInt(searchParams.get("page") || "1"),
    limit: parseInt(searchParams.get("limit") || "25"),
  });

  const [showFilters, setShowFilters] = useState(true);

  const buildQueryString = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) {
        params.set(key, String(value));
      }
    });
    return params.toString();
  };

  const queryString = buildQueryString();
  const { data, isLoading } = useQuery<ExploreResponse>({
    queryKey: ["/api/explore", queryString],
    queryFn: async () => {
      const res = await fetch(`/api/explore?${queryString}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const updateFilter = (key: string, value: string | number) => {
    const newFilters = { ...filters, [key]: value };
    if (key !== "page") {
      newFilters.page = 1;
    }
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({
      from: "",
      to: "",
      platform: "",
      contentVertical: "",
      aiSentiment: "",
      aiTopic: "",
      analysisStatus: "",
      sortBy: "date_time",
      sortOrder: "desc",
      page: 1,
      limit: 25,
    });
  };

  const getSentimentBadge = (sentiment: string | null) => {
    if (!sentiment) return null;
    const colors: Record<string, string> = {
      "إيجابي": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      "سلبي": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      "محايد": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    };
    return (
      <Badge className={`${colors[sentiment] || ""} no-default-hover-elevate no-default-active-elevate`}>
        {sentiment}
      </Badge>
    );
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "done":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "processing":
        return <Loader2 className="h-4 w-4 text-yellow-600 animate-spin" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "yyyy/MM/dd HH:mm");
    } catch {
      return dateString;
    }
  };

  const truncateText = (text: string | null, maxLength: number = 80) => {
    if (!text) return "-";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const hasActiveFilters = filters.from || filters.to || filters.platform || 
    filters.contentVertical || filters.aiSentiment || filters.aiTopic || filters.analysisStatus;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">استعراض البيانات</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data ? `${data.total.toLocaleString("ar-SA")} منشور` : "جارٍ التحميل..."}
          </p>
        </div>
        
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
          data-testid="button-toggle-filters"
        >
          <Filter className="h-4 w-4" />
          {showFilters ? "إخفاء الفلاتر" : "إظهار الفلاتر"}
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {showFilters && (
          <Card className="lg:w-64 shrink-0">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">الفلاتر</h3>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="gap-1 text-xs"
                    data-testid="button-clear-filters"
                  >
                    <X className="h-3 w-3" />
                    مسح
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">من تاريخ</Label>
                  <Input
                    type="date"
                    value={filters.from}
                    onChange={(e) => updateFilter("from", e.target.value)}
                    className="mt-1"
                    data-testid="input-filter-from"
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">إلى تاريخ</Label>
                  <Input
                    type="date"
                    value={filters.to}
                    onChange={(e) => updateFilter("to", e.target.value)}
                    className="mt-1"
                    data-testid="input-filter-to"
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">المنصة</Label>
                  <Select
                    value={filters.platform}
                    onValueChange={(v) => updateFilter("platform", v)}
                  >
                    <SelectTrigger className="mt-1" data-testid="select-platform">
                      <SelectValue placeholder="جميع المنصات" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع المنصات</SelectItem>
                      {PLATFORMS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">نوع المحتوى</Label>
                  <Select
                    value={filters.contentVertical}
                    onValueChange={(v) => updateFilter("contentVertical", v)}
                  >
                    <SelectTrigger className="mt-1" data-testid="select-vertical">
                      <SelectValue placeholder="جميع الأنواع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الأنواع</SelectItem>
                      {VERTICALS.map((v) => (
                        <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">الشعور</Label>
                  <Select
                    value={filters.aiSentiment}
                    onValueChange={(v) => updateFilter("aiSentiment", v)}
                  >
                    <SelectTrigger className="mt-1" data-testid="select-sentiment">
                      <SelectValue placeholder="جميع المشاعر" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع المشاعر</SelectItem>
                      {SENTIMENTS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">الموضوع</Label>
                  <Select
                    value={filters.aiTopic}
                    onValueChange={(v) => updateFilter("aiTopic", v)}
                  >
                    <SelectTrigger className="mt-1" data-testid="select-topic">
                      <SelectValue placeholder="جميع المواضيع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع المواضيع</SelectItem>
                      {TOPICS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">حالة التحليل</Label>
                  <Select
                    value={filters.analysisStatus}
                    onValueChange={(v) => updateFilter("analysisStatus", v)}
                  >
                    <SelectTrigger className="mt-1" data-testid="select-status">
                      <SelectValue placeholder="جميع الحالات" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الحالات</SelectItem>
                      {STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex-1 space-y-4">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">الترتيب:</span>
                <Select
                  value={filters.sortBy}
                  onValueChange={(v) => updateFilter("sortBy", v)}
                >
                  <SelectTrigger className="w-36" data-testid="select-sort">
                    <SelectValue placeholder="ترتيب حسب" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilter("sortOrder", filters.sortOrder === "asc" ? "desc" : "asc")}
                  data-testid="button-sort-order"
                >
                  {filters.sortOrder === "asc" ? "تصاعدي" : "تنازلي"}
                </Button>
              </div>

              <Select
                value={String(filters.limit)}
                onValueChange={(v) => updateFilter("limit", parseInt(v))}
              >
                <SelectTrigger className="w-24" data-testid="select-limit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24 text-right">المنصة</TableHead>
                    <TableHead className="min-w-[200px] text-right">المحتوى</TableHead>
                    <TableHead className="w-24 text-right">الشعور</TableHead>
                    <TableHead className="w-24 text-left" dir="ltr">الوصول</TableHead>
                    <TableHead className="w-24 text-left" dir="ltr">التفاعل</TableHead>
                    <TableHead className="w-32 text-right">التاريخ</TableHead>
                    <TableHead className="w-16 text-right">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                      </TableRow>
                    ))
                  ) : data?.mentions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        لا توجد منشورات تطابق الفلاتر المحددة
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.mentions.map((mention) => (
                      <TableRow 
                        key={mention.id} 
                        className="cursor-pointer hover-elevate"
                        onClick={() => navigate(`/post/${mention.id}`)}
                        data-testid={`row-mention-${mention.id}`}
                      >
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {(mention as any).sourceName || mention.platform || "غير معروف"}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate" title={(mention as any).cleanText || mention.text || ""} dir="auto">
                            {truncateText((mention as any).cleanText || mention.text)}
                          </div>
                          {mention.authorHandle && (
                            <div className="text-xs text-muted-foreground mt-1" dir="ltr">
                              @{mention.authorHandle}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {mention.analysisStatus === "done" 
                            ? getSentimentBadge(mention.aiSentiment)
                            : <span className="text-xs text-muted-foreground">قيد التحليل</span>
                          }
                        </TableCell>
                        <TableCell className="text-left font-mono text-sm" dir="ltr">
                          {mention.reach?.toLocaleString() || "-"}
                        </TableCell>
                        <TableCell className="text-left font-mono text-sm" dir="ltr">
                          {mention.engagement?.toLocaleString() || "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground" dir="ltr">
                          {formatDate(mention.dateTime as string)}
                        </TableCell>
                        <TableCell>
                          {getStatusIcon(mention.analysisStatus)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between gap-4 p-4 border-t">
                <span className="text-sm text-muted-foreground">
                  عرض {((filters.page - 1) * filters.limit) + 1} - {Math.min(filters.page * filters.limit, data.total)} من {data.total.toLocaleString("ar-SA")}
                </span>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={filters.page >= data.totalPages}
                    onClick={() => updateFilter("page", filters.page + 1)}
                    data-testid="button-next-page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  
                  <span className="text-sm px-2">
                    صفحة {filters.page} من {data.totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={filters.page <= 1}
                    onClick={() => updateFilter("page", filters.page - 1)}
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

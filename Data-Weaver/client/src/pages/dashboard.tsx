import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend, TooltipProps
} from "recharts";
import { 
  TrendingUp, TrendingDown, Minus, Users, Eye, MessageSquare, 
  ThumbsDown, Calendar, Hash, User, Globe, FileText, X, ExternalLink, Clock,
  ArrowUpDown, ChevronDown, Loader2
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PeriodComparison, Mention } from "@shared/schema";
import { format, subDays, differenceInHours, parseISO } from "date-fns";
import { ar } from "date-fns/locale";

const SENTIMENT_COLORS: Record<string, string> = {
  "إيجابي": "hsl(142 76% 36%)",
  "سلبي": "hsl(0 84% 60%)",
  "محايد": "hsl(220 9% 46%)",
};

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

interface FilteredPost {
  id: string;
  text: string;
  platform: string;
  authorName: string;
  authorHandle: string;
  dateTime: string;
  url: string;
  sentiment?: string;
  topic?: string;
}

interface ActiveFilter {
  type: string;
  value: string;
  label: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm text-muted-foreground">
            {entry.name}: <span className="font-medium text-foreground">{entry.value?.toLocaleString("ar-SA")}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const now = new Date();
  const weekAgo = subDays(now, 7);
  
  const [dateRange, setDateRange] = useState({
    from: format(weekAgo, "yyyy-MM-dd'T'HH:mm"),
    to: format(now, "yyyy-MM-dd'T'HH:mm"),
  });
  const [appliedRange, setAppliedRange] = useState(dateRange);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<FilteredPost[]>([]);
  const [drawerTitle, setDrawerTitle] = useState("");
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [totalPosts, setTotalPosts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [sortBy, setSortBy] = useState("date_time");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [currentFilters, setCurrentFilters] = useState<Record<string, string>>({});

  const { data, isLoading, refetch } = useQuery<PeriodComparison>({
    queryKey: ["/api/dashboard/stats", appliedRange.from, appliedRange.to],
    queryFn: async () => {
      const params = new URLSearchParams({ from: appliedRange.from, to: appliedRange.to });
      const res = await fetch(`/api/dashboard/stats?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const isHourlyMode = useMemo(() => {
    const fromDate = parseISO(appliedRange.from);
    const toDate = parseISO(appliedRange.to);
    return differenceInHours(toDate, fromDate) <= 24;
  }, [appliedRange.from, appliedRange.to]);

  const handleApplyDateRange = () => {
    setAppliedRange(dateRange);
    refetch();
  };

  const formatNumber = (num: number | undefined) => {
    if (num === undefined || num === null) return "0";
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)} مليار`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)} مليون`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)} ألف`;
    return num.toLocaleString("ar-SA");
  };

  const getChangeIndicator = (change: number | undefined) => {
    if (change === undefined || change === 0) {
      return { icon: Minus, color: "text-muted-foreground", text: "0%" };
    }
    if (change > 0) {
      return { icon: TrendingUp, color: "text-green-600 dark:text-green-400", text: `+${change.toFixed(1)}%` };
    }
    return { icon: TrendingDown, color: "text-red-600 dark:text-red-400", text: `${change.toFixed(1)}%` };
  };

  const normalizeHandle = (handle: string | null | undefined): string => {
    if (!handle) return "غير معروف";
    let cleaned = handle.trim();
    while (cleaned.startsWith("@@")) {
      cleaned = cleaned.substring(1);
    }
    if (!cleaned.startsWith("@") && cleaned !== "غير معروف") {
      cleaned = "@" + cleaned;
    }
    return cleaned;
  };

  const mapMentionToPost = (m: Mention): FilteredPost => ({
    id: m.id,
    text: m.cleanText || m.hitSentence || "",
    platform: m.sourceName || m.platform || "غير معروف",
    authorName: m.authorName || "غير معروف",
    authorHandle: normalizeHandle(m.authorHandle),
    dateTime: m.dateTime ? format(new Date(m.dateTime), "dd/MM/yyyy HH:mm", { locale: ar }) : "",
    url: m.url || "",
    sentiment: m.aiSentiment || undefined,
    topic: m.aiTopic || undefined,
  });

  const fetchFilteredPosts = async (
    filters: Record<string, string>, 
    title: string,
    page: number = 1,
    sort: string = sortBy,
    order: "desc" | "asc" = sortOrder,
    append: boolean = false
  ) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoadingPosts(true);
      setDrawerTitle(title);
      setIsDrawerOpen(true);
      setCurrentFilters(filters);
      setCurrentPage(1);
    }
    
    try {
      const params = new URLSearchParams({
        ...filters,
        from: appliedRange.from,
        to: appliedRange.to,
        limit: "50",
        page: String(page),
        sortBy: sort,
        sortOrder: order,
      });
      
      const res = await fetch(`/api/explore?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      const result = await res.json();
      
      const posts: FilteredPost[] = (result.mentions || []).map(mapMentionToPost);
      setTotalPosts(result.total || 0);
      
      if (append) {
        setFilteredPosts(prev => [...prev, ...posts]);
        setCurrentPage(page);
      } else {
        setFilteredPosts(posts);
        const newFilters: ActiveFilter[] = [];
        if (filters.aiSentiment) newFilters.push({ type: "sentiment", value: filters.aiSentiment, label: filters.aiSentiment });
        if (filters.platform) newFilters.push({ type: "platform", value: filters.platform, label: filters.platform });
        if (filters.aiTopic) newFilters.push({ type: "topic", value: filters.aiTopic, label: filters.aiTopic });
        if (filters.contentVertical) newFilters.push({ type: "vertical", value: filters.contentVertical, label: filters.contentVertical });
        if (filters.authorHandle) newFilters.push({ type: "author", value: filters.authorHandle, label: filters.authorHandle });
        setActiveFilters(newFilters);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
      if (!append) setFilteredPosts([]);
    } finally {
      setIsLoadingPosts(false);
      setIsLoadingMore(false);
    }
  };

  const handleChartClick = (filterKey: string, filterValue: string, title: string) => {
    setSortBy("date_time");
    setSortOrder("desc");
    fetchFilteredPosts({ [filterKey]: filterValue }, title, 1, "date_time", "desc");
  };

  const loadMorePosts = () => {
    fetchFilteredPosts(currentFilters, drawerTitle, currentPage + 1, sortBy, sortOrder, true);
  };

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy);
    fetchFilteredPosts(currentFilters, drawerTitle, 1, newSortBy, sortOrder);
  };

  const handleOrderChange = (newOrder: "desc" | "asc") => {
    setSortOrder(newOrder);
    fetchFilteredPosts(currentFilters, drawerTitle, 1, sortBy, newOrder);
  };

  const clearFilters = () => {
    setActiveFilters([]);
    setFilteredPosts([]);
    setIsDrawerOpen(false);
    setTotalPosts(0);
    setCurrentPage(1);
  };

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const date = parseISO(dateStr);
      if (isHourlyMode) {
        return format(date, "HH:mm", { locale: ar });
      }
      return format(date, "dd/MM", { locale: ar });
    } catch {
      return dateStr;
    }
  };

  const sentimentTrendData = useMemo(() => {
    if (!data?.current.timelineData) return [];
    return data.current.timelineData.map((item: any) => ({
      ...item,
      date: formatDateLabel(item.date),
    }));
  }, [data?.current.timelineData, isHourlyMode]);

  const kpiCards = [
    {
      title: "عدد المنشورات",
      value: data?.current.totalMentions,
      change: data?.changes.mentions,
      icon: MessageSquare,
      onClick: () => fetchFilteredPosts({}, "جميع المنشورات"),
    },
    {
      title: "الوصول",
      value: data?.current.totalReach,
      change: data?.changes.reach,
      icon: Eye,
      onClick: () => fetchFilteredPosts({}, "جميع المنشورات"),
    },
    {
      title: "التفاعل",
      value: data?.current.totalEngagement,
      change: data?.changes.engagement,
      icon: Users,
      onClick: () => fetchFilteredPosts({}, "جميع المنشورات"),
    },
    {
      title: "نسبة السلبي",
      value: data?.current.negativePercentage,
      change: data?.changes.negativePercentage,
      icon: ThumbsDown,
      isPercentage: true,
      invertColor: true,
      onClick: () => handleChartClick("aiSentiment", "سلبي", "المنشورات السلبية"),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">لوحة التحكم</h1>
          <p className="text-sm text-muted-foreground mt-1">
            نظرة عامة على مؤشرات الرصد الاجتماعي
          </p>
        </div>
        
        {data && (
          <Badge variant="secondary" className="text-xs" data-testid="badge-analysis-status">
            تم التحليل: {data.current.analyzedCount} | بانتظار التحليل: {data.current.pendingCount}
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 p-4 bg-card rounded-lg border">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">الفترة الزمنية:</span>
        <div className="flex items-center gap-2">
          <Input
            type="datetime-local"
            value={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            className="w-48"
            data-testid="input-datetime-from"
          />
          <Clock className="h-4 w-4 text-muted-foreground" />
        </div>
        <span className="text-muted-foreground">إلى</span>
        <div className="flex items-center gap-2">
          <Input
            type="datetime-local"
            value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            className="w-48"
            data-testid="input-datetime-to"
          />
          <Clock className="h-4 w-4 text-muted-foreground" />
        </div>
        <Button onClick={handleApplyDateRange} data-testid="button-apply-date">
          تطبيق
        </Button>
        {isHourlyMode && (
          <Badge variant="outline" className="text-xs">
            عرض بالساعة
          </Badge>
        )}
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <span className="text-sm text-muted-foreground">الفلاتر النشطة:</span>
          {activeFilters.map((filter, index) => (
            <Badge key={index} variant="secondary" className="gap-1">
              {filter.label}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => {
                  const newFilters = activeFilters.filter((_, i) => i !== index);
                  setActiveFilters(newFilters);
                  if (newFilters.length === 0) {
                    setIsDrawerOpen(false);
                  }
                }}
              />
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            إلغاء الكل
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-9 w-20 mb-2" />
                <Skeleton className="h-4 w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          kpiCards.map((kpi, index) => {
            const change = getChangeIndicator(kpi.change);
            const ChangeIcon = change.icon;
            
            return (
              <Card 
                key={index} 
                className="cursor-pointer hover-elevate active-elevate-2"
                onClick={kpi.onClick}
                data-testid={`card-kpi-${index}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-sm text-muted-foreground">{kpi.title}</span>
                    <kpi.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-3xl font-semibold mb-2" dir="ltr">
                    {kpi.isPercentage 
                      ? `${(kpi.value ?? 0).toFixed(1)}%`
                      : formatNumber(kpi.value)
                    }
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${kpi.invertColor ? (kpi.change && kpi.change > 0 ? "text-red-600 dark:text-red-400" : change.color) : change.color}`}>
                    <ChangeIcon className="h-3 w-3" />
                    <span dir="ltr">{change.text}</span>
                    <span className="text-muted-foreground">مقارنة بالفترة السابقة</span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">تحليل المشاعر</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-4 text-center">توزيع المشاعر</h4>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={data?.current.sentimentBreakdown?.map(item => ({
                        ...item,
                        label: item.sentiment
                      })) || []}
                      dataKey="count"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={2}
                      onClick={(entry) => handleChartClick("aiSentiment", entry.sentiment, entry.sentiment)}
                      className="cursor-pointer"
                    >
                      {data?.current.sentimentBreakdown?.map((entry, index) => (
                        <Cell 
                          key={index} 
                          fill={SENTIMENT_COLORS[entry.sentiment] || CHART_COLORS[index % CHART_COLORS.length]}
                          stroke="hsl(var(--background))"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      formatter={(value) => <span className="text-foreground text-sm">{value}</span>}
                      wrapperStyle={{ paddingTop: 16 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-4 text-center">اتجاه المشاعر عبر الزمن</h4>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={sentimentTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      fontSize={11}
                      tick={{ fill: "hsl(var(--foreground))" }}
                      tickFormatter={formatDateLabel}
                    />
                    <YAxis 
                      fontSize={11} 
                      orientation="right"
                      tick={{ fill: "hsl(var(--foreground))" }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      formatter={(value) => <span className="text-foreground text-sm">{value}</span>}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="positive" 
                      name="إيجابي"
                      stroke={SENTIMENT_COLORS["إيجابي"]}
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="negative" 
                      name="سلبي"
                      stroke={SENTIMENT_COLORS["سلبي"]}
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="neutral" 
                      name="محايد"
                      stroke={SENTIMENT_COLORS["محايد"]}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">توزيع المنصات</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={256}>
                <BarChart 
                  data={data?.current.platformBreakdown || []} 
                  layout="vertical"
                  margin={{ right: 16, left: 8 }}
                >
                  <XAxis 
                    type="number" 
                    tick={{ fill: "hsl(var(--foreground))", fontSize: 11 }}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="platform" 
                    width={80} 
                    orientation="right"
                    tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="count" 
                    name="عدد المنشورات"
                    fill="hsl(var(--chart-1))" 
                    radius={[4, 0, 0, 4]}
                    onClick={(entry) => handleChartClick("platform", entry.platform, entry.platform)}
                    className="cursor-pointer"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">توزيع المواضيع</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={256}>
                <BarChart 
                  data={data?.current.topicBreakdown || []} 
                  layout="vertical"
                  margin={{ right: 16, left: 8 }}
                >
                  <XAxis 
                    type="number"
                    tick={{ fill: "hsl(var(--foreground))", fontSize: 11 }}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="topic" 
                    width={100} 
                    fontSize={11} 
                    orientation="right"
                    tick={{ fill: "hsl(var(--foreground))" }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="count" 
                    name="عدد المنشورات"
                    fill="hsl(var(--chart-2))" 
                    radius={[4, 0, 0, 4]}
                    onClick={(entry) => handleChartClick("aiTopic", entry.topic, entry.topic)}
                    className="cursor-pointer"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">نوع المحتوى</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={256}>
                <PieChart>
                  <Pie
                    data={data?.current.verticalBreakdown || []}
                    dataKey="count"
                    nameKey="vertical"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={75}
                    paddingAngle={2}
                    onClick={(entry) => handleChartClick("contentVertical", entry.vertical, entry.vertical)}
                    className="cursor-pointer"
                  >
                    {data?.current.verticalBreakdown?.map((_, index) => (
                      <Cell 
                        key={index} 
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                        stroke="hsl(var(--background))"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    formatter={(value) => <span className="text-foreground text-sm">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">المنشورات عبر الزمن</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={256}>
                <LineChart data={data?.current.timelineData || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    fontSize={11}
                    tick={{ fill: "hsl(var(--foreground))" }}
                    tickFormatter={formatDateLabel}
                  />
                  <YAxis 
                    fontSize={11} 
                    orientation="right"
                    tick={{ fill: "hsl(var(--foreground))" }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="mentions" 
                    name="المنشورات"
                    stroke="hsl(var(--chart-1))" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">الوصول عبر الزمن</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={256}>
                <LineChart data={data?.current.timelineData || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    fontSize={11}
                    tick={{ fill: "hsl(var(--foreground))" }}
                    tickFormatter={formatDateLabel}
                  />
                  <YAxis 
                    fontSize={11} 
                    orientation="right"
                    tick={{ fill: "hsl(var(--foreground))" }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="reach" 
                    name="الوصول"
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              أكثر المؤلفين تفاعلاً
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : data?.current.topAuthors && data.current.topAuthors.length > 0 ? (
              <div className="space-y-3">
                {data.current.topAuthors.map((author: any, index: number) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between gap-4 p-2 rounded-lg hover-elevate cursor-pointer"
                    onClick={() => fetchFilteredPosts({ authorHandle: author.handle }, `منشورات ${author.name}`)}
                    data-testid={`author-${index}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm text-muted-foreground w-5">{index + 1}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{author.name}</p>
                        <p className="text-xs text-muted-foreground truncate" dir="ltr">
                          {normalizeHandle(author.handle)}
                        </p>
                      </div>
                    </div>
                    <div className="text-left shrink-0">
                      <p className="text-sm font-medium" dir="ltr">{formatNumber(author.engagement)}</p>
                      <p className="text-xs text-muted-foreground">{author.count} منشور</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">لا توجد بيانات</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Hash className="h-4 w-4" />
              أكثر الهاشتاقات تكراراً
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : data?.current.topHashtags && data.current.topHashtags.length > 0 ? (
              <div className="space-y-3">
                {data.current.topHashtags.map((item: any, index: number) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between gap-4 p-2 rounded-lg hover-elevate cursor-pointer"
                    data-testid={`hashtag-${index}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm text-muted-foreground w-5">{index + 1}</span>
                      <p className="text-sm font-medium truncate" dir="ltr">#{item.hashtag}</p>
                    </div>
                    <Badge variant="secondary">{item.count}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Hash className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">لا توجد بيانات</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Globe className="h-4 w-4" />
              توزيع اللغات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : data?.current.languageBreakdown && data.current.languageBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={256}>
                <BarChart 
                  data={data.current.languageBreakdown} 
                  layout="vertical"
                  margin={{ right: 16, left: 8 }}
                >
                  <XAxis 
                    type="number"
                    tick={{ fill: "hsl(var(--foreground))", fontSize: 11 }}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="language" 
                    width={70} 
                    orientation="right"
                    tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="count" 
                    name="عدد المنشورات"
                    fill="hsl(var(--chart-3))" 
                    radius={[4, 0, 0, 4]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">لا توجد بيانات</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Globe className="h-4 w-4" />
              توزيع الدول
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : data?.current.countryBreakdown && data.current.countryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={256}>
                <BarChart 
                  data={data.current.countryBreakdown} 
                  layout="vertical"
                  margin={{ right: 16, left: 8 }}
                >
                  <XAxis 
                    type="number"
                    tick={{ fill: "hsl(var(--foreground))", fontSize: 11 }}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="country" 
                    width={70} 
                    orientation="right"
                    tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="count" 
                    name="عدد المنشورات"
                    fill="hsl(var(--chart-4))" 
                    radius={[4, 0, 0, 4]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">لا توجد بيانات</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {!isLoading && (!data || data.current.totalMentions === 0) && (
        <Card className="border-dashed">
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">لا توجد بيانات</h3>
              <p className="text-sm mb-4">ارفع ملف CSV من صفحة الإدارة للبدء</p>
              <Button onClick={() => window.location.href = "/admin"} data-testid="button-go-to-admin">
                الذهاب لصفحة الإدارة
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col">
          <SheetHeader className="border-b pb-4 shrink-0">
            <SheetTitle className="text-right">{drawerTitle}</SheetTitle>
            <div className="flex items-center justify-between gap-2">
              <Badge variant="secondary" className="text-xs">
                {totalPosts.toLocaleString("ar-SA")} نتيجة
              </Badge>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                إلغاء التصفية
              </Button>
            </div>
            
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <Select value={sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-32" data-testid="select-sort-by">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date_time">التاريخ</SelectItem>
                    <SelectItem value="reach">الوصول</SelectItem>
                    <SelectItem value="engagement">التفاعل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Select value={sortOrder} onValueChange={(v) => handleOrderChange(v as "desc" | "asc")}>
                <SelectTrigger className="w-28" data-testid="select-sort-order">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">تنازلي</SelectItem>
                  <SelectItem value="asc">تصاعدي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </SheetHeader>
          
          <ScrollArea className="flex-1 mt-4">
            {isLoadingPosts ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-16 w-full mb-2" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                ))}
              </div>
            ) : filteredPosts.length > 0 ? (
              <div className="space-y-4 pl-2">
                {filteredPosts.map((post, index) => (
                  <div 
                    key={post.id || index} 
                    className="p-4 border rounded-lg hover-elevate"
                    data-testid={`post-${index}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {post.platform}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{post.dateTime}</span>
                    </div>
                    
                    <p className="text-sm mb-3 line-clamp-3">{post.text}</p>
                    
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-muted-foreground truncate">
                          {post.authorName}
                        </span>
                        <span className="text-xs text-muted-foreground" dir="ltr">
                          {post.authorHandle}
                        </span>
                      </div>
                      
                      {post.url && (
                        <a 
                          href={post.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                    
                    {(post.sentiment || post.topic) && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {post.sentiment && (
                          <Badge 
                            variant="secondary" 
                            className="text-xs"
                            style={{ 
                              backgroundColor: SENTIMENT_COLORS[post.sentiment] + "20",
                              color: SENTIMENT_COLORS[post.sentiment]
                            }}
                          >
                            {post.sentiment}
                          </Badge>
                        )}
                        {post.topic && (
                          <Badge variant="outline" className="text-xs">
                            {post.topic}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                
                {filteredPosts.length < totalPosts && (
                  <div className="py-4 text-center">
                    <Button
                      variant="outline"
                      onClick={loadMorePosts}
                      disabled={isLoadingMore}
                      data-testid="button-load-more"
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin ml-2" />
                          جاري التحميل...
                        </>
                      ) : (
                        <>
                          تحميل المزيد ({(totalPosts - filteredPosts.length).toLocaleString("ar-SA")} متبقي)
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">لا توجد نتائج</p>
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}

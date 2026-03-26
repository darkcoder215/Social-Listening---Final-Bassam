import { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThumbsUp, ExternalLink, User, MessageCircle, ArrowUpDown, Play } from "lucide-react";
import { SiTiktok, SiInstagram, SiYoutube } from "react-icons/si";
import { FaXTwitter } from "react-icons/fa6";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export interface CommentItem {
  platform: "tiktok" | "instagram" | "youtube" | "x";
  accountName: string;
  text: string;
  timestamp: string;
  username: string;
  likeCount: number;
  originalUrl: string;
  profileThumbnail?: string;
  videoTitle?: string;
  videoThumbnailUrl?: string;
}

type SortOption = "newest" | "oldest" | "most-likes" | "channel";

interface CommentsSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: string | null;
  comments: CommentItem[];
  isLoading?: boolean;
}

function getPlatformIcon(platform: CommentItem["platform"]) {
  switch (platform) {
    case "tiktok":
      return <SiTiktok className="h-4 w-4" />;
    case "instagram":
      return <SiInstagram className="h-4 w-4" />;
    case "youtube":
      return <SiYoutube className="h-4 w-4" />;
    case "x":
      return <FaXTwitter className="h-4 w-4" />;
  }
}

function getPlatformName(platform: CommentItem["platform"]) {
  switch (platform) {
    case "tiktok":
      return "تيك توك";
    case "instagram":
      return "انستقرام";
    case "youtube":
      return "يوتيوب";
    case "x":
      return "إكس";
  }
}

function getPlatformColor(platform: CommentItem["platform"]) {
  switch (platform) {
    case "tiktok":
      return "bg-black text-white";
    case "instagram":
      return "bg-gradient-to-br from-purple-500 to-pink-500 text-white";
    case "youtube":
      return "bg-red-600 text-white";
    case "x":
      return "bg-black text-white";
  }
}

function safeFormatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return format(d, "d MMM yyyy - HH:mm", { locale: ar });
  } catch {
    return dateStr;
  }
}

export function CommentsSidebar({
  open,
  onOpenChange,
  selectedDate,
  comments,
  isLoading = false,
}: CommentsSidebarProps) {
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterChannel, setFilterChannel] = useState<string>("all");

  const formattedDate = selectedDate ? (() => {
    try {
      const d = new Date(selectedDate);
      if (isNaN(d.getTime())) return selectedDate;
      return format(d, "EEEE، d MMMM yyyy", { locale: ar });
    } catch {
      return selectedDate;
    }
  })() : "";

  const channels = useMemo(() => {
    const uniqueChannels = new Set(comments.map(c => c.accountName).filter(Boolean));
    return Array.from(uniqueChannels).sort();
  }, [comments]);

  const sortedComments = useMemo(() => {
    let filtered = [...comments];
    
    if (filterChannel !== "all") {
      filtered = filtered.filter(c => c.accountName === filterChannel);
    }

    switch (sortBy) {
      case "newest":
        return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      case "oldest":
        return filtered.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      case "most-likes":
        return filtered.sort((a, b) => b.likeCount - a.likeCount);
      case "channel":
        return filtered.sort((a, b) => a.accountName.localeCompare(b.accountName, "ar"));
      default:
        return filtered;
    }
  }, [comments, sortBy, filterChannel]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[50vw] sm:max-w-[50vw] p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <span>تعليقات يوم {formattedDate}</span>
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            {sortedComments.length} تعليق {filterChannel !== "all" ? `من ${filterChannel}` : ""}
          </p>
          
          <div className="flex gap-2 mt-3 flex-wrap">
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[140px]" data-testid="select-sort">
                <ArrowUpDown className="h-4 w-4 ml-2" />
                <SelectValue placeholder="ترتيب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest" data-testid="sort-newest">الأحدث أولاً</SelectItem>
                <SelectItem value="oldest" data-testid="sort-oldest">الأقدم أولاً</SelectItem>
                <SelectItem value="most-likes" data-testid="sort-likes">الأكثر إعجاباً</SelectItem>
                <SelectItem value="channel" data-testid="sort-channel">حسب القناة</SelectItem>
              </SelectContent>
            </Select>

            {channels.length > 1 && (
              <Select value={filterChannel} onValueChange={setFilterChannel}>
                <SelectTrigger className="w-[160px]" data-testid="select-channel-filter">
                  <SelectValue placeholder="كل القنوات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" data-testid="filter-all">كل القنوات</SelectItem>
                  {channels.map(ch => (
                    <SelectItem key={ch} value={ch} data-testid={`filter-channel-${ch}`}>
                      {ch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-180px)]">
          <div className="p-4 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : sortedComments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد تعليقات في هذا اليوم
              </div>
            ) : (
              sortedComments.map((comment, idx) => (
                <Card key={idx} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Avatar className="h-10 w-10">
                          {comment.profileThumbnail ? (
                            <AvatarImage src={comment.profileThumbnail} alt={comment.username} />
                          ) : null}
                          <AvatarFallback className={getPlatformColor(comment.platform)}>
                            {getPlatformIcon(comment.platform)}
                          </AvatarFallback>
                        </Avatar>
                        
                        {comment.videoThumbnailUrl && (
                          <a 
                            href={comment.originalUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block relative group"
                            title={comment.videoTitle || "View video"}
                          >
                            <img 
                              src={comment.videoThumbnailUrl} 
                              alt={comment.videoTitle || "Video thumbnail"}
                              className="w-10 h-10 object-cover rounded-md bg-muted"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                              <Play className="h-4 w-4 text-white" />
                            </div>
                          </a>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge variant="outline" className="text-xs gap-1">
                            {getPlatformIcon(comment.platform)}
                            {getPlatformName(comment.platform)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {comment.accountName}
                          </span>
                        </div>

                        <p className="text-sm font-medium mb-1 truncate" dir="auto">
                          @{comment.username}
                        </p>

                        {comment.videoTitle && (
                          <p className="text-xs text-muted-foreground mb-1 line-clamp-1" dir="auto">
                            {comment.videoTitle}
                          </p>
                        )}

                        <p className="text-sm text-foreground mb-2 line-clamp-3" dir="auto">
                          {comment.text}
                        </p>

                        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span>{safeFormatDate(comment.timestamp)}</span>
                          <div className="flex items-center gap-3">
                            {comment.likeCount > 0 && (
                              <span className="flex items-center gap-1">
                                <ThumbsUp className="h-3 w-3" />
                                {comment.likeCount.toLocaleString("ar-SA")}
                              </span>
                            )}
                            {comment.originalUrl && (
                              <a
                                href={comment.originalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 hover:text-primary transition-colors"
                                data-testid="link-original"
                              >
                                <ExternalLink className="h-3 w-3" />
                                عرض الأصلي
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

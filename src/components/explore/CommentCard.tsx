import { useState } from "react";
import { Heart, CornerDownLeft, Image as ImageIcon, Play } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import type { EnrichedComment } from "@/lib/db-types";
import { PLATFORM_COLORS } from "@/lib/db-types";
import { PLATFORM_ICON_MAP } from "@/components/icons/PlatformIcons";

function relativeTime(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ar });
  } catch {
    return "";
  }
}

export default function CommentCard({ comment }: { comment: EnrichedComment }) {
  const c = comment;
  const platformColor = PLATFORM_COLORS[c.platform];
  const [thumbError, setThumbError] = useState(false);
  const hasThumbnail = !!c.parentPostThumbnail && !thumbError;

  return (
    <div className="group rounded-xl bg-card border border-border/40 p-4 hover:border-border/60 transition-colors" dir="rtl">
      <div className="flex gap-3">
        {/* RIGHT: Avatar (40px circle) */}
        <div className="shrink-0">
          {c.authorAvatar ? (
            <img
              src={c.authorAvatar}
              alt=""
              className="w-10 h-10 rounded-full object-cover bg-muted/20"
              loading="lazy"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[12px] font-bold"
              style={{ backgroundColor: platformColor }}
            >
              {c.authorName.charAt(0)}
            </div>
          )}
        </div>

        {/* LEFT: Content */}
        <div className="flex-1 min-w-0">
          {/* Header: author + time */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {(() => { const PIcon = PLATFORM_ICON_MAP[c.platform]; return PIcon ? <PIcon className="w-3 h-3" style={{ color: platformColor }} /> : null; })()}
            <span className="text-[12px] font-bold text-foreground/80">
              {c.authorName}
            </span>
            {c.accountName && (
              <span className="text-[10px] font-bold text-muted-foreground/40 bg-muted/10 px-1.5 py-0.5 rounded">
                {c.accountName}
              </span>
            )}
            {c.isVerified && (
              <svg className="w-3.5 h-3.5 text-thmanyah-blue" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            )}
            {c.isReply && (
              <span className="flex items-center gap-0.5 text-[9px] font-bold text-muted-foreground/40 bg-muted/10 px-1.5 py-0.5 rounded">
                <CornerDownLeft className="w-2.5 h-2.5" /> رد
              </span>
            )}
            <span className="text-[10px] font-bold text-muted-foreground/30 mr-auto" dir="ltr">
              {relativeTime(c.createdAt)}
            </span>
          </div>

          {/* Comment text */}
          <p className="text-[12px] font-bold text-foreground/70 leading-relaxed mb-2 whitespace-pre-wrap">
            {c.text}
          </p>

          {/* Sentiment badges */}
          {(c.sentimentLabel || c.hostilityLabel || c.overviewText) && (
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {c.sentimentLabel && (
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold text-white ${
                  c.sentimentLabel === "positive" ? "bg-[#00C17A]" :
                  c.sentimentLabel === "negative" ? "bg-[#EF4444]" :
                  c.sentimentLabel === "mockery" ? "bg-[#F59E0B]" :
                  "bg-[#6B7280]"
                }`}>
                  {c.sentimentLabel === "positive" ? "إيجابي" :
                   c.sentimentLabel === "negative" ? "سلبي" :
                   c.sentimentLabel === "mockery" ? "سخرية" : "محايد"}
                </span>
              )}
              {c.hostilityLabel && c.hostilityLabel !== "none" && (
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold text-white ${
                  c.hostilityLabel === "high" ? "bg-[#EF4444]" :
                  c.hostilityLabel === "medium" ? "bg-[#F97316]" :
                  "bg-[#FBBF24]"
                }`}>
                  عدائية: {c.hostilityLabel === "high" ? "عالية" : c.hostilityLabel === "medium" ? "متوسطة" : "منخفضة"}
                </span>
              )}
            </div>
          )}
          {c.overviewText && (
            <p className="text-[10px] font-bold text-muted-foreground/40 leading-relaxed mb-2">
              {c.overviewText}
            </p>
          )}

          {/* Likes & replies */}
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground/40">
              <Heart className="w-3 h-3" />
              <span dir="ltr">{c.likes}</span>
            </span>
            {c.replyCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground/40">
                <CornerDownLeft className="w-3 h-3" />
                <span dir="ltr">{c.replyCount}</span> رد
              </span>
            )}
          </div>

          {/* Post thumbnail row (below comment) */}
          {c.parentPostId && (c.parentPostThumbnail || c.parentPostText) && (
            <a
              href={c.parentPostUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-1.5 rounded-lg bg-muted/5 border border-border/30 hover:border-border/50 transition-colors max-w-fit"
            >
              {/* Thumbnail or placeholder */}
              {hasThumbnail ? (
                <div className="relative w-8 h-8 rounded-md overflow-hidden bg-muted/20 shrink-0">
                  <img
                    src={c.parentPostThumbnail}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={() => setThumbError(true)}
                  />
                  {c.platform === "youtube" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play className="w-2.5 h-2.5 text-white fill-white" />
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                  style={{ backgroundColor: platformColor + "12" }}
                >
                  <ImageIcon className="w-3.5 h-3.5 text-muted-foreground/30" />
                </div>
              )}
              {/* Post title/caption */}
              {c.parentPostText && (
                <span className="text-[10px] font-bold text-muted-foreground/50 truncate max-w-[180px]">
                  {c.parentPostText}
                </span>
              )}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

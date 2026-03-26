/**
 * Database row types for social listening tables.
 * These correspond to the Supabase tables at vkxsivktlrjofjhllbya.supabase.co
 */

/* ═══════════════════════════════════════════════════
   TikTok
   ═══════════════════════════════════════════════════ */

export interface TikTokPostRow {
  post_id: string;
  post_url: string | null;
  post_description: string | null;
  post_create_time: string | null;
  post_comment_count: number | null;
  post_like_count: number | null;
  post_share_count: number | null;
  post_play_count: number | null;
  account_username: string | null;
  account_name_ar: string | null;
}

export interface TikTokCommentRow {
  comment_cid: string;
  post_id: string | null;
  comment_text: string | null;
  comment_create_time_iso: string | null;
  comment_digg_count: number | null;
  comment_reply_total: number | null;
  replies_to_id: string | null;
  comment_unique_id: string | null;
  comment_uid: string | null;
  comment_avatar_thumbnail: string | null;
  account_username: string | null;
  account_name_ar: string | null;
}

/* ═══════════════════════════════════════════════════
   Instagram
   ═══════════════════════════════════════════════════ */

export interface InstagramPostRow {
  post_id: string;
  post_url: string | null;
  post_shortcode: string | null;
  post_caption: string | null;
  post_timestamp: string | null;
  post_comments_count: number | null;
  post_likes_count: number | null;
  post_views_count: number | null;
  post_type: string | null;
  post_image_url: string | null;
  account_username: string | null;
  account_name_ar: string | null;
  is_collaboration: boolean | null;
  collaboration_accounts: string[] | null;
}

export interface InstagramCommentRow {
  comment_id: string;
  post_id: string | null;
  comment_text: string | null;
  comment_timestamp: string | null;
  comment_likes: number | null;
  comment_owner_username: string | null;
  comment_owner_is_verified: boolean | null;
  comment_owner_profile_pic: string | null;
  account_username: string | null;
  account_name_ar: string | null;
}

/* ═══════════════════════════════════════════════════
   YouTube
   ═══════════════════════════════════════════════════ */

export interface YouTubeDataRow {
  video_id: string | null;
  video_title: string | null;
  video_description: string | null;
  video_url: string | null;
  video_thumbnail_url: string | null;
  video_view_count: number | null;
  video_like_count: number | null;
  video_comment_count: number | null;
  comment_id: string;
  comment_text: string | null;
  comment_published_at: string | null;
  comment_like_count: number | null;
  author_display_name: string | null;
  author_thumbnail_url: string | null;
  account_name: string | null;
  comment_type: string | null;
  parent_comment_id: string | null;
}

/* ═══════════════════════════════════════════════════
   Normalized types (cross-platform)
   ═══════════════════════════════════════════════════ */

export type Platform = "tiktok" | "instagram" | "youtube" | "x";

export interface PlatformStats {
  total_posts: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  total_views: number;
}

export interface EnrichedComment {
  id: string;
  text: string;
  createdAt: string;
  likes: number;
  authorName: string;
  authorAvatar?: string;
  isVerified?: boolean;
  isReply: boolean;
  replyCount: number;
  parentPostId?: string;
  parentPostText?: string;
  parentPostUrl?: string;
  parentPostThumbnail?: string;
  platform: Platform;
  accountName?: string;
  sentimentLabel?: string;
  hostilityLabel?: string;
  overviewText?: string;
}

export interface ChartPoint {
  date: string;
  count: number;
}

export interface TopPost {
  id: string;
  text: string;
  url: string;
  engagement: number;
  likes: number;
  comments: number;
  views: number;
  account: string;
  accountAr: string;
  platform: Platform;
}

export interface AccountCount {
  account: string;
  accountAr: string;
  count: number;
}

export type DrawerFilter =
  | { type: "date"; date: string; label: string }
  | { type: "post"; postId: string; label: string }
  | { type: "account"; account: string; label: string }
  | { type: "word"; word: string; label: string }
  | { type: "product"; productId: string; label: string }
  | { type: "sentiment"; value: string; label: string }
  | { type: "hostility"; value: string; label: string }
  | { type: "relevance"; value: string; label: string }
  | { type: "topic"; value: string; label: string }
  | { type: "technical_issue"; value: string; label: string }
  | { type: "name_mentioned"; value: string; label: string };

export interface AccountOption {
  username: string;
  nameAr: string;
}

/* ═══════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════ */

export function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("ar-SA");
}

export function fmtNumEn(n: number): string {
  return n.toLocaleString("en-US");
}

/* ═══════════════════════════════════════════════════
   Account lists
   ═══════════════════════════════════════════════════ */

export const TIKTOK_ACCOUNTS: AccountOption[] = [
  { username: "thmanyah", nameAr: "ثمانية" },
  { username: "thmanyahsports", nameAr: "رياضة ثمانية" },
  { username: "thmanyahexit", nameAr: "مخرج ثمانية" },
  { username: "thmanyahliving", nameAr: "معيشة ثمانية" },
  { username: "radiothmanyah", nameAr: "راديو ثمانية" },
];

export const INSTAGRAM_ACCOUNTS: AccountOption[] = [
  { username: "thmanyah", nameAr: "ثمانية" },
  { username: "thmanyahsports", nameAr: "رياضة ثمانية" },
  { username: "thmanyahexit", nameAr: "مخرج ثمانية" },
  { username: "thmanyahliving", nameAr: "معيشة ثمانية" },
  { username: "radiothmanyah", nameAr: "راديو ثمانية" },
];

export const YOUTUBE_ACCOUNTS: AccountOption[] = [
  { username: "ثمانية", nameAr: "ثمانية" },
  { username: "رياضة ثمانية", nameAr: "رياضة ثمانية" },
  { username: "مخرج ثمانية", nameAr: "مخرج ثمانية" },
  { username: "شركة ثمانية", nameAr: "شركة ثمانية" },
  { username: "إذاعة ثمانية", nameAr: "إذاعة ثمانية" },
];

export const PLATFORM_COLORS: Record<Platform, string> = {
  tiktok: "#ff0050",
  instagram: "#E4405F",
  youtube: "#FF0000",
  x: "#1DA1F2",
};

export const PLATFORM_LABELS: Record<Platform, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
  x: "X",
};

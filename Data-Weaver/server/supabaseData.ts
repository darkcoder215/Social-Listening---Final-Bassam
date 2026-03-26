import { supabase } from "./supabase";

export interface XDataRow {
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

export interface TikTokDataRow {
  pulledAtUtc: string;
  accountNameAr: string;
  accountUsername: string;
  postUrl: string;
  postId: string;
  postDescription: string;
  postCreateTime: string;
  postLikeCount: number;
  postCommentCount: number;
  commentCid: string;
  commentText: string;
  commentCreateTimeIso: string;
  commentDiggCount: number;
  commentReplyTotal: number;
  commentUniqueId: string;
  commentUid: string;
  commentAvatarThumbnail: string;
}

export interface InstagramDataRow {
  pulledAtUtc: string;
  accountNameAr: string;
  accountUsername: string;
  postUrl: string;
  postShortcode: string;
  postCaption: string;
  postTimestamp: string;
  postType: string;
  commentId: string;
  commentText: string;
  commentTimestamp: string;
  commentLikes: number;
  commentOwnerUsername: string;
  commentOwnerIsVerified: boolean;
  commentOwnerProfilePic: string;
  commentPostId: string;
  commentIsReply: boolean;
  commentParentId: string;
}

export interface YouTubeDataRow {
  platform: string;
  accountName: string;
  accountChannelId: string;
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
  commentType: string;
  commentId: string;
  parentCommentId: string;
  commentText: string;
  commentPublishedAt: string;
  commentUpdatedAt: string;
  commentLikeCount: number;
  authorDisplayName: string;
  authorChannelId: string;
  authorChannelUrl: string;
  authorThumbnailUrl: string;
  pulledAtUtc: string;
}

function parseNumber(val: any): number {
  if (val === undefined || val === null || val === '') return 0;
  const num = Number(val);
  return isNaN(num) ? 0 : num;
}

function parseBoolean(val: any): boolean {
  if (val === undefined || val === null || val === '') return false;
  if (typeof val === 'boolean') return val;
  return val.toString().toLowerCase() === 'true';
}

const CACHE_TTL = 60 * 1000;

interface RangeCache<T> {
  key: string;
  data: T[];
  timestamp: number;
}

let xCache: RangeCache<XDataRow> | null = null;
let tiktokCache: RangeCache<TikTokDataRow> | null = null;
let instagramCache: RangeCache<InstagramDataRow> | null = null;
let youtubeCache: RangeCache<YouTubeDataRow> | null = null;

function getCacheKey(start: string, end: string): string {
  return `${start}:${end}`;
}

function isCacheValid<T>(cache: RangeCache<T> | null, key: string): cache is RangeCache<T> {
  return cache !== null && cache.key === key && Date.now() - cache.timestamp < CACHE_TTL;
}

export function invalidateCache(platform: 'x' | 'tiktok' | 'instagram' | 'youtube' | 'all'): void {
  if (platform === 'x' || platform === 'all') xCache = null;
  if (platform === 'tiktok' || platform === 'all') tiktokCache = null;
  if (platform === 'instagram' || platform === 'all') instagramCache = null;
  if (platform === 'youtube' || platform === 'all') youtubeCache = null;
}

async function fetchAllPages<T>(
  tableName: string,
  selectColumns: string,
  timestampCol: string,
  startDate: string,
  endDate: string,
  orderCol: string,
  mapFn: (row: any) => T,
  pageSize: number = 1000
): Promise<T[]> {
  const allData: T[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from(tableName)
      .select(selectColumns)
      .gte(timestampCol, startDate)
      .lte(timestampCol, endDate + 'T23:59:59')
      .order(orderCol, { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) {
      if (error.code === '57014') {
        console.log(`${tableName} query timeout after ${allData.length} records, returning partial data`);
        break;
      }
      console.error(`Supabase ${tableName} error:`, error);
      throw new Error(`Failed to fetch ${tableName}: ${error.message}`);
    }

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allData.push(...data.map(mapFn));
      offset += pageSize;
      hasMore = data.length === pageSize;
    }
  }

  return allData;
}

const X_COLUMNS = 'date, time, document_id, url, author_name, author_handle, opening_text, hit_sentence, language, sentiment, engagement, likes, replies, reposts, views, input_name';

const TIKTOK_COLUMNS = 'pulled_at_utc, account_name_ar, account_username, post_url, post_id, post_description, post_create_time, post_like_count, post_comment_count, comment_cid, comment_text, comment_create_time_iso, comment_digg_count, comment_reply_total, comment_unique_id, comment_uid, comment_avatar_thumbnail';

const INSTAGRAM_COLUMNS = 'pulled_at_utc, account_name_ar, account_username, post_url, post_id, post_shortcode, comment_id, comment_text, comment_timestamp, comment_likes, comment_owner_username, comment_owner_is_verified, comment_owner_profile_pic, comment_is_reply, comment_parent_id';

const YOUTUBE_COLUMNS = 'account_name, account_channel_id, video_id, video_title, video_url, video_thumbnail_url, comment_id, comment_text, comment_published_at, comment_like_count, author_display_name';

function mapXRow(row: any): XDataRow {
  return {
    date: row.date || '',
    time: row.time || '',
    documentId: row.document_id || '',
    url: row.url || '',
    authorName: row.author_name || '',
    authorHandle: row.author_handle || '',
    openingText: row.opening_text || '',
    hitSentence: row.hit_sentence || '',
    language: row.language || '',
    sentiment: row.sentiment || '',
    engagement: parseNumber(row.engagement),
    likes: parseNumber(row.likes),
    replies: parseNumber(row.replies),
    reposts: parseNumber(row.reposts),
    views: parseNumber(row.views),
    inputName: row.input_name || '',
  };
}

function mapTikTokRow(row: any): TikTokDataRow {
  return {
    pulledAtUtc: row.pulled_at_utc || '',
    accountNameAr: row.account_name_ar || '',
    accountUsername: row.account_username || '',
    postUrl: row.post_url || '',
    postId: row.post_id || '',
    postDescription: row.post_description || '',
    postCreateTime: row.post_create_time || '',
    postLikeCount: parseNumber(row.post_like_count),
    postCommentCount: parseNumber(row.post_comment_count),
    commentCid: row.comment_cid || '',
    commentText: row.comment_text || '',
    commentCreateTimeIso: row.comment_create_time_iso || '',
    commentDiggCount: parseNumber(row.comment_digg_count),
    commentReplyTotal: parseNumber(row.comment_reply_total),
    commentUniqueId: row.comment_unique_id || '',
    commentUid: row.comment_uid || '',
    commentAvatarThumbnail: row.comment_avatar_thumbnail || '',
  };
}

function mapInstagramRow(row: any): InstagramDataRow {
  return {
    pulledAtUtc: row.pulled_at_utc || '',
    accountNameAr: row.account_name_ar || '',
    accountUsername: row.account_username || '',
    postUrl: row.post_url || '',
    postShortcode: row.post_shortcode || '',
    postCaption: '',
    postTimestamp: '',
    postType: '',
    commentId: row.comment_id || '',
    commentText: row.comment_text || '',
    commentTimestamp: row.comment_timestamp || '',
    commentLikes: parseNumber(row.comment_likes),
    commentOwnerUsername: row.comment_owner_username || '',
    commentOwnerIsVerified: parseBoolean(row.comment_owner_is_verified),
    commentOwnerProfilePic: row.comment_owner_profile_pic || '',
    commentPostId: row.post_id || '',
    commentIsReply: parseBoolean(row.comment_is_reply),
    commentParentId: row.comment_parent_id || '',
  };
}

function mapYouTubeRow(row: any): YouTubeDataRow {
  return {
    platform: 'youtube',
    accountName: row.account_name || '',
    accountChannelId: row.account_channel_id || '',
    videoId: row.video_id || '',
    videoTitle: row.video_title || '',
    videoDescription: '',
    videoPublishedAt: '',
    videoUrl: row.video_url || '',
    videoThumbnailUrl: row.video_thumbnail_url || '',
    videoLikeCount: 0,
    videoViewCount: 0,
    videoCommentCount: 0,
    videoDuration: '',
    commentType: '',
    commentId: row.comment_id || '',
    parentCommentId: '',
    commentText: row.comment_text || '',
    commentPublishedAt: row.comment_published_at || '',
    commentUpdatedAt: '',
    commentLikeCount: parseNumber(row.comment_like_count),
    authorDisplayName: row.author_display_name || '',
    authorChannelId: '',
    authorChannelUrl: '',
    authorThumbnailUrl: '',
    pulledAtUtc: '',
  };
}

export async function getXData(startDate?: string, endDate?: string): Promise<XDataRow[]> {
  const effectiveStart = startDate || '2020-01-01';
  const effectiveEnd = endDate || new Date().toISOString().split('T')[0];
  const key = getCacheKey(effectiveStart, effectiveEnd);

  if (isCacheValid(xCache, key)) return xCache.data;

  const data = await fetchAllPages<XDataRow>(
    'x_data', X_COLUMNS, 'date', effectiveStart, effectiveEnd, 'document_id', mapXRow
  );

  xCache = { key, data, timestamp: Date.now() };
  return data;
}

export async function getTikTokData(startDate?: string, endDate?: string): Promise<TikTokDataRow[]> {
  const effectiveStart = startDate || '2020-01-01';
  const effectiveEnd = endDate || new Date().toISOString().split('T')[0];
  const key = getCacheKey(effectiveStart, effectiveEnd);

  if (isCacheValid(tiktokCache, key)) return tiktokCache.data;

  const data = await fetchAllPages<TikTokDataRow>(
    'tiktok_data', TIKTOK_COLUMNS, 'comment_create_time_iso', effectiveStart, effectiveEnd, 'comment_cid', mapTikTokRow
  );

  tiktokCache = { key, data, timestamp: Date.now() };
  return data;
}

export async function getInstagramData(startDate?: string, endDate?: string): Promise<InstagramDataRow[]> {
  const effectiveStart = startDate || '2020-01-01';
  const effectiveEnd = endDate || new Date().toISOString().split('T')[0];
  const key = getCacheKey(effectiveStart, effectiveEnd);

  if (isCacheValid(instagramCache, key)) return instagramCache.data;

  const data = await fetchAllPages<InstagramDataRow>(
    'instagram_data', INSTAGRAM_COLUMNS, 'comment_timestamp', effectiveStart, effectiveEnd, 'comment_id', mapInstagramRow
  );

  instagramCache = { key, data, timestamp: Date.now() };
  return data;
}

export async function getYouTubeData(startDate?: string, endDate?: string): Promise<YouTubeDataRow[]> {
  const effectiveStart = startDate || '2020-01-01';
  const effectiveEnd = endDate || new Date().toISOString().split('T')[0];
  const key = getCacheKey(effectiveStart, effectiveEnd);

  if (isCacheValid(youtubeCache, key)) return youtubeCache.data;

  const data = await fetchAllPages<YouTubeDataRow>(
    'youtube_data', YOUTUBE_COLUMNS, 'comment_published_at', effectiveStart, effectiveEnd, 'comment_id', mapYouTubeRow, 500
  );

  youtubeCache = { key, data, timestamp: Date.now() };
  return data;
}

export async function getYouTubeChannelData(
  channelId: string,
  startDate?: string,
  endDate?: string
): Promise<YouTubeDataRow[]> {
  const allData = await getYouTubeData(startDate, endDate);
  return allData.filter(row => row.accountChannelId === channelId);
}

export function invalidateChannelCache(channelId?: string): void {
  youtubeCache = null;
}

export function computeStats<T>(
  data: T[],
  getDate: (row: T) => string,
  getLikes: (row: T) => number,
  getText: (row: T) => string
) {
  const totalComments = data.length;
  const totalLikes = data.reduce((sum, row) => sum + getLikes(row), 0);

  const dateGroups: Record<string, number> = {};
  data.forEach(row => {
    const date = getDate(row).split('T')[0].split(' ')[0];
    if (date) {
      dateGroups[date] = (dateGroups[date] || 0) + 1;
    }
  });

  const timeline = Object.entries(dateGroups)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  let mostLikedComment = data[0];
  data.forEach(row => {
    if (getLikes(row) > getLikes(mostLikedComment)) {
      mostLikedComment = row;
    }
  });

  return {
    totalComments,
    totalLikes,
    timeline,
    mostLikedComment,
  };
}

// Google Sheets Integration - connection:conn_google-sheet_01KFGGJYZ3JYXPQQ9XTM3GA2ZC
import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-sheet',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Sheet not connected');
  }
  return accessToken;
}

export async function getGoogleSheetsClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.sheets({ version: 'v4', auth: oauth2Client });
}

const SPREADSHEET_ID = '1OHJRAjhvCziFSMZ5ALTy2DHrnx_zPfHsV-ETN_UK6o8';

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

export async function getXData(): Promise<XDataRow[]> {
  const sheets = await getGoogleSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'X_Data!A:P',
  });

  const rows = response.data.values;
  if (!rows || rows.length <= 1) return [];

  const headers = rows[0];
  return rows.slice(1).map(row => ({
    date: row[headers.indexOf('Date')] || '',
    time: row[headers.indexOf('Time')] || '',
    documentId: row[headers.indexOf('Document ID')] || '',
    url: row[headers.indexOf('URL')] || '',
    authorName: row[headers.indexOf('Author Name')] || '',
    authorHandle: row[headers.indexOf('Author Handle')] || '',
    openingText: row[headers.indexOf('Opening Text')] || '',
    hitSentence: row[headers.indexOf('Hit Sentence')] || '',
    language: row[headers.indexOf('Language')] || '',
    sentiment: row[headers.indexOf('Sentiment')] || '',
    engagement: parseNumber(row[headers.indexOf('Engagement')]),
    likes: parseNumber(row[headers.indexOf('Likes')]),
    replies: parseNumber(row[headers.indexOf('Replies')]),
    reposts: parseNumber(row[headers.indexOf('Reposts')]),
    views: parseNumber(row[headers.indexOf('Views')]),
    inputName: row[headers.indexOf('Input Name')] || '',
  }));
}

export async function getTikTokData(): Promise<TikTokDataRow[]> {
  const sheets = await getGoogleSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'TikTok_Data!A:Q',
  });

  const rows = response.data.values;
  if (!rows || rows.length <= 1) return [];

  const headers = rows[0];
  return rows.slice(1).map(row => ({
    pulledAtUtc: row[headers.indexOf('pulled_at_utc')] || '',
    accountNameAr: row[headers.indexOf('account_name_ar')] || '',
    accountUsername: row[headers.indexOf('account_username')] || '',
    postUrl: row[headers.indexOf('post_url')] || '',
    postId: row[headers.indexOf('post_id')] || '',
    postDescription: row[headers.indexOf('post_description')] || '',
    postCreateTime: row[headers.indexOf('post_create_time')] || '',
    postLikeCount: parseNumber(row[headers.indexOf('post_like_count')]),
    postCommentCount: parseNumber(row[headers.indexOf('post_comment_count')]),
    commentCid: row[headers.indexOf('comment_cid')] || '',
    commentText: row[headers.indexOf('comment_text')] || '',
    commentCreateTimeIso: row[headers.indexOf('comment_create_time_iso')] || '',
    commentDiggCount: parseNumber(row[headers.indexOf('comment_digg_count')]),
    commentReplyTotal: parseNumber(row[headers.indexOf('comment_reply_total')]),
    commentUniqueId: row[headers.indexOf('comment_unique_id')] || '',
    commentUid: row[headers.indexOf('comment_uid')] || '',
    commentAvatarThumbnail: row[headers.indexOf('comment_avatar_thumbnail')] || '',
  }));
}

export async function getInstagramData(): Promise<InstagramDataRow[]> {
  const sheets = await getGoogleSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Instagram_Data!A:R',
  });

  const rows = response.data.values;
  if (!rows || rows.length <= 1) return [];

  const headers = rows[0];
  return rows.slice(1).map(row => ({
    pulledAtUtc: row[headers.indexOf('pulled_at_utc')] || '',
    accountNameAr: row[headers.indexOf('account_name_ar')] || '',
    accountUsername: row[headers.indexOf('account_username')] || '',
    postUrl: row[headers.indexOf('post_url')] || '',
    postShortcode: row[headers.indexOf('post_shortcode')] || '',
    postCaption: row[headers.indexOf('post_caption')] || '',
    postTimestamp: row[headers.indexOf('post_timestamp')] || '',
    postType: row[headers.indexOf('post_type')] || '',
    commentId: row[headers.indexOf('comment_id')] || '',
    commentText: row[headers.indexOf('comment_text')] || '',
    commentTimestamp: row[headers.indexOf('comment_timestamp')] || '',
    commentLikes: parseNumber(row[headers.indexOf('comment_likes')]),
    commentOwnerUsername: row[headers.indexOf('comment_owner_username')] || '',
    commentOwnerIsVerified: parseBoolean(row[headers.indexOf('comment_owner_is_verified')]),
    commentOwnerProfilePic: row[headers.indexOf('comment_owner_profile_pic')] || '',
    commentPostId: row[headers.indexOf('comment_post_id')] || '',
    commentIsReply: parseBoolean(row[headers.indexOf('comment_is_reply')]),
    commentParentId: row[headers.indexOf('comment_parent_id')] || '',
  }));
}

export async function getYouTubeData(): Promise<YouTubeDataRow[]> {
  const sheets = await getGoogleSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'YouTube_Data!A:X',
  });

  const rows = response.data.values;
  if (!rows || rows.length <= 1) return [];

  const headers = rows[0];
  return rows.slice(1).map(row => ({
    platform: row[headers.indexOf('platform')] || '',
    accountName: row[headers.indexOf('account_name')] || '',
    accountChannelId: row[headers.indexOf('account_channel_id')] || '',
    videoId: row[headers.indexOf('video_id')] || '',
    videoTitle: row[headers.indexOf('video_title')] || '',
    videoDescription: row[headers.indexOf('video_description')] || '',
    videoPublishedAt: row[headers.indexOf('video_published_at')] || '',
    videoUrl: row[headers.indexOf('video_url')] || '',
    videoThumbnailUrl: row[headers.indexOf('video_thumbnail_url')] || '',
    videoLikeCount: parseNumber(row[headers.indexOf('video_like_count')]),
    videoViewCount: parseNumber(row[headers.indexOf('video_view_count')]),
    videoCommentCount: parseNumber(row[headers.indexOf('video_comment_count')]),
    videoDuration: row[headers.indexOf('video_duration')] || '',
    commentType: row[headers.indexOf('comment_type')] || '',
    commentId: row[headers.indexOf('comment_id')] || '',
    parentCommentId: row[headers.indexOf('parent_comment_id')] || '',
    commentText: row[headers.indexOf('comment_text')] || '',
    commentPublishedAt: row[headers.indexOf('comment_published_at')] || '',
    commentUpdatedAt: row[headers.indexOf('comment_updated_at')] || '',
    commentLikeCount: parseNumber(row[headers.indexOf('comment_like_count')]),
    authorDisplayName: row[headers.indexOf('author_display_name')] || '',
    authorChannelId: row[headers.indexOf('author_channel_id')] || '',
    authorChannelUrl: row[headers.indexOf('author_channel_url')] || '',
    pulledAtUtc: row[headers.indexOf('pulled_at_utc')] || '',
  }));
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

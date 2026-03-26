import { sql } from "drizzle-orm";
import { pgTable, text, varchar, uuid, bigint, integer, doublePrecision, date, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Mentions table - stores all imported social media mentions
export const mentions = pgTable("mentions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  importJobId: uuid("import_job_id"),
  documentId: text("document_id"),
  url: text("url"),
  originalTweetUrl: text("original_tweet_url"),
  platform: text("platform"),
  sourceName: text("source_name"),
  sourceDomain: text("source_domain"),
  contentType: text("content_type"),
  informationType: text("information_type"),
  inputName: text("input_name"),
  authorName: text("author_name"),
  authorHandle: text("author_handle"),
  title: text("title"),
  openingText: text("opening_text"),
  hitSentence: text("hit_sentence"),
  text: text("text"),
  hashtags: text("hashtags"),
  linksRaw: text("links_raw"),
  country: text("country"),
  region: text("region"),
  state: text("state"),
  city: text("city"),
  language: text("language"),
  createdDate: date("created_date"),
  createdTime: text("created_time"),
  dateTime: timestamp("date_time", { withTimezone: true }),
  
  // Metrics
  reach: bigint("reach", { mode: "number" }),
  engagement: bigint("engagement", { mode: "number" }),
  likes: bigint("likes", { mode: "number" }),
  replies: bigint("replies", { mode: "number" }),
  shares: bigint("shares", { mode: "number" }),
  quotes: bigint("quotes", { mode: "number" }),
  reposts: bigint("reposts", { mode: "number" }),
  comments: bigint("comments", { mode: "number" }),
  views: bigint("views", { mode: "number" }),
  
  // Meltwater fields
  mwSentiment: text("mw_sentiment"),
  mwKeyphrases: text("mw_keyphrases"),
  
  // Cleaned text and record context
  cleanText: text("clean_text"),
  recordType: text("record_type"),
  originalUrl: text("original_url"),
  hasOriginalContext: boolean("has_original_context").default(false),
  
  // AI analysis fields
  analysisStatus: text("analysis_status").default("pending"),
  contentVertical: text("content_vertical"),
  aiSentiment: text("ai_sentiment"),
  sentimentTarget: text("sentiment_target"),
  aiTopic: text("ai_topic"),
  aiStance: text("ai_stance"),
  keyPoints: text("key_points").array(),
  confidenceScore: doublePrecision("confidence_score"),
  contextUsed: boolean("context_used").default(false),
  contextMissing: boolean("context_missing").default(false),
  contextSummary: text("context_summary"),
  shortReason: text("short_reason"),
  analyzedAt: timestamp("analyzed_at", { withTimezone: true }),
  analysisVersion: text("analysis_version"),
  
  // System fields
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`),
});

// Import jobs table - tracks CSV import operations
export const importJobs = pgTable("import_jobs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename"),
  bytes: bigint("bytes", { mode: "number" }),
  status: text("status").default("uploaded"),
  totalRows: integer("total_rows"),
  processedRows: integer("processed_rows").default(0),
  errorRows: integer("error_rows").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
});

// Insert schemas
export const insertMentionSchema = createInsertSchema(mentions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertImportJobSchema = createInsertSchema(importJobs).omit({
  id: true,
  createdAt: true,
});

// Types
export type Mention = typeof mentions.$inferSelect;
export type InsertMention = z.infer<typeof insertMentionSchema>;
export type ImportJob = typeof importJobs.$inferSelect;
export type InsertImportJob = z.infer<typeof insertImportJobSchema>;

// Dashboard stats type
export interface DashboardStats {
  totalMentions: number;
  totalReach: number;
  totalEngagement: number;
  negativePercentage: number;
  analyzedCount: number;
  pendingCount: number;
  sentimentBreakdown: { sentiment: string; count: number }[];
  platformBreakdown: { platform: string; count: number }[];
  topicBreakdown: { topic: string; count: number }[];
  verticalBreakdown: { vertical: string; count: number }[];
  timelineData: { date: string; mentions: number; reach: number; positive: number; negative: number; neutral: number }[];
  topAuthors: { name: string; handle: string; count: number; engagement: number }[];
  topHashtags: { hashtag: string; count: number }[];
  languageBreakdown: { language: string; count: number }[];
  countryBreakdown: { country: string; count: number }[];
}

// Period comparison type
export interface PeriodComparison {
  current: DashboardStats;
  previous: DashboardStats;
  changes: {
    mentions: number;
    reach: number;
    engagement: number;
    negativePercentage: number;
  };
}

// Explore filters type
export interface ExploreFilters {
  from?: string;
  to?: string;
  platform?: string;
  contentVertical?: string;
  aiSentiment?: string;
  aiTopic?: string;
  analysisStatus?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// Explore response type
export interface ExploreResponse {
  mentions: Mention[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// TikTok comments table - stores TikTok video comments (matches Apify schema)
export const tiktokComments = pgTable("tiktok_comments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Apify primary fields - cid is the unique identifier
  cid: text("cid").notNull().unique(),
  commentLanguage: text("comment_language"),
  createTime: timestamp("create_time", { withTimezone: true }),
  diggCount: bigint("digg_count", { mode: "number" }),
  text: text("text"),
  
  // User nested object fields
  userNickname: text("user_nickname"),
  userAvatarThumbUrl: text("user_avatar_thumb_url"),
  userSecUid: text("user_sec_uid"),
  userUid: text("user_uid"),
  userUniqueId: text("user_unique_id"),
  
  // Share info nested object fields
  shareInfoDesc: text("share_info_desc"),
  shareInfoUrl: text("share_info_url"),
  
  // Additional tracking fields
  accountHandle: text("account_handle"),
  
  // AI analysis fields (for later phases)
  analysisStatus: text("analysis_status").default("pending"),
  aiSentiment: text("ai_sentiment"),
  aiTopic: text("ai_topic"),
  aiStance: text("ai_stance"),
  keyPoints: text("key_points").array(),
  confidenceScore: doublePrecision("confidence_score"),
  shortReason: text("short_reason"),
  analyzedAt: timestamp("analyzed_at", { withTimezone: true }),
  analysisVersion: text("analysis_version"),
  
  // System fields
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`),
});

// TikTok accounts table - tracks monitored accounts
export const tiktokAccounts = pgTable("tiktok_accounts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  handle: text("handle").notNull().unique(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  followers: bigint("followers", { mode: "number" }),
  isActive: boolean("is_active").default(true),
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  totalComments: integer("total_comments").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
});

// TikTok videos table - tracks videos for incremental sync
export const tiktokVideos = pgTable("tiktok_videos", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  videoId: text("video_id").notNull().unique(),
  accountHandle: text("account_handle"),
  videoUrl: text("video_url"),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  views: bigint("views", { mode: "number" }),
  likes: bigint("likes", { mode: "number" }),
  comments: bigint("comments", { mode: "number" }),
  shares: bigint("shares", { mode: "number" }),
  videoCreatedAt: timestamp("video_created_at", { withTimezone: true }),
  lastCommentSyncAt: timestamp("last_comment_sync_at", { withTimezone: true }),
  commentCount: integer("comment_count").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
});

// TikTok sync jobs table - tracks sync operations
export const tiktokSyncJobs = pgTable("tiktok_sync_jobs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  accountHandle: text("account_handle"),
  status: text("status").default("pending"),
  videosProcessed: integer("videos_processed").default(0),
  commentsAdded: integer("comments_added").default(0),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
});

// Insert schemas for TikTok
export const insertTiktokCommentSchema = createInsertSchema(tiktokComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTiktokAccountSchema = createInsertSchema(tiktokAccounts).omit({
  id: true,
  createdAt: true,
});

export const insertTiktokVideoSchema = createInsertSchema(tiktokVideos).omit({
  id: true,
  createdAt: true,
});

export const insertTiktokSyncJobSchema = createInsertSchema(tiktokSyncJobs).omit({
  id: true,
  createdAt: true,
});

// TikTok Types
export type TiktokComment = typeof tiktokComments.$inferSelect;
export type InsertTiktokComment = z.infer<typeof insertTiktokCommentSchema>;
export type TiktokAccount = typeof tiktokAccounts.$inferSelect;
export type InsertTiktokAccount = z.infer<typeof insertTiktokAccountSchema>;
export type TiktokVideo = typeof tiktokVideos.$inferSelect;
export type InsertTiktokVideo = z.infer<typeof insertTiktokVideoSchema>;
export type TiktokSyncJob = typeof tiktokSyncJobs.$inferSelect;
export type InsertTiktokSyncJob = z.infer<typeof insertTiktokSyncJobSchema>;

// Legacy user schema (keeping for compatibility)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

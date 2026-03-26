import { ApifyClient } from "apify-client";
import { db } from "./db";
import { 
  tiktokComments, 
  tiktokAccounts, 
  tiktokVideos, 
  tiktokSyncJobs 
} from "@shared/schema";
import { eq, desc, and, sql, gte, lte } from "drizzle-orm";
import { cleanText } from "./textCleaning";

const SYNC_INTERVAL_HOURS = 6;
let syncSchedulerRunning = false;
let lastScheduledSync: Date | null = null;

// Exact Apify TikTok Comments Actor schema
interface ApifyTikTokComment {
  cid: string;
  comment_language?: string;
  create_time?: string;
  digg_count?: number;
  text?: string;
  user?: {
    nickname?: string;
    avatar_thumb_url?: string;
    sec_uid?: string;
    uid?: string;
    unique_id?: string;
  };
  share_info?: {
    desc?: string;
    url?: string;
  };
}

const THMANYAH_ACCOUNTS = [
  { handle: "thmanyahsports", name: "رياضة ثمانية" },
  { handle: "thmanyah", name: "ثمانية" },
  { handle: "thmanyahexit", name: "مخرج ثمانية" },
  { handle: "thmanyahliving", name: "معيشة ثمانية" },
  { handle: "radiothmanyah", name: "راديو ثمانية" },
];

const APIFY_ACTOR_ID = "clockworks/tiktok-comments-scraper";

export async function initTiktokAccounts() {
  for (const account of THMANYAH_ACCOUNTS) {
    const existing = await db.select()
      .from(tiktokAccounts)
      .where(eq(tiktokAccounts.handle, account.handle))
      .limit(1);
    
    if (existing.length === 0) {
      await db.insert(tiktokAccounts).values({
        handle: account.handle,
        displayName: account.name,
        isActive: true,
      });
    }
  }
}

export async function syncTiktokAccount(apiToken: string, accountHandle: string) {
  const client = new ApifyClient({ token: apiToken });
  
  const syncJob = await db.insert(tiktokSyncJobs).values({
    accountHandle,
    status: "running",
    startedAt: new Date(),
  }).returning();
  
  const jobId = syncJob[0].id;
  
  try {
    // Reduced memory footprint: fewer videos and comments per request
    const run = await client.actor(APIFY_ACTOR_ID).call({
      profiles: [accountHandle],
      resultsPerPage: 5,       // Reduced from 20 to minimize memory usage
      commentsPerPost: 30,     // Reduced from 100 to minimize memory usage
    });
    
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    
    let commentsAdded = 0;
    let videosProcessed = 0;
    const processedVideos = new Set<string>();
    
    for (const rawItem of items) {
      const item = rawItem as unknown as ApifyTikTokComment;
      
      // cid is the unique identifier as per Apify schema
      if (!item.cid) continue;
      
      const cidStr = String(item.cid);
      
      // Check for duplicate using cid
      const existingComment = await db.select()
        .from(tiktokComments)
        .where(eq(tiktokComments.cid, cidStr))
        .limit(1);
      
      if (existingComment.length === 0) {
        // Parse create_time from "YYYY-MM-DD HH:mm:ss" format
        let createTime: Date | null = null;
        if (item.create_time) {
          createTime = new Date(item.create_time);
        }
        
        await db.insert(tiktokComments).values({
          cid: cidStr,
          commentLanguage: item.comment_language || null,
          createTime,
          diggCount: item.digg_count || 0,
          text: item.text || "",
          userNickname: item.user?.nickname || null,
          userAvatarThumbUrl: item.user?.avatar_thumb_url || null,
          userSecUid: item.user?.sec_uid || null,
          userUid: item.user?.uid || null,
          userUniqueId: item.user?.unique_id || null,
          shareInfoDesc: item.share_info?.desc || null,
          shareInfoUrl: item.share_info?.url || null,
          accountHandle,
          analysisStatus: "pending",
        });
        
        commentsAdded++;
      }
      
      // Track videos from share_info URL
      const shareUrl = item.share_info?.url;
      if (shareUrl) {
        const videoIdMatch = shareUrl.match(/\/video\/(\d+)/);
        if (videoIdMatch) {
          const videoIdStr = videoIdMatch[1];
          if (!processedVideos.has(videoIdStr)) {
            processedVideos.add(videoIdStr);
            videosProcessed++;
            
            const existingVideo = await db.select()
              .from(tiktokVideos)
              .where(eq(tiktokVideos.videoId, videoIdStr))
              .limit(1);
            
            if (existingVideo.length === 0) {
              await db.insert(tiktokVideos).values({
                videoId: videoIdStr,
                accountHandle,
                videoUrl: shareUrl,
                description: item.share_info?.desc || null,
                lastCommentSyncAt: new Date(),
              });
            }
          }
        }
      }
    }
    
    await db.update(tiktokAccounts)
      .set({ 
        lastSyncAt: new Date(),
        totalComments: sql`(SELECT COUNT(*) FROM tiktok_comments WHERE account_handle = ${accountHandle})`,
      })
      .where(eq(tiktokAccounts.handle, accountHandle));
    
    await db.update(tiktokSyncJobs)
      .set({
        status: "completed",
        videosProcessed,
        commentsAdded,
        finishedAt: new Date(),
      })
      .where(eq(tiktokSyncJobs.id, jobId));
    
    return { success: true, commentsAdded, videosProcessed };
    
  } catch (error: any) {
    const isMemoryLimitError = error.type === "actor-memory-limit-exceeded" || 
      error.message?.includes("memory limit");
    const statusCode = error.statusCode || 0;
    
    console.error(`TikTok sync error for ${accountHandle}:`, error);
    
    await db.update(tiktokSyncJobs)
      .set({
        status: "failed",
        errorMessage: isMemoryLimitError 
          ? "Apify memory limit exceeded - please try again later or upgrade Apify plan"
          : error.message || "Unknown error",
        finishedAt: new Date(),
      })
      .where(eq(tiktokSyncJobs.id, jobId));
    
    return { 
      success: false, 
      error: error.message,
      isMemoryLimitError,
      statusCode,
    };
  }
}

export async function syncAllTiktokAccounts(apiToken: string) {
  const accounts = await db.select()
    .from(tiktokAccounts)
    .where(eq(tiktokAccounts.isActive, true));
  
  const results = [];
  let memoryLimitHit = false;
  
  for (const account of accounts) {
    // Skip remaining accounts if we hit memory limit
    if (memoryLimitHit) {
      console.log(`[TikTok] Skipping ${account.handle} - memory limit was hit`);
      results.push({ handle: account.handle, success: false, skipped: true, error: "Skipped due to memory limit" });
      continue;
    }
    
    console.log(`Syncing TikTok account: ${account.handle}`);
    const result = await syncTiktokAccount(apiToken, account.handle);
    results.push({ handle: account.handle, ...result });
    
    // Check if we hit the memory limit error
    if (result.isMemoryLimitError || result.statusCode === 402) {
      memoryLimitHit = true;
      console.log(`[TikTok] Memory limit exceeded - stopping further syncs`);
    }
    
    // Wait between syncs to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return results;
}

export async function getTiktokStats() {
  const accounts = await db.select().from(tiktokAccounts);
  
  const totalComments = await db.select({ count: sql<number>`count(*)` })
    .from(tiktokComments);
  
  const analyzedComments = await db.select({ count: sql<number>`count(*)` })
    .from(tiktokComments)
    .where(eq(tiktokComments.analysisStatus, "done"));
  
  const sentimentBreakdown = await db.select({
    sentiment: tiktokComments.aiSentiment,
    count: sql<number>`count(*)`,
  })
    .from(tiktokComments)
    .where(eq(tiktokComments.analysisStatus, "done"))
    .groupBy(tiktokComments.aiSentiment);
  
  const recentSyncJobs = await db.select()
    .from(tiktokSyncJobs)
    .orderBy(desc(tiktokSyncJobs.createdAt))
    .limit(10);
  
  return {
    accounts,
    totalComments: totalComments[0]?.count || 0,
    analyzedComments: analyzedComments[0]?.count || 0,
    sentimentBreakdown: sentimentBreakdown.filter(s => s.sentiment),
    recentSyncJobs,
  };
}

export async function getTiktokComments(options: {
  accountHandle?: string;
  videoId?: string;
  aiSentiment?: string;
  analysisStatus?: string;
  from?: string;
  to?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}) {
  const {
    accountHandle,
    videoId,
    aiSentiment,
    analysisStatus,
    from,
    to,
    sortBy = "createTime",
    sortOrder = "desc",
    page = 1,
    limit = 50,
  } = options;
  
  const conditions: ReturnType<typeof eq>[] = [];
  if (accountHandle) conditions.push(eq(tiktokComments.accountHandle, accountHandle));
  if (aiSentiment) conditions.push(eq(tiktokComments.aiSentiment, aiSentiment));
  if (analysisStatus) conditions.push(eq(tiktokComments.analysisStatus, analysisStatus));
  if (from) conditions.push(gte(tiktokComments.createTime, new Date(from)));
  if (to) conditions.push(sql`${tiktokComments.createTime} <= ${new Date(to)}`);
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  const totalResult = await db.select({ count: sql<number>`count(*)` })
    .from(tiktokComments)
    .where(whereClause);
  
  const total = totalResult[0]?.count || 0;
  
  const offset = (page - 1) * limit;
  
  const orderColumn = sortBy === "diggCount" ? tiktokComments.diggCount : tiktokComments.createTime;
  const orderDirection = sortOrder === "asc" ? orderColumn : desc(orderColumn);
  
  const comments = await db.select()
    .from(tiktokComments)
    .where(whereClause)
    .orderBy(orderDirection)
    .limit(limit)
    .offset(offset);
  
  return {
    comments,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function startScheduledSync(apiToken: string) {
  if (syncSchedulerRunning) {
    console.log("[TikTok] Scheduled sync already running");
    return;
  }
  
  syncSchedulerRunning = true;
  console.log(`[TikTok] Starting scheduled sync (every ${SYNC_INTERVAL_HOURS} hours)`);
  
  const runSync = async () => {
    try {
      console.log("[TikTok] Running scheduled sync...");
      lastScheduledSync = new Date();
      await syncAllTiktokAccounts(apiToken);
      console.log("[TikTok] Scheduled sync completed");
    } catch (error) {
      console.error("[TikTok] Scheduled sync error:", error);
    }
  };
  
  await runSync();
  
  setInterval(runSync, SYNC_INTERVAL_HOURS * 60 * 60 * 1000);
}

export function getSchedulerStatus() {
  return {
    isRunning: false, // COST CONTROL: Always report as paused
    isPaused: true, // COST CONTROL: Flag for UI to show paused status
    intervalHours: SYNC_INTERVAL_HOURS,
    lastSync: lastScheduledSync,
    nextSync: null, // No next sync when paused
    pauseReason: "متوقف لتجنب تكاليف إضافية", // "Paused to avoid additional costs"
  };
}

export async function getSyncJobHistory(limit = 20) {
  const jobs = await db.select()
    .from(tiktokSyncJobs)
    .orderBy(desc(tiktokSyncJobs.createdAt))
    .limit(limit);
  
  return jobs;
}

export async function getTiktokDashboard(accountHandle?: string, from?: string, to?: string) {
  const conditions: any[] = [];
  if (accountHandle) {
    conditions.push(eq(tiktokComments.accountHandle, accountHandle));
  }
  if (from) {
    conditions.push(gte(tiktokComments.createTime, new Date(from)));
  }
  if (to) {
    conditions.push(lte(tiktokComments.createTime, new Date(to)));
  }
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const totalComments = await db.select({ count: sql<number>`count(*)` })
    .from(tiktokComments)
    .where(whereClause);

  const totalLikes = await db.select({ sum: sql<number>`coalesce(sum(digg_count), 0)` })
    .from(tiktokComments)
    .where(whereClause);

  const sentimentBreakdown = await db.select({
    sentiment: tiktokComments.aiSentiment,
    count: sql<number>`count(*)`,
  })
    .from(tiktokComments)
    .where(whereClause ? and(whereClause, eq(tiktokComments.analysisStatus, "done")) : eq(tiktokComments.analysisStatus, "done"))
    .groupBy(tiktokComments.aiSentiment);

  const topicBreakdown = await db.select({
    topic: tiktokComments.aiTopic,
    count: sql<number>`count(*)`,
  })
    .from(tiktokComments)
    .where(whereClause ? and(whereClause, eq(tiktokComments.analysisStatus, "done")) : eq(tiktokComments.analysisStatus, "done"))
    .groupBy(tiktokComments.aiTopic);

  // Get top videos from videos table
  const topVideos = await db.select({
    videoId: tiktokVideos.videoId,
    videoUrl: tiktokVideos.videoUrl,
    description: tiktokVideos.description,
    commentCount: tiktokVideos.commentCount,
  })
    .from(tiktokVideos)
    .where(accountHandle ? eq(tiktokVideos.accountHandle, accountHandle) : undefined)
    .orderBy(desc(tiktokVideos.commentCount))
    .limit(10);

  const timeTrend = await db.select({
    date: sql<string>`date_trunc('day', create_time)::date`,
    count: sql<number>`count(*)`,
  })
    .from(tiktokComments)
    .where(whereClause)
    .groupBy(sql`date_trunc('day', create_time)`)
    .orderBy(sql`date_trunc('day', create_time)`);

  const recentComments = await db.select()
    .from(tiktokComments)
    .where(whereClause)
    .orderBy(desc(tiktokComments.createTime))
    .limit(20);

  return {
    totalComments: totalComments[0]?.count || 0,
    totalLikes: totalLikes[0]?.sum || 0,
    sentimentBreakdown: sentimentBreakdown.filter(s => s.sentiment),
    topicBreakdown: topicBreakdown.filter(t => t.topic),
    topVideos,
    timeTrend,
    recentComments,
  };
}

export async function getAccountStats(accountHandle: string) {
  const account = await db.select()
    .from(tiktokAccounts)
    .where(eq(tiktokAccounts.handle, accountHandle))
    .limit(1);

  if (account.length === 0) {
    return null;
  }

  const dashboard = await getTiktokDashboard(accountHandle);

  return {
    account: account[0],
    ...dashboard,
  };
}

export { THMANYAH_ACCOUNTS };

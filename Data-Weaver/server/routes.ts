import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import { mentions, importJobs, tiktokComments } from "@shared/schema";
import { eq, and, gte, lte, desc, asc, sql, count, inArray } from "drizzle-orm";
import formidable from "formidable";
import { parse } from "csv-parse";
import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { batchProcess } from "./replit_integrations/batch";
import { processMentionText } from "./textCleaning";
import { 
  initTiktokAccounts, 
  syncAllTiktokAccounts, 
  syncTiktokAccount, 
  getTiktokStats, 
  getTiktokComments,
  startScheduledSync,
  getSchedulerStatus,
  getSyncJobHistory,
  getTiktokDashboard,
  getAccountStats,
  THMANYAH_ACCOUNTS
} from "./tiktok";
import {
  getXData,
  getTikTokData,
  getInstagramData,
  getYouTubeData,
  getYouTubeChannelData,
  computeStats,
  type XDataRow,
  type TikTokDataRow,
  type InstagramDataRow,
  type YouTubeDataRow
} from "./supabaseData";

// Predefined Thmanyah accounts - show even with 0 comments (5 accounts only)
// TikTok accounts: ثمانية, رياضة ثمانية, مخرج ثمانية, معيشة ثمانية, راديو ثمانية
const THMANYAH_TIKTOK_ACCOUNTS = [
  { username: "thmanyah", nameAr: "ثمانية", aliases: ["ثمانية"] },
  { username: "thmanyahsports", nameAr: "رياضة ثمانية", aliases: ["رياضة ثمانية"] },
  { username: "thmanyahexit", nameAr: "مخرج ثمانية", aliases: ["مخرج ثمانية"] },
  { username: "thmanyahliving", nameAr: "معيشة ثمانية", aliases: ["معيشة ثمانية"] },
  { username: "radiothmanyah", nameAr: "راديو ثمانية", aliases: ["راديو ثمانية", "إذاعة ثمانية"] },
];

// Instagram accounts: ثمانية, رياضة ثمانية, مخرج ثمانية, معيشة ثمانية, راديو ثمانية
const THMANYAH_INSTAGRAM_ACCOUNTS = [
  { username: "thmanyah", nameAr: "ثمانية", aliases: ["ثمانية"] },
  { username: "thmanyahsports", nameAr: "رياضة ثمانية", aliases: ["رياضة ثمانية"] },
  { username: "thmanyahexit", nameAr: "مخرج ثمانية", aliases: ["مخرج ثمانية"] },
  { username: "thmanyahliving", nameAr: "معيشة ثمانية", aliases: ["معيشة ثمانية"] },
  { username: "radiothmanyah", nameAr: "راديو ثمانية", aliases: ["راديو ثمانية", "إذاعة ثمانية"] },
];

// YouTube channels: مخرج ثمانية, إذاعة ثمانية, شركة ثمانية, ثمانية, رياضة ثمانية
const THMANYAH_YOUTUBE_CHANNELS = [
  { channelId: "UC-EAaNIDtW85oo7eDU1tlnQ", name: "مخرج ثمانية", aliases: ["مخرج ثمانية"] },
  { channelId: "UCwjLh640nGXSGa9iHRS31ag", name: "إذاعة ثمانية", aliases: ["إذاعة ثمانية", "راديو ثمانية"] },
  { channelId: "UCQPalfEYxVLs8nEB4LutApQ", name: "ثمانية", aliases: ["ثمانية"] },
  { channelId: "UCj-2hfXdYPPNcLqcBeW3y8g", name: "رياضة ثمانية", aliases: ["رياضة ثمانية"] },
];

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "dev-admin-123";
const SESSION_SECRET = process.env.SESSION_SECRET;
const UPLOAD_DIR = "/tmp/uploads";

// SAFE MODE - blocks all paid actions when enabled
const SAFE_MODE = process.env.SAFE_MODE !== "false"; // Default ON
const MAX_ITEMS_PER_RUN = parseInt(process.env.MAX_ITEMS_PER_RUN || "20");
const MAX_CONCURRENT_REQUESTS = parseInt(process.env.MAX_CONCURRENT_REQUESTS || "2");

function isSafeMode(): boolean {
  return SAFE_MODE;
}

function blockIfSafeMode(res: Response): boolean {
  if (isSafeMode()) {
    res.status(403).json({ 
      error: "Safe Mode is enabled. Paid actions are blocked.",
      safeMode: true,
      message: "الوضع الآمن مفعّل. الإجراءات المدفوعة محظورة."
    });
    return true;
  }
  return false;
}

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_KEY ? undefined : process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const adminSessions = new Set<string>();

function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const sessionId = req.cookies?.adminSession;
  if (sessionId && adminSessions.has(sessionId)) {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
}

function parseNumber(val: string | null | undefined): number | null {
  if (!val || val === "" || val === "null" || val === "undefined") return null;
  const num = parseInt(val.replace(/,/g, ""), 10);
  return isNaN(num) ? null : num;
}

function parseDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr || dateStr === "") return null;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date;
  } catch {
    return null;
  }
}

function extractTweetUrl(linksRaw: string | null, currentUrl: string | null, contentType: string | null): string | null {
  if (!linksRaw) return null;
  const tweetPattern = /https?:\/\/(twitter\.com|x\.com)\/\w+\/status\/\d+/gi;
  const matches = linksRaw.match(tweetPattern) || [];
  
  if (contentType?.toLowerCase() === "quote" && matches.length > 1) {
    const otherUrls = matches.filter(m => m !== currentUrl);
    if (otherUrls.length > 0) return otherUrls[0];
  }
  
  for (const url of matches) {
    if (url !== currentUrl) return url;
  }
  
  return matches[0] || null;
}

function extractTweetId(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(/\/(?:i\/)?status\/(\d+)/);
  return match ? match[1] : null;
}

const COLUMN_MAPPINGS: Record<string, string> = {
  "Document ID": "documentId",
  "URL": "url",
  "Platform": "platform",
  "Source Type": "platform",
  "Source Name": "sourceName",
  "Source Domain": "sourceDomain",
  "Content Type": "contentType",
  "Information Type": "informationType",
  "Input Name": "inputName",
  "Author Name": "authorName",
  "Author Handle": "authorHandle",
  "Title": "title",
  "Opening Text": "openingText",
  "Hit Sentence": "hitSentence",
  "Hashtags": "hashtags",
  "Links": "linksRaw",
  "Country": "country",
  "Region": "region",
  "State": "state",
  "City": "city",
  "Language": "language",
  "Date": "createdDate",
  "Time": "createdTime",
  "DateTime": "dateTimeRaw",
  "Sentiment": "mwSentiment",
  "Keyphrases": "mwKeyphrases",
  "Reach": "reach",
  "Engagement": "engagement",
  "Likes": "likes",
  "Replies": "replies",
  "Shares": "shares",
  "Quotes": "quotes",
  "Reposts": "reposts",
  "Comments": "comments",
  "Views": "views",
  "Key Phrases": "mwKeyphrases",
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.post("/api/admin/login", (req: Request, res: Response) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
      const sessionId = generateSessionId();
      adminSessions.add(sessionId);
      res.cookie("adminSession", sessionId, { 
        httpOnly: true, 
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: "strict"
      });
      res.json({ ok: true });
    } else {
      res.status(401).json({ error: "Invalid password" });
    }
  });

  // Safe Mode status endpoint
  app.get("/api/safe-mode", (req: Request, res: Response) => {
    res.json({
      enabled: isSafeMode(),
      maxItemsPerRun: MAX_ITEMS_PER_RUN,
      maxConcurrentRequests: MAX_CONCURRENT_REQUESTS,
    });
  });

  app.post("/api/upload", async (req: Request, res: Response) => {
    const form = formidable({
      uploadDir: UPLOAD_DIR,
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024,
    });

    try {
      const [fields, files] = await form.parse(req);
      const file = files.file?.[0];
      
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const [job] = await db.insert(importJobs).values({
        filename: file.originalFilename || "unknown.csv",
        bytes: file.size,
        status: "uploaded",
      }).returning();

      const newPath = path.join(UPLOAD_DIR, `${job.id}.csv`);
      fs.renameSync(file.filepath, newPath);

      res.json({ ok: true, jobId: job.id, filename: file.originalFilename, bytes: file.size });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Upload failed" });
    }
  });

  app.post("/api/import", async (req: Request, res: Response) => {
    const { jobId } = req.query;
    
    if (!jobId || typeof jobId !== "string") {
      return res.status(400).json({ error: "jobId required" });
    }

    const filePath = path.join(UPLOAD_DIR, `${jobId}.csv`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    await db.update(importJobs)
      .set({ status: "importing" })
      .where(eq(importJobs.id, jobId));

    res.json({ ok: true, message: "Import started" });

    processImport(jobId, filePath).catch(console.error);
  });

  async function processImport(jobId: string, filePath: string) {
    const rawBuffer = fs.readFileSync(filePath);
    
    let fileContent: string;
    if (rawBuffer[0] === 0xFF && rawBuffer[1] === 0xFE) {
      fileContent = rawBuffer.toString("utf16le").slice(1);
    } else if (rawBuffer[0] === 0xFE && rawBuffer[1] === 0xFF) {
      const swapped = Buffer.alloc(rawBuffer.length);
      for (let i = 0; i < rawBuffer.length; i += 2) {
        swapped[i] = rawBuffer[i + 1];
        swapped[i + 1] = rawBuffer[i];
      }
      fileContent = swapped.toString("utf16le").slice(1);
    } else {
      fileContent = rawBuffer.toString("utf-8");
    }
    
    const contentWithoutBom = fileContent.replace(/^\uFEFF/, "");
    
    let delimiter = ",";
    const firstLine = contentWithoutBom.split("\n")[0] || "";
    if (firstLine.includes("\t")) delimiter = "\t";
    else if ((firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length) delimiter = ";";

    const records: any[] = [];
    let totalRows = 0;
    let processedRows = 0;
    let errorRows = 0;

    const parser = parse(contentWithoutBom, {
      delimiter,
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      relax_quotes: true,
      trim: true,
    });

    for await (const record of parser) {
      totalRows++;
      records.push(record);
    }

    await db.update(importJobs)
      .set({ totalRows })
      .where(eq(importJobs.id, jobId));

    const BATCH_SIZE = 500;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      const rows = batch.map((record) => {
        try {
          const mapped: any = {};
          
          for (const [csvCol, dbCol] of Object.entries(COLUMN_MAPPINGS)) {
            if (record[csvCol] !== undefined) {
              mapped[dbCol] = record[csvCol] || null;
            }
          }

          mapped.text = mapped.hitSentence || mapped.openingText || null;
          mapped.originalTweetUrl = extractTweetUrl(mapped.linksRaw, mapped.url, mapped.contentType);
          
          // Clean text and detect record type during import
          const processed = processMentionText({
            hitSentence: mapped.hitSentence,
            openingText: mapped.openingText,
            title: mapped.title,
            informationType: mapped.informationType,
            url: mapped.url,
            linksRaw: mapped.linksRaw,
          });
          
          let dateTime: Date | null = null;
          if (mapped.dateTimeRaw) {
            dateTime = parseDate(mapped.dateTimeRaw);
          } else if (mapped.createdDate && mapped.createdTime) {
            dateTime = parseDate(`${mapped.createdDate} ${mapped.createdTime}`);
          } else if (mapped.createdDate) {
            dateTime = parseDate(mapped.createdDate);
          }

          return {
            importJobId: jobId,
            documentId: mapped.documentId,
            url: mapped.url,
            originalTweetUrl: mapped.originalTweetUrl,
            platform: mapped.platform,
            sourceName: mapped.sourceName,
            sourceDomain: mapped.sourceDomain,
            contentType: mapped.contentType,
            informationType: mapped.informationType,
            inputName: mapped.inputName,
            authorName: mapped.authorName,
            authorHandle: mapped.authorHandle,
            title: mapped.title,
            openingText: mapped.openingText,
            hitSentence: mapped.hitSentence,
            text: mapped.text,
            cleanText: processed.cleanText,
            recordType: processed.recordType,
            originalUrl: processed.originalUrl,
            hasOriginalContext: processed.hasOriginalContext,
            hashtags: mapped.hashtags,
            linksRaw: mapped.linksRaw,
            country: mapped.country,
            region: mapped.region,
            state: mapped.state,
            city: mapped.city,
            language: mapped.language,
            createdDate: mapped.createdDate || null,
            createdTime: mapped.createdTime,
            dateTime,
            reach: parseNumber(mapped.reach),
            engagement: parseNumber(mapped.engagement),
            likes: parseNumber(mapped.likes),
            replies: parseNumber(mapped.replies),
            shares: parseNumber(mapped.shares),
            quotes: parseNumber(mapped.quotes),
            reposts: parseNumber(mapped.reposts),
            comments: parseNumber(mapped.comments),
            views: parseNumber(mapped.views),
            mwSentiment: mapped.mwSentiment,
            mwKeyphrases: mapped.mwKeyphrases,
            analysisStatus: "pending",
          };
        } catch (err) {
          console.error("Error mapping row:", err);
          return null;
        }
      }).filter((row): row is NonNullable<typeof row> => row !== null);

      if (rows.length > 0) {
        try {
          await db.insert(mentions).values(rows);
          processedRows += rows.length;
        } catch (error) {
          console.error("Insert error:", error);
          errorRows += rows.length;
        }
      }

      await db.update(importJobs)
        .set({ processedRows, errorRows })
        .where(eq(importJobs.id, jobId));
    }

    await db.update(importJobs)
      .set({ 
        status: errorRows > 0 && processedRows === 0 ? "failed" : "done",
        processedRows,
        errorRows,
        finishedAt: new Date()
      })
      .where(eq(importJobs.id, jobId));

    try {
      fs.unlinkSync(filePath);
    } catch {}
  }

  app.get("/api/import/status", async (req: Request, res: Response) => {
    const { jobId } = req.query;
    
    if (!jobId) {
      return res.status(400).json({ error: "jobId required" });
    }

    const [job] = await db.select().from(importJobs).where(eq(importJobs.id, jobId as string));

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json(job);
  });

  app.get("/api/import/jobs", async (req: Request, res: Response) => {
    try {
      const jobs = await db.select()
        .from(importJobs)
        .orderBy(desc(importJobs.createdAt))
        .limit(50);

      res.json(jobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  app.delete("/api/import/jobs/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    
    try {
      const [job] = await db.select().from(importJobs).where(eq(importJobs.id, id));
      
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      await db.delete(mentions).where(eq(mentions.importJobId, id));
      await db.delete(importJobs).where(eq(importJobs.id, id));

      res.json({ ok: true, message: "Job deleted" });
    } catch (error) {
      console.error("Error deleting job:", error);
      res.status(500).json({ error: "Failed to delete job" });
    }
  });

  app.get("/api/analyze/status", async (req: Request, res: Response) => {
    try {
      const [pending] = await db.select({ count: count() })
        .from(mentions)
        .where(eq(mentions.analysisStatus, "pending"));

      const [processing] = await db.select({ count: count() })
        .from(mentions)
        .where(eq(mentions.analysisStatus, "processing"));

      const [done] = await db.select({ count: count() })
        .from(mentions)
        .where(eq(mentions.analysisStatus, "done"));

      res.json({
        pending: pending?.count || 0,
        processing: processing?.count || 0,
        done: done?.count || 0,
      });
    } catch (error) {
      console.error("Analyze status error:", error);
      res.status(500).json({ error: "Failed to fetch status" });
    }
  });

  // Precomputed tweet ID to text mapping for context matching
  let tweetIdMap: Map<string, string> = new Map();
  let tweetIdMapLastUpdate = 0;

  async function refreshTweetIdMap() {
    const now = Date.now();
    if (now - tweetIdMapLastUpdate < 60000 && tweetIdMap.size > 0) return;
    
    const allMentions = await db.select({
      url: mentions.url,
      hitSentence: mentions.hitSentence,
    }).from(mentions).limit(10000);

    tweetIdMap = new Map();
    for (const m of allMentions) {
      const tweetId = extractTweetId(m.url);
      if (tweetId && m.hitSentence) {
        tweetIdMap.set(tweetId, m.hitSentence);
      }
    }
    tweetIdMapLastUpdate = now;
  }

  function findOriginalContext(linksRaw: string | null): { text: string | null; found: boolean } {
    if (!linksRaw) return { text: null, found: false };
    
    const tweetPattern = /https?:\/\/(twitter\.com|x\.com)\/\w+\/(?:i\/)?status\/(\d+)/gi;
    let match;
    while ((match = tweetPattern.exec(linksRaw)) !== null) {
      const linkedTweetId = match[2];
      const originalText = tweetIdMap.get(linkedTweetId);
      if (originalText) {
        return { text: originalText, found: true };
      }
    }
    return { text: null, found: false };
  }

  const ANALYSIS_SYSTEM_PROMPT = `أنت محلل رصد اجتماعي متخصص في تحليل المحادثات العربية حول شركة «ثمانية» ومنتجاتها ومحتواها.

مهمتك هي تحليل النصوص الجاهزة التي تصلك، وتصنيفها بدقة من حيث:
- المشاعر
- الموضوع
- الموقف

⚠️ ملاحظة مهمة:
النصوص التي تصلك:
- تم تنظيفها مسبقًا
- خالية من الروابط والوسائط
- خالية من RT و QT
- مربوطة مسبقًا بسياقها الصحيح إن وُجد

دورك يبدأ فقط من **الفهم والتحليل**.

==================================================
سياق عام عن «ثمانية»
==================================================
«ثمانية» شركة سعودية لصناعة المحتوى، تعمل في مجالات متعددة تشمل:
- البودكاست (مثل: فنجان، سقراط، آدم، جادي)
- المحتوى المرئي
- النشرات البريدية
- الصحافة المكتوبة
- التغطية الرياضية (الدوري السعودي، كأس السوبر، وغيرها)

بعض المحادثات تكون:
- عن «ثمانية» كشركة
- عن جودة المحتوى
- عن الاشتراك والتسعير
- عن الحياد أو التحيز
- عن النقل الرياضي
- أو عن محتوى غير رياضي تمامًا (ثقافي، ديني، اجتماعي)

==================================================
شكل الإدخال الذي يصلك
==================================================
لكل سجل سيصلك:

- id: معرف السجل
- clean_text: نص المنشور الحالي بعد التنظيف
- original_context_text (اختياري): نص التغريدة أو المنشور الأصلي الذي جاء عليه رد أو اقتباس (قد يكون null)

==================================================
قواعد استخدام السياق
==================================================
إذا وُجد original_context_text:
- استخدمه فقط لفهم المقصود
- لا تحلل مشاعره
- لا تعيد تصنيفه
- التحليل يجب أن يعكس موقف النص الحالي فقط

إذا لم يوجد:
- حلل النص بشكل مستقل

==================================================
مهام التحليل (إجباري)
==================================================
لكل سجل، وبشكل مستقل تمامًا:

أولًا: المشاعر (sentiment)
اختر واحدًا فقط:
- إيجابي: إشادة، رضا، دعم، إعجاب
- سلبي: انتقاد، استياء، سخرية، اعتراض
- محايد: طرح رأي بدون انفعال، نقل خبر، سؤال

ثانيًا: الموضوع الرئيسي (topic)
اختر الموضوع الأبرز فقط:
- جودة المحتوى: الحديث عن مستوى الإنتاج، الطرح، الفكرة، الإخراج، التقديم
- الاشتراك والتسعير: الحديث عن السعر، الاشتراك المدفوع، المجانية، القيمة مقابل المال
- الحياد والتحيز: اتهام أو نفي التحيز، خاصة في التغطية الرياضية
- إشادة: مدح مباشر لثمانية أو أحد منتجاتها أو طاقمها
- انتقاد: انتقاد مباشر لسياسة، محتوى، قرار، أو طرح
- نقل رياضي: الحديث عن بث المباريات، الاستديوهات، المعلقين، التغطية
- محتوى ديني أو قيمي: نقاش ديني، أخلاقي، أو قيمي مرتبط بمحتوى ثمانية
- محتوى ثقافي أو معرفي: نقاش فكري، ثقافي، أو معرفي عن مواد ثمانية
- غير ذلك: إذا لم ينطبق أي تصنيف واضح

ثالثًا: الموقف (stance)
- داعم: النص يؤيد أو يدافع
- معارض: النص يعارض أو يهاجم
- وصفي: ينقل رأيًا أو معلومة بدون موقف واضح

رابعًا: درجة الثقة (confidence)
- رقم بين 0.00 و 1.00
- تعتمد على وضوح اللغة فقط
- إذا كان النص غامضًا، خفّض الدرجة

==================================================
قواعد صارمة
==================================================
- كل سجل حالة مستقلة
- ممنوع التخمين
- ممنوع استخدام معلومات خارج النص
- إذا السياق غير كافٍ، قلّل الثقة ولا تفترض
- لا تتأثر بكون النص رد أو اقتباس

==================================================
صيغة الإخراج (JSON فقط)
==================================================
أعد JSON object مع "results" array يحتوي على نتيجة لكل سجل بالشكل التالي:

{
  "id": "...",
  "sentiment": "إيجابي | سلبي | محايد",
  "topic": "...",
  "stance": "داعم | معارض | وصفي",
  "confidence": 0.00,
  "short_reason": "جملة عربية قصيرة تشرح سبب التصنيف"
}

ممنوع: أي شرح خارج JSON، أي Markdown، أي نص إضافي.`;

  // Valid Arabic values for each field
  const validSentiments = ["إيجابي", "سلبي", "محايد"];
  const validTopics = ["جودة المحتوى", "الاشتراك والتسعير", "الحياد والتحيز", "إشادة", "انتقاد", "نقل رياضي", "محتوى ديني أو قيمي", "محتوى ثقافي أو معرفي", "غير ذلك"];
  const validStances = ["داعم", "معارض", "وصفي"];

  let analysisRunning = false;

  app.post("/api/analyze/start", async (req: Request, res: Response) => {
    if (blockIfSafeMode(res)) return;
    
    if (analysisRunning) {
      return res.json({ ok: true, message: "Analysis already running" });
    }
    res.json({ ok: true, message: "Analysis started" });
    
    analysisRunning = true;
    runParallelAnalysis().finally(() => { analysisRunning = false; });
  });

  async function runParallelAnalysis() {
    const BATCH_SIZE = 10;
    const CONCURRENT_WORKERS = 4;
    
    await refreshTweetIdMap();

    async function processOneBatch(): Promise<boolean> {
      const pendingMentions = await db.select()
        .from(mentions)
        .where(eq(mentions.analysisStatus, "pending"))
        .limit(BATCH_SIZE);

      if (pendingMentions.length === 0) return false;

      const ids = pendingMentions.map(m => m.id);
      await db.update(mentions)
        .set({ analysisStatus: "processing" })
        .where(inArray(mentions.id, ids));

      const batchInput = pendingMentions.map(mention => {
        const processed = processMentionText({
          hitSentence: mention.hitSentence,
          openingText: mention.openingText,
          title: mention.title,
          informationType: mention.informationType,
          url: mention.url,
          linksRaw: mention.linksRaw,
        });

        const context = findOriginalContext(mention.linksRaw);

        return {
          id: mention.id,
          clean_text: processed.cleanText || "لا يوجد محتوى",
          original_context_text: context.found ? context.text?.substring(0, 300) : null,
          _processed: processed,
          _contextFound: context.found,
        };
      });

      try {
        const inputForAI = batchInput.map(({ id, clean_text, original_context_text }) => ({ 
          id, 
          clean_text, 
          original_context_text 
        }));

        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
            { role: "user", content: JSON.stringify(inputForAI) }
          ],
          response_format: { type: "json_object" },
          max_completion_tokens: 1500,
        });

        const content = response.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(content);
        const results = parsed.results || [];

        for (const result of results) {
          const mentionInput = batchInput.find(m => m.id === result.id);
          if (!mentionInput) continue;

          const processed = mentionInput._processed;
          
          // Use Arabic values directly from AI output, with fallbacks
          const sentiment = validSentiments.includes(result.sentiment) ? result.sentiment : "محايد";
          const topic = validTopics.includes(result.topic) ? result.topic : (result.topic || "غير ذلك");
          const stance = validStances.includes(result.stance) ? result.stance : "وصفي";

          await db.update(mentions)
            .set({
              analysisStatus: "done",
              cleanText: processed.cleanText,
              recordType: processed.recordType,
              originalUrl: processed.originalUrl,
              hasOriginalContext: processed.hasOriginalContext,
              aiSentiment: sentiment,
              aiTopic: topic,
              aiStance: stance,
              confidenceScore: result.confidence || 0.5,
              contextUsed: mentionInput._contextFound,
              contextMissing: !mentionInput._contextFound && processed.recordType !== "post",
              shortReason: result.short_reason || null,
              analyzedAt: new Date(),
              analysisVersion: "ar_v5",
            })
            .where(eq(mentions.id, result.id));
        }

        const processedIds = new Set(results.map((r: any) => r.id));
        for (const input of batchInput) {
          if (!processedIds.has(input.id)) {
            await db.update(mentions)
              .set({ analysisStatus: "failed" })
              .where(eq(mentions.id, input.id));
          }
        }

      } catch (err) {
        console.error("Batch analysis error:", err);
        await db.update(mentions)
          .set({ analysisStatus: "failed" })
          .where(inArray(mentions.id, ids));
      }

      return true;
    }

    async function worker() {
      let hasMore = true;
      while (hasMore) {
        hasMore = await processOneBatch();
      }
    }

    const workers = Array(CONCURRENT_WORKERS).fill(null).map(() => worker());
    await Promise.all(workers);
  }

  // TikTok AI Analysis - Enhanced prompt with guardrails
  const TIKTOK_ANALYSIS_PROMPT = `أنت محلل رصد اجتماعي متخصص في تحليل تعليقات تيك توك العربية حول شركة «ثمانية» ومنتجاتها ومحتواها.

مهمتك هي تحليل تعليقات تيك توك وتصنيفها بدقة من حيث:
- المشاعر (إيجابي | سلبي | محايد)
- الموضوع الرئيسي
- الموقف من ثمانية

==================================================
سياق عام عن «ثمانية»
==================================================
«ثمانية» شركة سعودية لصناعة المحتوى، تعمل في مجالات متعددة:
- البودكاست (مثل: فنجان، سقراط، آدم، جادي)
- المحتوى المرئي على يوتيوب وتيك توك
- النشرات البريدية والصحافة المكتوبة
- التغطية الرياضية (الدوري السعودي، كأس السوبر)

حسابات ثمانية على تيك توك:
- thmanyahsports: رياضة ثمانية
- thmanyah: القناة الرئيسية
- thmanyahexit: مخرج ثمانية
- thmanyahliving: معيشة ثمانية
- radiothmanyah: راديو ثمانية

==================================================
مهام التحليل (إجباري)
==================================================
1. sentiment (المشاعر): إيجابي | سلبي | محايد
2. topic (الموضوع): جودة المحتوى | الاشتراك والتسعير | الحياد والتحيز | إشادة | انتقاد | نقل رياضي | محتوى ديني أو قيمي | محتوى ثقافي أو معرفي | غير ذلك
3. stance (الموقف): داعم | معارض | وصفي
4. key_points: قائمة من 1-2 نقاط رئيسية مختصرة بالعربية
5. confidence: من 0.0 إلى 1.0
6. short_reason: جملة عربية قصيرة تشرح سبب التصنيف

==================================================
تعليمات خاصة (مهمة!)
==================================================
- إذا كان النص فارغاً أو مكوناً من حرف/كلمة واحدة فقط (مثل: "اول"، "."، "❤️")، صنّفه كـ: sentiment="محايد"، topic="غير ذلك"، stance="وصفي"، confidence=0.3
- إذا كان النص غير مفهوم أو عشوائي، صنّفه كـ: sentiment="محايد"، topic="غير ذلك"، stance="وصفي"، confidence=0.2
- لا ترفض أي تعليق - حلل كل التعليقات المعطاة
- كل تعليق يجب أن يكون له نتيجة في results
- يجب أن يتطابق عدد النتائج مع عدد التعليقات المدخلة

==================================================
شكل الإخراج
==================================================
يجب إرجاع JSON فقط بهذا الشكل:
{
  "results": [
    {
      "id": "<original_id>",
      "sentiment": "إيجابي",
      "topic": "جودة المحتوى",
      "stance": "داعم",
      "key_points": ["نقطة 1", "نقطة 2"],
      "confidence": 0.85,
      "short_reason": "تعليق إيجابي يمدح جودة الفيديو"
    }
  ]
}

ممنوع: أي شرح خارج JSON، أي Markdown، أي نص إضافي.`;

  const validTiktokSentiments = ["إيجابي", "سلبي", "محايد"];
  const validTiktokTopics = ["جودة المحتوى", "الاشتراك والتسعير", "الحياد والتحيز", "إشادة", "انتقاد", "نقل رياضي", "محتوى ديني أو قيمي", "محتوى ثقافي أو معرفي", "غير ذلك"];
  const validTiktokStances = ["داعم", "معارض", "وصفي"];

  let tiktokAnalysisRunning = false;

  // Reset stale "processing" items on startup (handles server restart mid-analysis)
  (async () => {
    try {
      const resetResult = await db.update(tiktokComments)
        .set({ analysisStatus: "pending" })
        .where(eq(tiktokComments.analysisStatus, "processing"));
      console.log("[TikTok AI] Reset stale processing items on startup");
    } catch (err) {
      console.error("[TikTok AI] Failed to reset stale items:", err);
    }
  })();

  app.get("/api/tiktok/analyze/status", async (req: Request, res: Response) => {
    try {
      const [pending] = await db.select({ count: count() })
        .from(tiktokComments)
        .where(eq(tiktokComments.analysisStatus, "pending"));

      const [processing] = await db.select({ count: count() })
        .from(tiktokComments)
        .where(eq(tiktokComments.analysisStatus, "processing"));

      const [done] = await db.select({ count: count() })
        .from(tiktokComments)
        .where(eq(tiktokComments.analysisStatus, "done"));

      res.json({
        running: tiktokAnalysisRunning,
        pending: pending?.count || 0,
        processing: processing?.count || 0,
        done: done?.count || 0,
      });
    } catch (error) {
      console.error("TikTok analyze status error:", error);
      res.status(500).json({ error: "Failed to fetch status" });
    }
  });

  app.post("/api/tiktok/analyze", async (req: Request, res: Response) => {
    if (blockIfSafeMode(res)) return;
    
    if (tiktokAnalysisRunning) {
      return res.json({ ok: true, message: "Analysis already running" });
    }
    res.json({ ok: true, message: "TikTok analysis started" });
    
    tiktokAnalysisRunning = true;
    runTiktokAnalysis().finally(() => { tiktokAnalysisRunning = false; });
  });

  async function runTiktokAnalysis() {
    const BATCH_SIZE = 10;
    const CONCURRENT_WORKERS = 2;

    async function processOneBatch(): Promise<boolean> {
      const pendingComments = await db.select()
        .from(tiktokComments)
        .where(eq(tiktokComments.analysisStatus, "pending"))
        .limit(BATCH_SIZE);

      if (pendingComments.length === 0) return false;

      const ids = pendingComments.map(c => c.id);
      await db.update(tiktokComments)
        .set({ analysisStatus: "processing" })
        .where(inArray(tiktokComments.id, ids));

      const batchInput = pendingComments.map(comment => ({
        id: comment.id,
        text: comment.text || "",
        user: comment.userNickname || comment.userUniqueId || "unknown",
      }));

      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: TIKTOK_ANALYSIS_PROMPT },
            { role: "user", content: JSON.stringify(batchInput) }
          ],
          response_format: { type: "json_object" },
          max_completion_tokens: 1500,
        });

        const content = response.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(content);
        const results = parsed.results || [];

        const processedIds = new Set<string>();

        for (const result of results) {
          if (!result.id) continue;

          const sentiment = validTiktokSentiments.includes(result.sentiment) ? result.sentiment : "محايد";
          const topic = validTiktokTopics.includes(result.topic) ? result.topic : (result.topic || "غير ذلك");
          const stance = validTiktokStances.includes(result.stance) ? result.stance : "وصفي";

          await db.update(tiktokComments)
            .set({
              analysisStatus: "done",
              aiSentiment: sentiment,
              aiTopic: topic,
              aiStance: stance,
              keyPoints: result.key_points || [],
              confidenceScore: result.confidence || 0.5,
              shortReason: result.short_reason || null,
              analyzedAt: new Date(),
              analysisVersion: "tiktok_ar_v1",
            })
            .where(eq(tiktokComments.id, result.id));

          processedIds.add(result.id);
        }

        for (const input of batchInput) {
          if (!processedIds.has(input.id)) {
            await db.update(tiktokComments)
              .set({ analysisStatus: "failed" })
              .where(eq(tiktokComments.id, input.id));
          }
        }

      } catch (err) {
        console.error("TikTok batch analysis error:", err);
        await db.update(tiktokComments)
          .set({ analysisStatus: "failed" })
          .where(inArray(tiktokComments.id, ids));
      }

      return true;
    }

    async function worker() {
      let hasMore = true;
      while (hasMore) {
        hasMore = await processOneBatch();
      }
    }

    const workers = Array(CONCURRENT_WORKERS).fill(null).map(() => worker());
    await Promise.all(workers);
  }

  app.get("/api/overview/stats", async (req: Request, res: Response) => {
    try {
      const allMentionsData = await db.select().from(mentions);
      const allMentions = allMentionsData || [];
      
      const tiktokCommentsData = await db.select().from(tiktokComments);
      const allTiktokComments = tiktokCommentsData || [];
      
      const xMentions = allMentions.filter(m => {
        const platform = (m.sourceName || m.platform || "").toLowerCase();
        return platform.includes("twitter") || platform.includes("x") || !platform.includes("tiktok");
      });

      const getMentionSentimentBreakdown = (items: typeof allMentions) => {
        return ["إيجابي", "سلبي", "محايد"].map(sentiment => ({
          sentiment,
          count: items.filter(m => m.aiSentiment === sentiment).length
        }));
      };
      
      const getTiktokSentimentBreakdown = (items: typeof allTiktokComments) => {
        return ["إيجابي", "سلبي", "محايد"].map(sentiment => ({
          sentiment,
          count: items.filter(c => c.aiSentiment === sentiment).length
        }));
      };

      const platforms = [
        {
          platform: "x",
          totalMentions: xMentions.length,
          totalEngagement: xMentions.reduce((sum, m) => sum + (m.engagement || 0), 0),
          sentimentBreakdown: getMentionSentimentBreakdown(xMentions)
        },
        {
          platform: "tiktok",
          totalMentions: allTiktokComments.length,
          totalEngagement: allTiktokComments.reduce((sum, c) => sum + (c.diggCount || 0), 0),
          sentimentBreakdown: getTiktokSentimentBreakdown(allTiktokComments)
        }
      ];

      const totalMentions = xMentions.length + allTiktokComments.length;
      const totalEngagement = xMentions.reduce((sum, m) => sum + (m.engagement || 0), 0) + 
                              allTiktokComments.reduce((sum, c) => sum + (c.diggCount || 0), 0);
      
      const combinedSentiment = ["إيجابي", "سلبي", "محايد"].map(sentiment => ({
        sentiment,
        count: xMentions.filter(m => m.aiSentiment === sentiment).length + 
               allTiktokComments.filter(c => c.aiSentiment === sentiment).length
      }));

      res.json({
        platforms,
        totalMentions,
        totalEngagement,
        combinedSentiment
      });
    } catch (error) {
      console.error("Overview stats error:", error);
      res.status(500).json({ error: "Failed to get overview stats" });
    }
  });

  app.get("/api/dashboard/stats", async (req: Request, res: Response) => {
    try {
      const { from, to } = req.query;
      
      let dateConditions: any[] = [];
      if (from) dateConditions.push(gte(mentions.dateTime, new Date(from as string)));
      if (to) dateConditions.push(lte(mentions.dateTime, new Date(to as string)));

      const allData = await db.select()
        .from(mentions)
        .where(dateConditions.length > 0 ? and(...dateConditions) : undefined);
      
      const allMentions = allData || [];
      const analyzedMentions = allMentions.filter(m => m.analysisStatus === "done");
      
      const totalMentions = allMentions.length;
      const totalReach = allMentions.reduce((sum, m) => sum + (m.reach || 0), 0);
      const totalEngagement = allMentions.reduce((sum, m) => sum + (m.engagement || 0), 0);
      
      const negativeCount = analyzedMentions.filter(m => m.aiSentiment === "سلبي").length;
      const negativePercentage = analyzedMentions.length > 0 ? (negativeCount / analyzedMentions.length) * 100 : 0;

      const analyzedCount = analyzedMentions.length;
      const pendingCount = allMentions.filter(m => m.analysisStatus === "pending").length;

      const sentimentBreakdown = ["إيجابي", "سلبي", "محايد"].map(sentiment => ({
        sentiment,
        count: analyzedMentions.filter(m => m.aiSentiment === sentiment).length
      }));

      const platformCounts: Record<string, number> = {};
      allMentions.forEach(m => {
        const platform = m.sourceName || m.platform || "غير معروف";
        platformCounts[platform] = (platformCounts[platform] || 0) + 1;
      });
      const platformBreakdown = Object.entries(platformCounts)
        .map(([platform, count]) => ({ platform, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const topicCounts: Record<string, number> = {};
      analyzedMentions.forEach(m => {
        const topic = m.aiTopic || "أخرى";
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
      const topicBreakdown = Object.entries(topicCounts)
        .map(([topic, count]) => ({ topic, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const verticalCounts: Record<string, number> = {};
      analyzedMentions.forEach(m => {
        const vertical = m.contentVertical || "غير واضح";
        verticalCounts[vertical] = (verticalCounts[vertical] || 0) + 1;
      });
      const verticalBreakdown = Object.entries(verticalCounts)
        .map(([vertical, count]) => ({ vertical, count }))
        .sort((a, b) => b.count - a.count);

      const fromDate = from ? new Date(from as string) : null;
      const toDate = to ? new Date(to as string) : null;
      const isHourlyMode = fromDate && toDate && (toDate.getTime() - fromDate.getTime()) <= 24 * 60 * 60 * 1000;

      const dateCounts: Record<string, { mentions: number; reach: number; positive: number; negative: number; neutral: number }> = {};
      allMentions.forEach(m => {
        if (m.dateTime) {
          const dateObj = new Date(m.dateTime);
          let key: string;
          if (isHourlyMode) {
            key = dateObj.toISOString().slice(0, 13) + ":00";
          } else {
            key = dateObj.toISOString().split("T")[0];
          }
          if (!dateCounts[key]) dateCounts[key] = { mentions: 0, reach: 0, positive: 0, negative: 0, neutral: 0 };
          dateCounts[key].mentions++;
          dateCounts[key].reach += m.reach || 0;
          if (m.aiSentiment === "إيجابي") dateCounts[key].positive++;
          else if (m.aiSentiment === "سلبي") dateCounts[key].negative++;
          else if (m.aiSentiment === "محايد") dateCounts[key].neutral++;
        }
      });
      const timelineData = Object.entries(dateCounts)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const normalizeHandle = (handle: string | null | undefined): string => {
        if (!handle) return "غير معروف";
        let cleaned = handle.trim();
        while (cleaned.startsWith("@@")) {
          cleaned = cleaned.substring(1);
        }
        if (cleaned.startsWith("@")) {
          cleaned = cleaned.substring(1);
        }
        return cleaned;
      };

      const authorCounts: Record<string, { name: string; handle: string; count: number; engagement: number }> = {};
      allMentions.forEach(m => {
        const rawHandle = m.authorHandle || m.authorName || "غير معروف";
        const handle = normalizeHandle(rawHandle);
        if (!authorCounts[handle]) {
          authorCounts[handle] = { name: m.authorName || handle, handle, count: 0, engagement: 0 };
        }
        authorCounts[handle].count++;
        authorCounts[handle].engagement += (m.engagement || 0);
      });
      const topAuthors = Object.values(authorCounts)
        .sort((a, b) => b.engagement - a.engagement)
        .slice(0, 10);

      const hashtagCounts: Record<string, number> = {};
      allMentions.forEach(m => {
        if (m.hashtags) {
          const tags = m.hashtags.split(/[,;]\s*/);
          tags.forEach(tag => {
            const cleaned = tag.trim().replace(/^#/, "");
            if (cleaned) {
              hashtagCounts[cleaned] = (hashtagCounts[cleaned] || 0) + 1;
            }
          });
        }
      });
      const topHashtags = Object.entries(hashtagCounts)
        .map(([hashtag, count]) => ({ hashtag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const languageCounts: Record<string, number> = {};
      allMentions.forEach(m => {
        const lang = m.language || "غير معروف";
        languageCounts[lang] = (languageCounts[lang] || 0) + 1;
      });
      const languageBreakdown = Object.entries(languageCounts)
        .map(([language, count]) => ({ language, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const countryCounts: Record<string, number> = {};
      allMentions.forEach(m => {
        const country = m.country || "غير معروف";
        countryCounts[country] = (countryCounts[country] || 0) + 1;
      });
      const countryBreakdown = Object.entries(countryCounts)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      let previousStats = {
        totalMentions: 0,
        totalReach: 0,
        totalEngagement: 0,
        negativePercentage: 0,
      };

      if (from && to) {
        const fromDate = new Date(from as string);
        const toDate = new Date(to as string);
        const rangeDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
        
        const prevTo = new Date(fromDate);
        prevTo.setDate(prevTo.getDate() - 1);
        const prevFrom = new Date(prevTo);
        prevFrom.setDate(prevFrom.getDate() - rangeDays);

        const prevData = await db.select()
          .from(mentions)
          .where(and(
            gte(mentions.dateTime, prevFrom),
            lte(mentions.dateTime, prevTo)
          ));

        if (prevData && prevData.length > 0) {
          previousStats.totalMentions = prevData.length;
          previousStats.totalReach = prevData.reduce((sum, m) => sum + (m.reach || 0), 0);
          previousStats.totalEngagement = prevData.reduce((sum, m) => sum + (m.engagement || 0), 0);
          const prevAnalyzed = prevData.filter(m => m.analysisStatus === "done");
          const prevNegative = prevAnalyzed.filter(m => m.aiSentiment === "سلبي").length;
          previousStats.negativePercentage = prevAnalyzed.length > 0 ? (prevNegative / prevAnalyzed.length) * 100 : 0;
        }
      }

      const calcChange = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      res.json({
        current: {
          totalMentions,
          totalReach,
          totalEngagement,
          negativePercentage,
          analyzedCount,
          pendingCount,
          sentimentBreakdown,
          platformBreakdown,
          topicBreakdown,
          verticalBreakdown,
          timelineData,
          topAuthors,
          topHashtags,
          languageBreakdown,
          countryBreakdown,
        },
        previous: previousStats,
        changes: {
          mentions: calcChange(totalMentions, previousStats.totalMentions),
          reach: calcChange(totalReach, previousStats.totalReach),
          engagement: calcChange(totalEngagement, previousStats.totalEngagement),
          negativePercentage: negativePercentage - previousStats.negativePercentage,
        },
      });
    } catch (error) {
      console.error("Dashboard error:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/explore", async (req: Request, res: Response) => {
    try {
      const { 
        from, to, platform, contentVertical, aiSentiment, aiTopic, analysisStatus,
        sortBy = "date_time", sortOrder = "desc", page = "1", limit = "25"
      } = req.query;

      const pageNum = parseInt(page as string) || 1;
      const limitNum = Math.min(parseInt(limit as string) || 25, 100);
      const offset = (pageNum - 1) * limitNum;

      let conditions: any[] = [];

      if (from) conditions.push(gte(mentions.dateTime, new Date(from as string)));
      if (to) conditions.push(lte(mentions.dateTime, new Date(to as string)));
      if (platform && platform !== "all") conditions.push(eq(mentions.platform, platform as string));
      if (contentVertical && contentVertical !== "all") conditions.push(eq(mentions.contentVertical, contentVertical as string));
      if (aiSentiment && aiSentiment !== "all") conditions.push(eq(mentions.aiSentiment, aiSentiment as string));
      if (aiTopic && aiTopic !== "all") conditions.push(eq(mentions.aiTopic, aiTopic as string));
      if (analysisStatus && analysisStatus !== "all") conditions.push(eq(mentions.analysisStatus, analysisStatus as string));

      const sortColumnMap: Record<string, any> = {
        date_time: mentions.dateTime,
        reach: mentions.reach,
        engagement: mentions.engagement,
        source_name: mentions.sourceName,
      };
      const sortColumn = sortColumnMap[sortBy as string] || mentions.dateTime;
      const orderFn = sortOrder === "asc" ? asc : desc;

      let dataQuery = db.select().from(mentions);
      let countQuery = db.select({ count: count() }).from(mentions);
      
      if (conditions.length > 0) {
        const whereClause = and(...conditions);
        dataQuery = dataQuery.where(whereClause) as typeof dataQuery;
        countQuery = countQuery.where(whereClause) as typeof countQuery;
      }

      const data = await dataQuery
        .orderBy(orderFn(sortColumn))
        .limit(limitNum)
        .offset(offset);

      const [countResult] = await countQuery;

      const total = countResult?.count || 0;

      res.json({
        mentions: data || [],
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      });
    } catch (error) {
      console.error("Explore error:", error);
      res.status(500).json({ error: "Failed to fetch mentions" });
    }
  });

  app.get("/api/post/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const [post] = await db.select().from(mentions).where(eq(mentions.id, id));

      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      let thread: typeof post[] = [];
      if (post.originalTweetUrl) {
        thread = await db.select()
          .from(mentions)
          .where(eq(mentions.url, post.originalTweetUrl))
          .limit(10);
      }

      res.json({ post, thread });
    } catch (error) {
      console.error("Post error:", error);
      res.status(500).json({ error: "Failed to fetch post" });
    }
  });

  app.get("/api/filters/options", async (req: Request, res: Response) => {
    try {
      const platformsRaw = await db.selectDistinct({ platform: mentions.platform })
        .from(mentions)
        .where(sql`${mentions.platform} IS NOT NULL`);
      
      const topicsRaw = await db.selectDistinct({ topic: mentions.aiTopic })
        .from(mentions)
        .where(sql`${mentions.aiTopic} IS NOT NULL`);

      res.json({
        platforms: platformsRaw.map(p => p.platform).filter(Boolean),
        topics: topicsRaw.map(t => t.topic).filter(Boolean),
        sentiments: ["Positive", "Negative", "Neutral"],
        verticals: ["Sports", "Thmanyah Original Content", "Unclear"],
        statuses: ["pending", "processing", "done", "failed"],
      });
    } catch (error) {
      console.error("Filters error:", error);
      res.status(500).json({ error: "Failed to fetch filter options" });
    }
  });

  // =====================
  // TikTok Routes
  // =====================
  
  initTiktokAccounts().catch(console.error);
  
  const apifyToken = process.env.APIFY_API_TOKEN;
  if (apifyToken) {
    // COST CONTROL: Disabled automatic sync - manual trigger only
    // startScheduledSync(apifyToken).catch(console.error);
    console.log("[TikTok] Automatic sync DISABLED for cost control. Use manual sync button.");
  } else {
    console.log("[TikTok] APIFY_API_TOKEN not set - scheduled sync disabled");
  }

  app.get("/api/tiktok/accounts", async (req: Request, res: Response) => {
    try {
      const stats = await getTiktokStats();
      res.json(stats);
    } catch (error) {
      console.error("TikTok accounts error:", error);
      res.status(500).json({ error: "Failed to fetch TikTok accounts" });
    }
  });

  app.get("/api/tiktok/stats", async (req: Request, res: Response) => {
    try {
      const stats = await getTiktokStats();
      res.json(stats);
    } catch (error) {
      console.error("TikTok stats error:", error);
      res.status(500).json({ error: "Failed to fetch TikTok stats" });
    }
  });

  app.get("/api/tiktok/comments", async (req: Request, res: Response) => {
    try {
      const { accountHandle, videoId, aiSentiment, analysisStatus, from, to, sortBy, sortOrder, page, limit } = req.query;
      
      const result = await getTiktokComments({
        accountHandle: accountHandle as string,
        videoId: videoId as string,
        aiSentiment: aiSentiment as string,
        analysisStatus: analysisStatus as string,
        from: from as string,
        to: to as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as "asc" | "desc",
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      
      res.json(result);
    } catch (error) {
      console.error("TikTok comments error:", error);
      res.status(500).json({ error: "Failed to fetch TikTok comments" });
    }
  });

  app.post("/api/tiktok/sync", requireAdmin, async (req: Request, res: Response) => {
    if (blockIfSafeMode(res)) return;
    
    try {
      const apifyToken = process.env.APIFY_API_TOKEN;
      if (!apifyToken) {
        return res.status(400).json({ error: "APIFY_API_TOKEN not configured" });
      }
      
      const { accountHandle } = req.body;
      
      if (accountHandle) {
        const result = await syncTiktokAccount(apifyToken, accountHandle);
        return res.json(result);
      } else {
        const results = await syncAllTiktokAccounts(apifyToken);
        return res.json({ results });
      }
    } catch (error) {
      console.error("TikTok sync error:", error);
      res.status(500).json({ error: "Failed to sync TikTok data" });
    }
  });

  app.get("/api/tiktok/scheduler", async (req: Request, res: Response) => {
    try {
      const status = getSchedulerStatus();
      const history = await getSyncJobHistory(10);
      res.json({ ...status, recentJobs: history });
    } catch (error) {
      console.error("Scheduler status error:", error);
      res.status(500).json({ error: "Failed to get scheduler status" });
    }
  });

  app.get("/api/tiktok/dashboard", async (req: Request, res: Response) => {
    try {
      const { accountHandle, from, to } = req.query;
      const dashboard = await getTiktokDashboard(
        accountHandle as string | undefined,
        from as string | undefined,
        to as string | undefined
      );
      res.json(dashboard);
    } catch (error) {
      console.error("TikTok dashboard error:", error);
      res.status(500).json({ error: "Failed to fetch TikTok dashboard" });
    }
  });

  app.get("/api/tiktok/account/:handle", async (req: Request, res: Response) => {
    try {
      const { handle } = req.params;
      const stats = await getAccountStats(handle);
      if (!stats) {
        return res.status(404).json({ error: "Account not found" });
      }
      res.json(stats);
    } catch (error) {
      console.error("TikTok account stats error:", error);
      res.status(500).json({ error: "Failed to fetch account stats" });
    }
  });

  // ==========================================
  // GOOGLE SHEETS API ENDPOINTS
  // ==========================================

  // X (Twitter) data from Google Sheets
  app.get("/api/sheets/x", async (req: Request, res: Response) => {
    try {
      // Get date range from query params
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      
      // Server-side date filtering - pass dates to query
      const filteredData = await getXData(startDate, endDate);
      
      const stats = computeStats(
        filteredData,
        (row) => row.date,
        (row) => row.likes,
        (row) => row.hitSentence
      );
      
      const totalReplies = filteredData.reduce((sum, row) => sum + row.replies, 0);
      const totalReposts = filteredData.reduce((sum, row) => sum + row.reposts, 0);
      const totalViews = filteredData.reduce((sum, row) => sum + row.views, 0);
      
      res.json({
        data: filteredData,
        stats: {
          ...stats,
          totalReplies,
          totalReposts,
          totalViews,
        }
      });
    } catch (error) {
      console.error("X data error:", error);
      res.status(500).json({ error: "Failed to fetch X data" });
    }
  });

  // TikTok data from Google Sheets
  app.get("/api/sheets/tiktok", async (req: Request, res: Response) => {
    try {
      // Get date range from query params
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      
      // Server-side date filtering - pass dates to query
      const filteredData = await getTikTokData(startDate, endDate);
      
      // Build alias-to-canonical name mapping
      const aliasToCanonical = new Map<string, string>();
      THMANYAH_TIKTOK_ACCOUNTS.forEach(acc => {
        acc.aliases.forEach(alias => aliasToCanonical.set(alias, acc.nameAr));
      });
      
      // Group comments by canonical name (handles aliases)
      const accountCommentsByName = new Map<string, TikTokDataRow[]>();
      THMANYAH_TIKTOK_ACCOUNTS.forEach(acc => {
        accountCommentsByName.set(acc.nameAr, []);
      });
      
      filteredData.forEach(row => {
        const canonicalName = aliasToCanonical.get(row.accountNameAr);
        if (canonicalName) {
          accountCommentsByName.get(canonicalName)!.push(row);
        }
      });
      
      // Build accounts array from predefined list only (no duplicates)
      const accounts = THMANYAH_TIKTOK_ACCOUNTS.map(({ username, nameAr }) => {
        const comments = accountCommentsByName.get(nameAr) || [];
        const videos = new Map<string, TikTokDataRow>();
        comments.forEach(c => {
          if (!videos.has(c.postId)) videos.set(c.postId, c);
        });
        return {
          username,
          nameAr,
          totalComments: comments.length,
          totalVideos: videos.size,
          totalLikes: comments.reduce((sum, c) => sum + c.commentDiggCount, 0),
        };
      });
      
      const stats = computeStats(
        filteredData,
        (row) => row.commentCreateTimeIso,
        (row) => row.commentDiggCount,
        (row) => row.commentText
      );
      
      // Compute accountTimeline for multi-line charts
      const accountDateGroups: Record<string, Record<string, number>> = {};
      filteredData.forEach(row => {
        const date = row.commentCreateTimeIso?.split('T')[0];
        const canonicalName = aliasToCanonical.get(row.accountNameAr);
        if (date && canonicalName) {
          if (!accountDateGroups[date]) accountDateGroups[date] = {};
          accountDateGroups[date][canonicalName] = (accountDateGroups[date][canonicalName] || 0) + 1;
        }
      });
      
      const accountNames = THMANYAH_TIKTOK_ACCOUNTS.map(a => a.nameAr);
      const accountTimeline = Object.entries(accountDateGroups)
        .map(([date, counts]) => {
          const entry: Record<string, any> = { date };
          accountNames.forEach(name => {
            entry[name] = counts[name] || 0;
          });
          return entry;
        })
        .sort((a, b) => (a.date as string).localeCompare(b.date as string));
      
      // Check if nolimit parameter is set (for Overview page)
      const nolimit = req.query.nolimit === 'true';
      
      // Cursor-based pagination (skipped if nolimit=true)
      const pageSize = parseInt(req.query.pageSize as string) || 50;
      const cursor = req.query.cursor as string;
      
      const sortedData = [...filteredData].sort((a, b) => 
        b.commentCreateTimeIso.localeCompare(a.commentCreateTimeIso)
      );
      
      let cursoredData = sortedData;
      if (cursor && !nolimit) {
        cursoredData = sortedData.filter(row => row.commentCreateTimeIso < cursor);
      }
      
      const paginatedData = nolimit ? cursoredData : cursoredData.slice(0, pageSize);
      const hasMore = nolimit ? false : cursoredData.length > pageSize;
      const nextCursor = hasMore && paginatedData.length > 0 
        ? paginatedData[paginatedData.length - 1].commentCreateTimeIso 
        : null;
      
      const comments = paginatedData.map(row => ({
        accountNameAr: row.accountNameAr,
        accountUsername: row.accountUsername,
        postUrl: row.postUrl,
        postId: row.postId,
        postDescription: row.postDescription,
        commentCid: row.commentCid,
        commentText: row.commentText,
        commentCreateTimeIso: row.commentCreateTimeIso,
        commentDiggCount: row.commentDiggCount,
        commentUniqueId: row.commentUniqueId,
        commentAvatarThumbnail: row.commentAvatarThumbnail,
      }));
      
      res.json({ 
        accounts, 
        stats: { ...stats, accountTimeline }, 
        comments,
        pagination: { total: filteredData.length, pageSize: nolimit ? filteredData.length : pageSize, hasMore, nextCursor }
      });
    } catch (error) {
      console.error("TikTok sheets data error:", error);
      res.status(500).json({ error: "Failed to fetch TikTok data" });
    }
  });

  // TikTok account detail from Google Sheets
  app.get("/api/sheets/tiktok/:username", async (req: Request, res: Response) => {
    try {
      const { username } = req.params;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const allData = await getTikTokData(startDate, endDate);
      const data = allData.filter(row => row.accountUsername === username);
      
      if (data.length === 0) {
        return res.status(404).json({ error: "Account not found" });
      }
      
      const nameAr = data[0].accountNameAr;
      
      // Group by post
      const postsMap = new Map<string, { post: TikTokDataRow; comments: TikTokDataRow[] }>();
      data.forEach(row => {
        if (!postsMap.has(row.postId)) {
          postsMap.set(row.postId, { post: row, comments: [] });
        }
        postsMap.get(row.postId)!.comments.push(row);
      });
      
      const videos = Array.from(postsMap.values()).map(({ post, comments }) => ({
        postId: post.postId,
        postUrl: post.postUrl,
        postDescription: post.postDescription,
        postCreateTime: post.postCreateTime,
        postLikeCount: post.postLikeCount,
        postCommentCount: post.postCommentCount,
        comments: comments.map(c => ({
          cid: c.commentCid,
          text: c.commentText,
          createTime: c.commentCreateTimeIso,
          likes: c.commentDiggCount,
          username: c.commentUniqueId,
          avatar: c.commentAvatarThumbnail,
        })),
      }));
      
      const stats = computeStats(
        data,
        (row) => row.commentCreateTimeIso,
        (row) => row.commentDiggCount,
        (row) => row.commentText
      );
      
      const pageSize = parseInt(req.query.pageSize as string) || 50;
      const cursor = req.query.cursor as string;
      
      const sortedData = [...data].sort((a, b) => 
        b.commentCreateTimeIso.localeCompare(a.commentCreateTimeIso)
      );
      
      let cursoredData = sortedData;
      if (cursor) {
        cursoredData = sortedData.filter(row => row.commentCreateTimeIso < cursor);
      }
      
      const paginatedData = cursoredData.slice(0, pageSize);
      const hasMore = cursoredData.length > pageSize;
      const nextCursor = hasMore && paginatedData.length > 0 
        ? paginatedData[paginatedData.length - 1].commentCreateTimeIso 
        : null;
      
      const comments = paginatedData.map(row => ({
        accountNameAr: row.accountNameAr,
        accountUsername: row.accountUsername,
        postUrl: row.postUrl,
        postId: row.postId,
        postDescription: row.postDescription,
        commentCid: row.commentCid,
        commentText: row.commentText,
        commentCreateTimeIso: row.commentCreateTimeIso,
        commentDiggCount: row.commentDiggCount,
        commentUniqueId: row.commentUniqueId,
        commentAvatarThumbnail: row.commentAvatarThumbnail,
      }));
      
      res.json({ 
        username, 
        nameAr, 
        videos, 
        stats, 
        comments,
        pagination: { total: data.length, pageSize, hasMore, nextCursor }
      });
    } catch (error) {
      console.error("TikTok account sheets data error:", error);
      res.status(500).json({ error: "Failed to fetch TikTok account data" });
    }
  });

  // Instagram data from Google Sheets
  app.get("/api/sheets/instagram", async (req: Request, res: Response) => {
    try {
      // Get date range from query params
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      
      // Server-side date filtering - pass dates to query
      const filteredData = await getInstagramData(startDate, endDate);
      
      // Build alias-to-canonical name mapping
      const aliasToCanonical = new Map<string, string>();
      THMANYAH_INSTAGRAM_ACCOUNTS.forEach(acc => {
        acc.aliases.forEach(alias => aliasToCanonical.set(alias, acc.nameAr));
      });
      
      // Group comments by canonical name (handles aliases)
      const accountCommentsByName = new Map<string, InstagramDataRow[]>();
      THMANYAH_INSTAGRAM_ACCOUNTS.forEach(acc => {
        accountCommentsByName.set(acc.nameAr, []);
      });
      
      filteredData.forEach(row => {
        const canonicalName = aliasToCanonical.get(row.accountNameAr);
        if (canonicalName) {
          accountCommentsByName.get(canonicalName)!.push(row);
        }
      });
      
      // Build accounts array from predefined list only (no duplicates)
      const accounts = THMANYAH_INSTAGRAM_ACCOUNTS.map(({ username, nameAr }) => {
        const comments = accountCommentsByName.get(nameAr) || [];
        const posts = new Map<string, InstagramDataRow>();
        comments.forEach(c => {
          if (!posts.has(c.postShortcode)) posts.set(c.postShortcode, c);
        });
        return {
          username,
          nameAr,
          totalComments: comments.length,
          totalPosts: posts.size,
          totalLikes: comments.reduce((sum, c) => sum + c.commentLikes, 0),
        };
      });
      
      const stats = computeStats(
        filteredData,
        (row) => row.commentTimestamp,
        (row) => row.commentLikes,
        (row) => row.commentText
      );
      
      // Compute accountTimeline for multi-line charts
      const accountDateGroups: Record<string, Record<string, number>> = {};
      filteredData.forEach(row => {
        const date = row.commentTimestamp?.split('T')[0];
        const canonicalName = aliasToCanonical.get(row.accountNameAr);
        if (date && canonicalName) {
          if (!accountDateGroups[date]) accountDateGroups[date] = {};
          accountDateGroups[date][canonicalName] = (accountDateGroups[date][canonicalName] || 0) + 1;
        }
      });
      
      const accountNames = THMANYAH_INSTAGRAM_ACCOUNTS.map(a => a.nameAr);
      const accountTimeline = Object.entries(accountDateGroups)
        .map(([date, counts]) => {
          const entry: Record<string, any> = { date };
          accountNames.forEach(name => {
            entry[name] = counts[name] || 0;
          });
          return entry;
        })
        .sort((a, b) => (a.date as string).localeCompare(b.date as string));
      
      // Check if nolimit parameter is set (for Overview page)
      const nolimit = req.query.nolimit === 'true';
      
      // Cursor-based pagination (skipped if nolimit=true)
      const pageSize = parseInt(req.query.pageSize as string) || 50;
      const cursor = req.query.cursor as string;
      
      const sortedData = [...filteredData].sort((a, b) => 
        b.commentTimestamp.localeCompare(a.commentTimestamp)
      );
      
      let cursoredData = sortedData;
      if (cursor && !nolimit) {
        cursoredData = sortedData.filter(row => row.commentTimestamp < cursor);
      }
      
      const paginatedData = nolimit ? cursoredData : cursoredData.slice(0, pageSize);
      const hasMore = nolimit ? false : cursoredData.length > pageSize;
      const nextCursor = hasMore && paginatedData.length > 0 
        ? paginatedData[paginatedData.length - 1].commentTimestamp 
        : null;
      
      const comments = paginatedData.map(row => ({
        accountNameAr: row.accountNameAr,
        accountUsername: row.accountUsername,
        postUrl: row.postUrl,
        postShortcode: row.postShortcode,
        commentId: row.commentId,
        commentText: row.commentText,
        commentTimestamp: row.commentTimestamp,
        commentLikes: row.commentLikes,
        commentOwnerUsername: row.commentOwnerUsername,
        commentOwnerIsVerified: row.commentOwnerIsVerified,
        commentOwnerProfilePic: row.commentOwnerProfilePic,
      }));
      
      res.json({ 
        accounts, 
        stats: { ...stats, accountTimeline }, 
        comments,
        pagination: { total: filteredData.length, pageSize: nolimit ? filteredData.length : pageSize, hasMore, nextCursor }
      });
    } catch (error) {
      console.error("Instagram sheets data error:", error);
      res.status(500).json({ error: "Failed to fetch Instagram data" });
    }
  });

  // Instagram account detail from Google Sheets
  app.get("/api/sheets/instagram/:username", async (req: Request, res: Response) => {
    try {
      const { username } = req.params;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const allData = await getInstagramData(startDate, endDate);
      const data = allData.filter(row => row.accountUsername === username);
      
      if (data.length === 0) {
        return res.status(404).json({ error: "Account not found" });
      }
      
      const nameAr = data[0].accountNameAr;
      
      // Group by post
      const postsMap = new Map<string, { post: InstagramDataRow; comments: InstagramDataRow[] }>();
      data.forEach(row => {
        if (!postsMap.has(row.postShortcode)) {
          postsMap.set(row.postShortcode, { post: row, comments: [] });
        }
        postsMap.get(row.postShortcode)!.comments.push(row);
      });
      
      const posts = Array.from(postsMap.values()).map(({ post, comments }) => ({
        postShortcode: post.postShortcode,
        postUrl: post.postUrl,
        postCaption: post.postCaption,
        postTimestamp: post.postTimestamp,
        postType: post.postType,
        comments: comments.map(c => ({
          id: c.commentId,
          text: c.commentText,
          timestamp: c.commentTimestamp,
          likes: c.commentLikes,
          ownerUsername: c.commentOwnerUsername,
          ownerIsVerified: c.commentOwnerIsVerified,
          ownerProfilePic: c.commentOwnerProfilePic,
          isReply: c.commentIsReply,
        })),
      }));
      
      const stats = computeStats(
        data,
        (row) => row.commentTimestamp,
        (row) => row.commentLikes,
        (row) => row.commentText
      );
      
      // Cursor-based pagination for comments
      const pageSize = parseInt(req.query.pageSize as string) || 50;
      const cursor = req.query.cursor as string;
      
      const sortedData = [...data].sort((a, b) => 
        b.commentTimestamp.localeCompare(a.commentTimestamp)
      );
      
      let cursoredData = sortedData;
      if (cursor) {
        cursoredData = sortedData.filter(row => row.commentTimestamp < cursor);
      }
      
      const paginatedData = cursoredData.slice(0, pageSize);
      const hasMore = cursoredData.length > pageSize;
      const nextCursor = hasMore && paginatedData.length > 0 
        ? paginatedData[paginatedData.length - 1].commentTimestamp 
        : null;
      
      const comments = paginatedData.map(row => ({
        accountNameAr: row.accountNameAr,
        accountUsername: row.accountUsername,
        postUrl: row.postUrl,
        postShortcode: row.postShortcode,
        commentId: row.commentId,
        commentText: row.commentText,
        commentTimestamp: row.commentTimestamp,
        commentLikes: row.commentLikes,
        commentOwnerUsername: row.commentOwnerUsername,
        commentOwnerIsVerified: row.commentOwnerIsVerified,
        commentOwnerProfilePic: row.commentOwnerProfilePic,
      }));
      
      res.json({ 
        username, 
        nameAr, 
        posts, 
        stats, 
        comments,
        pagination: { total: data.length, pageSize, hasMore, nextCursor }
      });
    } catch (error) {
      console.error("Instagram account sheets data error:", error);
      res.status(500).json({ error: "Failed to fetch Instagram account data" });
    }
  });

  // YouTube data from Google Sheets
  app.get("/api/sheets/youtube", async (req: Request, res: Response) => {
    try {
      // Get date range from query params (defaults to last 30 days)
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      
      // Server-side date filtering - pass dates to query
      const filteredData = await getYouTubeData(startDate, endDate);
      
      // Build alias-to-canonical name mapping
      const aliasToCanonical = new Map<string, string>();
      THMANYAH_YOUTUBE_CHANNELS.forEach(ch => {
        ch.aliases.forEach(alias => aliasToCanonical.set(alias, ch.name));
      });
      
      // Group comments by canonical name (handles aliases)
      const channelCommentsByName = new Map<string, YouTubeDataRow[]>();
      THMANYAH_YOUTUBE_CHANNELS.forEach(ch => {
        channelCommentsByName.set(ch.name, []);
      });
      
      filteredData.forEach(row => {
        const canonicalName = aliasToCanonical.get(row.accountName);
        if (canonicalName) {
          channelCommentsByName.get(canonicalName)!.push(row);
        }
      });
      
      // Build channels array from predefined list only (no duplicates)
      const channels = THMANYAH_YOUTUBE_CHANNELS.map(({ channelId, name }) => {
        const comments = channelCommentsByName.get(name) || [];
        const videos = new Map<string, YouTubeDataRow>();
        comments.forEach(c => {
          if (!videos.has(c.videoId)) videos.set(c.videoId, c);
        });
        return {
          channelId,
          name,
          totalComments: comments.length,
          totalVideos: videos.size,
          totalLikes: comments.reduce((sum, c) => sum + c.commentLikeCount, 0),
        };
      });
      
      // Compute stats from all data
      const stats = computeStats(
        filteredData,
        (row) => row.commentPublishedAt,
        (row) => row.commentLikeCount,
        (row) => row.commentText
      );
      
      // Compute channelTimeline for multi-line charts
      const channelDateGroups: Record<string, Record<string, number>> = {};
      filteredData.forEach(row => {
        const date = row.commentPublishedAt?.split('T')[0];
        const canonicalName = aliasToCanonical.get(row.accountName);
        if (date && canonicalName) {
          if (!channelDateGroups[date]) channelDateGroups[date] = {};
          channelDateGroups[date][canonicalName] = (channelDateGroups[date][canonicalName] || 0) + 1;
        }
      });
      
      const channelNames = THMANYAH_YOUTUBE_CHANNELS.map(c => c.name);
      const channelTimeline = Object.entries(channelDateGroups)
        .map(([date, counts]) => {
          const entry: Record<string, any> = { date };
          channelNames.forEach(name => {
            entry[name] = counts[name] || 0;
          });
          return entry;
        })
        .sort((a, b) => (a.date as string).localeCompare(b.date as string));
      
      // Check if nolimit parameter is set (for Overview page)
      const nolimit = req.query.nolimit === 'true';
      
      const pageSize = parseInt(req.query.pageSize as string) || 50;
      const cursor = req.query.cursor as string;
      
      const sortedData = [...filteredData].sort((a, b) => 
        b.commentPublishedAt.localeCompare(a.commentPublishedAt)
      );
      
      let cursoredData = sortedData;
      if (cursor && !nolimit) {
        cursoredData = sortedData.filter(row => row.commentPublishedAt < cursor);
      }
      
      const paginatedData = nolimit ? cursoredData : cursoredData.slice(0, pageSize);
      const hasMore = nolimit ? false : cursoredData.length > pageSize;
      const nextCursor = hasMore && paginatedData.length > 0 
        ? paginatedData[paginatedData.length - 1].commentPublishedAt 
        : null;
      
      // Map data to comments format
      const comments = paginatedData.map(row => ({
        platform: row.platform,
        accountName: row.accountName,
        accountChannelId: row.accountChannelId,
        videoId: row.videoId,
        videoTitle: row.videoTitle,
        videoUrl: row.videoUrl,
        videoThumbnailUrl: row.videoThumbnailUrl,
        commentId: row.commentId,
        commentText: row.commentText,
        commentPublishedAt: row.commentPublishedAt,
        commentLikeCount: row.commentLikeCount,
        authorDisplayName: row.authorDisplayName,
        authorChannelUrl: row.authorChannelUrl,
        authorThumbnailUrl: (row as any).authorThumbnailUrl || '',
      }));
      
      res.json({ 
        channels, 
        stats: { ...stats, channelTimeline }, 
        comments,
        pagination: { total: filteredData.length, pageSize: nolimit ? filteredData.length : pageSize, hasMore, nextCursor }
      });
    } catch (error) {
      console.error("YouTube sheets data error:", error);
      res.status(500).json({ error: "Failed to fetch YouTube data" });
    }
  });

  // YouTube channel detail from Google Sheets
  app.get("/api/sheets/youtube/:channelId", async (req: Request, res: Response) => {
    try {
      const { channelId } = req.params;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      
      // Use channel-specific caching function (queries Supabase directly with channel filter)
      const data = await getYouTubeChannelData(channelId, startDate, endDate);
      
      if (data.length === 0) {
        // Return empty state instead of 404 (channel exists but no data in range)
        return res.json({ 
          channelId, 
          name: channelId, 
          videos: [], 
          stats: { totalComments: 0, totalLikes: 0, timeline: [] },
          comments: [],
          pagination: { total: 0, pageSize: 500, hasMore: false, nextCursor: null },
          mostLikedComment: null,
          mostCommentedVideo: null
        });
      }
      
      const name = data[0].accountName;
      
      // Group by video
      const videosMap = new Map<string, { video: YouTubeDataRow; comments: YouTubeDataRow[] }>();
      data.forEach(row => {
        if (!videosMap.has(row.videoId)) {
          videosMap.set(row.videoId, { video: row, comments: [] });
        }
        videosMap.get(row.videoId)!.comments.push(row);
      });
      
      const videos = Array.from(videosMap.values()).map(({ video, comments }) => ({
        videoId: video.videoId,
        videoTitle: video.videoTitle,
        videoDescription: video.videoDescription,
        videoPublishedAt: video.videoPublishedAt,
        videoUrl: video.videoUrl,
        videoThumbnailUrl: video.videoThumbnailUrl,
        videoLikeCount: video.videoLikeCount,
        videoViewCount: video.videoViewCount,
        videoCommentCount: comments.length,
        videoDuration: video.videoDuration,
        comments: comments.map(c => ({
          id: c.commentId,
          text: c.commentText,
          publishedAt: c.commentPublishedAt,
          likeCount: c.commentLikeCount,
          authorDisplayName: c.authorDisplayName,
          commentType: c.commentType,
        })),
      }));
      
      // Find most commented video
      const mostCommentedVideo = videos.reduce((max, v) => 
        v.comments.length > (max?.comments.length || 0) ? v : max
      , videos[0]);
      
      // Find most liked comment with its video info
      let mostLikedComment: any = null;
      let mostLikedCommentVideo: any = null;
      data.forEach(row => {
        if (!mostLikedComment || row.commentLikeCount > mostLikedComment.commentLikeCount) {
          mostLikedComment = row;
          mostLikedCommentVideo = {
            videoId: row.videoId,
            videoTitle: row.videoTitle,
            videoUrl: row.videoUrl,
            videoThumbnailUrl: row.videoThumbnailUrl,
          };
        }
      });
      
      const stats = computeStats(
        data,
        (row) => row.commentPublishedAt || row.pulledAtUtc,
        (row) => row.commentLikeCount,
        (row) => row.commentText
      );
      
      const pageSize = parseInt(req.query.pageSize as string) || 50;
      const cursor = req.query.cursor as string;
      
      const sortedData = [...data].sort((a, b) => 
        b.commentPublishedAt.localeCompare(a.commentPublishedAt)
      );
      
      let cursoredData = sortedData;
      if (cursor) {
        cursoredData = sortedData.filter(row => row.commentPublishedAt < cursor);
      }
      
      const paginatedData = cursoredData.slice(0, pageSize);
      const hasMore = cursoredData.length > pageSize;
      const nextCursor = hasMore && paginatedData.length > 0 
        ? paginatedData[paginatedData.length - 1].commentPublishedAt 
        : null;
      
      const comments = paginatedData.map(row => ({
        platform: row.platform,
        accountName: row.accountName,
        accountChannelId: row.accountChannelId,
        videoId: row.videoId,
        videoTitle: row.videoTitle,
        videoUrl: row.videoUrl,
        videoThumbnailUrl: row.videoThumbnailUrl,
        commentId: row.commentId,
        commentText: row.commentText,
        commentPublishedAt: row.commentPublishedAt,
        commentLikeCount: row.commentLikeCount,
        authorDisplayName: row.authorDisplayName,
        authorChannelUrl: row.authorChannelUrl,
        authorThumbnailUrl: (row as any).authorThumbnailUrl || '',
      }));
      
      res.json({ 
        channelId, 
        name, 
        videos, 
        stats, 
        comments,
        pagination: { total: data.length, pageSize, hasMore, nextCursor },
        mostLikedComment: mostLikedComment ? {
          commentId: mostLikedComment.commentId,
          commentText: mostLikedComment.commentText,
          commentLikeCount: mostLikedComment.commentLikeCount,
          authorDisplayName: mostLikedComment.authorDisplayName,
          commentPublishedAt: mostLikedComment.commentPublishedAt,
          video: mostLikedCommentVideo
        } : null,
        mostCommentedVideo: mostCommentedVideo ? {
          videoId: mostCommentedVideo.videoId,
          videoTitle: mostCommentedVideo.videoTitle,
          videoUrl: mostCommentedVideo.videoUrl,
          videoThumbnailUrl: mostCommentedVideo.videoThumbnailUrl,
          commentCount: mostCommentedVideo.comments.length
        } : null
      });
    } catch (error) {
      console.error("YouTube channel sheets data error:", error);
      res.status(500).json({ error: "Failed to fetch YouTube channel data" });
    }
  });

  return httpServer;
}

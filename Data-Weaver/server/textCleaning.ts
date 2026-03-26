/**
 * Text cleaning and link extraction utilities for social media content
 */

/**
 * Clean text by removing URLs, RT/QT prefixes, and normalizing whitespace
 */
export function cleanText(text: string | null | undefined): string {
  if (!text) return "";
  
  let cleaned = text;
  
  // Remove all URLs (http, https, t.co, x.com, twitter.com, etc.)
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/gi, "");
  cleaned = cleaned.replace(/t\.co\/[^\s]+/gi, "");
  cleaned = cleaned.replace(/x\.com\/[^\s]+/gi, "");
  cleaned = cleaned.replace(/twitter\.com\/[^\s]+/gi, "");
  
  // Remove RT prefixes: "RT @username:"
  cleaned = cleaned.replace(/^RT\s+@\w+:\s*/gi, "");
  
  // Remove QT prefixes: "QT @username:"
  cleaned = cleaned.replace(/^QT\s+@\w+:\s*/gi, "");
  
  // Remove Reply prefixes: "Replying to @username" or "@username @username2"
  cleaned = cleaned.replace(/^Replying to\s+(@\w+\s*)+/gi, "");
  
  // Remove leading mentions (common in replies)
  cleaned = cleaned.replace(/^(@\w+\s+)+/g, "");
  
  // Normalize whitespace (multiple spaces to single, trim)
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  
  return cleaned;
}

/**
 * Get the best source text from a mention record
 * Priority: Hit Sentence > Opening Text > Title
 */
export function getSourceText(hitSentence: string | null, openingText: string | null, title: string | null): string {
  if (hitSentence && hitSentence.trim()) return hitSentence;
  if (openingText && openingText.trim()) return openingText;
  if (title && title.trim()) return title;
  return "";
}

/**
 * Detect record type from Information Type field
 */
export function detectRecordType(informationType: string | null | undefined): "post" | "reply" | "quote" {
  if (!informationType) return "post";
  
  const lower = informationType.toLowerCase();
  
  if (lower.includes("reply")) return "reply";
  if (lower.includes("quote")) return "quote";
  
  return "post";
}

/**
 * Extract tweet status URLs from a links string
 * Returns only valid tweet status URLs, ignoring media links
 */
export function extractTweetUrls(links: string | null | undefined): string[] {
  if (!links) return [];
  
  // Match x.com/*/status/* or twitter.com/*/status(es)/*
  const urlPattern = /https?:\/\/(?:x\.com|twitter\.com)\/[^\/]+\/status(?:es)?\/\d+/gi;
  const matches = links.match(urlPattern) || [];
  
  // Filter out media links
  return matches.filter(url => {
    const lower = url.toLowerCase();
    return !lower.includes("/photo/") && 
           !lower.includes("/video/") &&
           !lower.includes("/media/");
  });
}

/**
 * Get the original tweet URL for replies and quotes
 * Returns the first tweet status URL that is different from the current URL
 */
export function getOriginalUrl(
  recordType: "post" | "reply" | "quote",
  currentUrl: string | null | undefined,
  linksRaw: string | null | undefined
): string | null {
  if (recordType === "post") return null;
  
  const tweetUrls = extractTweetUrls(linksRaw);
  
  // Find the first URL that is different from the current URL
  for (const url of tweetUrls) {
    // Normalize URLs for comparison (remove trailing slashes, etc.)
    const normalizedUrl = url.replace(/\/$/, "").toLowerCase();
    const normalizedCurrent = (currentUrl || "").replace(/\/$/, "").toLowerCase();
    
    if (normalizedUrl !== normalizedCurrent) {
      return url;
    }
  }
  
  return null;
}

/**
 * Process a mention record and return cleaned text with context info
 */
export function processMentionText(mention: {
  hitSentence?: string | null;
  openingText?: string | null;
  title?: string | null;
  informationType?: string | null;
  url?: string | null;
  linksRaw?: string | null;
}): {
  cleanText: string;
  recordType: "post" | "reply" | "quote";
  originalUrl: string | null;
  hasOriginalContext: boolean;
} {
  const sourceText = getSourceText(
    mention.hitSentence || null,
    mention.openingText || null,
    mention.title || null
  );
  
  const cleanedText = cleanText(sourceText);
  const recordType = detectRecordType(mention.informationType);
  const originalUrl = getOriginalUrl(recordType, mention.url, mention.linksRaw);
  
  return {
    cleanText: cleanedText,
    recordType,
    originalUrl,
    hasOriginalContext: !!originalUrl,
  };
}

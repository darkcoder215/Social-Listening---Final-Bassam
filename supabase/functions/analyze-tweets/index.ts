import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Logging utility
const log = {
  info: (step: string, message: string, data?: any) => {
    console.log(`[${step}] ℹ️ ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (step: string, message: string, error?: any) => {
    console.error(`[${step}] ❌ ${message}`, error ? JSON.stringify(error, null, 2) : '');
  },
  success: (step: string, message: string, data?: any) => {
    console.log(`[${step}] ✅ ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  warn: (step: string, message: string, data?: any) => {
    console.warn(`[${step}] ⚠️ ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // CRITICAL: Edge functions have a max timeout. For large batches, we need to track this
  const MAX_EXECUTION_TIME = 480000; // 8 minutes (edge function limit is ~9 minutes)
  const timeoutWarningAt = MAX_EXECUTION_TIME - 30000; // Warn 30s before timeout
  
  try {
    log.info('REQUEST-START', `New request [${requestId}]`, {
      maxExecutionTime: `${MAX_EXECUTION_TIME / 1000}s`,
      warningThreshold: `${timeoutWarningAt / 1000}s`
    });
    // STEP 1: Validate Request
    log.info('STEP-1-VALIDATE', `Starting request validation [${requestId}]`);
    
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      log.error('STEP-1-VALIDATE', 'Invalid JSON in request body', { error: e instanceof Error ? e.message : String(e) });
      throw new Error('Invalid request format: Expected JSON body');
    }

    const {
      searchTerms,
      maxItems,
      sort,
      twitterHandles,
      start,
      end,
      onlyImage,
      onlyVideo,
      onlyQuote,
      onlyVerifiedUsers,
      onlyTwitterBlue,
      includeSearchTerms,
      customMapFunction,
      model: requestedModel,
      customMetricsSchema,
      customMetricsPrompt,
    } = requestBody;
    log.info('STEP-1-VALIDATE', 'Request parameters received', { 
      searchTerms, 
      maxItems, 
      sort, 
      twitterHandles,
      start,
      end,
      filters: { onlyImage, onlyVideo, onlyQuote, onlyVerifiedUsers, onlyTwitterBlue },
      requestId 
    });

    // Validate search terms
    if (!searchTerms) {
      log.error('STEP-1-VALIDATE', 'Missing searchTerms parameter');
      throw new Error('searchTerms parameter is required');
    }

    const termsArray = Array.isArray(searchTerms) ? searchTerms : [searchTerms];
    if (termsArray.length === 0) {
      log.error('STEP-1-VALIDATE', 'Empty searchTerms array');
      throw new Error('searchTerms cannot be empty');
    }

    if (termsArray.some((term: any) => typeof term !== 'string' || term.trim().length === 0)) {
      log.error('STEP-1-VALIDATE', 'Invalid search term format', { searchTerms: termsArray });
      throw new Error('All search terms must be non-empty strings');
    }

    // Validate maxItems
    const validatedMaxItems = maxItems || 20;
    if (typeof validatedMaxItems !== 'number' || validatedMaxItems < 1) {
      log.error('STEP-1-VALIDATE', 'Invalid maxItems value', { maxItems: validatedMaxItems });
      throw new Error('maxItems must be a positive number');
    }

    if (validatedMaxItems > 5000) {
      log.warn('STEP-1-VALIDATE', 'maxItems exceeds recommended limit', { maxItems: validatedMaxItems });
      throw new Error('maxItems cannot exceed 5000 tweets');
    }

    // Validate twitterHandles
    const validatedHandles = twitterHandles && Array.isArray(twitterHandles) ? twitterHandles : [];
    if (validatedHandles.some((handle: any) => typeof handle !== 'string' || handle.trim().length === 0)) {
      log.error('STEP-1-VALIDATE', 'Invalid twitter handle format', { twitterHandles: validatedHandles });
      throw new Error('All twitter handles must be non-empty strings');
    }

    // Validate dates
    const validatedStart = start || '2025-08-01';
    const validatedEnd = end || '2025-11-02';

    // Validate boolean filters
    const validatedOnlyImage = typeof onlyImage === 'boolean' ? onlyImage : false;
    const validatedOnlyVideo = typeof onlyVideo === 'boolean' ? onlyVideo : false;
    const validatedOnlyQuote = typeof onlyQuote === 'boolean' ? onlyQuote : false;
    const validatedOnlyVerifiedUsers = typeof onlyVerifiedUsers === 'boolean' ? onlyVerifiedUsers : false;
    const validatedOnlyTwitterBlue = typeof onlyTwitterBlue === 'boolean' ? onlyTwitterBlue : false;
    const validatedIncludeSearchTerms = typeof includeSearchTerms === 'boolean' ? includeSearchTerms : false;
    
    const validatedCustomMapFunction = customMapFunction || "(object) => { return {...object} }";

    // Validate sort
    const validSorts = ['Latest', 'Top', 'Latest with Replies'];
    const validatedSort = sort || 'Latest';
    if (!validSorts.includes(validatedSort)) {
      log.error('STEP-1-VALIDATE', 'Invalid sort parameter', { sort: validatedSort });
      throw new Error(`sort must be one of: ${validSorts.join(', ')}`);
    }

    // Validate API keys — accept from request body as fallback to env vars
    const apifyToken = Deno.env.get('APIFY_API_TOKEN') || requestBody.apifyToken;
    const openrouterKey = Deno.env.get('OPENROUTER_API_KEY') || requestBody.openrouterKey;
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!apifyToken) {
      log.error('STEP-1-VALIDATE', 'APIFY_API_TOKEN not configured');
      throw new Error('مفتاح Apify غير مُعدّ. أضفه من صفحة الإعدادات → مفاتيح API');
    }
    if (!openrouterKey) {
      log.error('STEP-1-VALIDATE', 'OPENROUTER_API_KEY not configured');
      throw new Error('مفتاح OpenRouter غير مُعدّ. أضفه من صفحة الإعدادات → مفاتيح API');
    }

    log.success('STEP-1-VALIDATE', `All validations passed [${requestId}]`, {
      searchTermsCount: termsArray.length,
      twitterHandlesCount: validatedHandles.length,
      maxItems: validatedMaxItems,
      sort: validatedSort,
      dateRange: `${validatedStart} to ${validatedEnd}`,
      filters: {
        onlyImage: validatedOnlyImage,
        onlyVideo: validatedOnlyVideo,
        onlyQuote: validatedOnlyQuote,
        onlyVerifiedUsers: validatedOnlyVerifiedUsers,
        onlyTwitterBlue: validatedOnlyTwitterBlue
      }
    });

    // STEP 2: Fetch tweets from Apify with retry logic
    log.info('STEP-2-APIFY', `Starting Apify API request [${requestId}]`);
    const apifyStartTime = Date.now();
    
    const apifyPayload = {
      customMapFunction: validatedCustomMapFunction,
      end: validatedEnd,
      includeSearchTerms: validatedIncludeSearchTerms,
      maxItems: validatedMaxItems,
      onlyImage: validatedOnlyImage,
      onlyQuote: validatedOnlyQuote,
      onlyTwitterBlue: validatedOnlyTwitterBlue,
      onlyVerifiedUsers: validatedOnlyVerifiedUsers,
      onlyVideo: validatedOnlyVideo,
      searchTerms: termsArray,
      sort: validatedSort,
      start: validatedStart,
      twitterHandles: validatedHandles
    };
    log.info('STEP-2-APIFY', 'Apify request payload', { 
      searchTermsCount: termsArray.length,
      twitterHandlesCount: validatedHandles.length,
      maxItems: validatedMaxItems,
      dateRange: `${validatedStart} to ${validatedEnd}`,
      requestId 
    });

    let apifyResponse;
    let tweets;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000; // 2 seconds

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        log.info('STEP-2-APIFY', `Attempt ${attempt}/${MAX_RETRIES} to fetch tweets`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

        apifyResponse = await fetch(
          `https://api.apify.com/v2/acts/apidojo~twitter-scraper-lite/run-sync-get-dataset-items?token=${apifyToken}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(apifyPayload),
            signal: controller.signal
          }
        );

        clearTimeout(timeoutId);

        const apifyDuration = Date.now() - apifyStartTime;
        log.info('STEP-2-APIFY', `Apify API responded in ${apifyDuration}ms with status ${apifyResponse.status}`);

        if (apifyResponse.status === 429) {
          log.warn('STEP-2-APIFY', `Rate limited (429) on attempt ${attempt}`);
          if (attempt < MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
            continue;
          }
          throw new Error('Rate limit exceeded. Please try again later.');
        }

        if (!apifyResponse.ok) {
          const errorText = await apifyResponse.text();
          log.error('STEP-2-APIFY', 'Apify request failed', { 
            status: apifyResponse.status, 
            error: errorText.substring(0, 500),
            attempt 
          });
          
          if (attempt < MAX_RETRIES && apifyResponse.status >= 500) {
            log.info('STEP-2-APIFY', `Retrying after server error (${apifyResponse.status})`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            continue;
          }
          
          throw new Error(`Data collection failed: ${apifyResponse.status}`);
        }

        tweets = await apifyResponse.json();
        
        if (!Array.isArray(tweets)) {
          log.error('STEP-2-APIFY', 'Invalid response format: expected array', { responseType: typeof tweets });
          throw new Error('Invalid response format from data collection service');
        }

        break; // Success, exit retry loop
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          log.error('STEP-2-APIFY', `Request timeout on attempt ${attempt}`);
          if (attempt < MAX_RETRIES) {
            continue;
          }
          throw new Error('Request timeout: Data collection took too long');
        }
        
        if (attempt === MAX_RETRIES) {
          throw error;
        }
        
        log.warn('STEP-2-APIFY', `Attempt ${attempt} failed, retrying...`, { 
          error: error instanceof Error ? error.message : String(error) 
        });
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }

    const apifyDuration = Date.now() - apifyStartTime;
    
    // COMPREHENSIVE LOGGING: Log first tweet's complete structure
    if (tweets.length > 0) {
      log.info('STEP-2-APIFY', '📋 COMPLETE TWEET STRUCTURE FROM APIFY:', {
        fullTweetObject: tweets[0],
        availableFields: Object.keys(tweets[0]),
        sampleValues: Object.entries(tweets[0]).reduce((acc: any, [key, value]) => {
          acc[key] = typeof value === 'string' && value.length > 100 
            ? value.substring(0, 100) + '...' 
            : value;
          return acc;
        }, {})
      });
    }
    
    log.success('STEP-2-APIFY', `Successfully fetched ${tweets.length} tweets in ${apifyDuration}ms [${requestId}]`, {
      totalTweets: tweets.length,
      payloadSize: `${(JSON.stringify(tweets).length / 1024).toFixed(2)} KB`,
      sampleTweet: tweets[0] ? {
        text: tweets[0].text?.substring(0, 100),
        likes: tweets[0].likeCount,
        retweets: tweets[0].retweetCount,
        hasUrl: !!tweets[0].url || !!tweets[0].twitterUrl
      } : null
    });

    // Check if Apify returned "no results" placeholders
    if (!tweets || tweets.length === 0 || (tweets.length > 0 && tweets[0].noResults === true)) {
      const reason = tweets.length > 0 && tweets[0].noResults === true 
        ? 'No tweets matched your search criteria'
        : 'No tweets found for the given search terms';
      
      log.warn('STEP-2-APIFY', `${reason} [${requestId}]`, { 
        searchTerms: termsArray,
        twitterHandles: validatedHandles,
        dateRange: `${validatedStart} to ${validatedEnd}`,
        hasNoResultsFlag: tweets.length > 0 && tweets[0].noResults === true
      });
      
      return new Response(
        JSON.stringify({ 
          error: reason,
          searchTerms: termsArray,
          twitterHandles: validatedHandles,
          dateRange: { start: validatedStart, end: validatedEnd },
          totalTweets: 0,
          sentiments: {
            positive: 0,
            negative: 0,
            neutral: 0,
            percentages: { positive: '0', negative: '0', neutral: '0' }
          },
          requestId
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // STEP 3: Prepare tweets for analysis
    log.info('STEP-3-PREPARE', `Preparing tweets for AI analysis [${requestId}]`);
    const MAX_TWEETS = 1000;
    
    const tweetsToAnalyze = tweets
      .slice(0, MAX_TWEETS)
      .map((t: any, idx: number) => {
        // Validate tweet structure
        if (!t || typeof t !== 'object') {
          log.warn('STEP-3-PREPARE', `Invalid tweet object at index ${idx}`, { tweet: t });
          return null;
        }

        return {
          index: idx,
          text: (t.text || '').toString().trim(),
          likes: Math.max(0, parseInt(t.likeCount) || 0),
          retweets: Math.max(0, parseInt(t.retweetCount) || 0),
          replies: Math.max(0, parseInt(t.replyCount) || 0),
          quotes: Math.max(0, parseInt(t.quoteCount) || 0),
          bookmarks: Math.max(0, parseInt(t.bookmarkCount) || 0),
          url: t.url || t.twitterUrl || '',
          author: t.author?.userName || 'unknown',
          authorName: t.author?.name || t.author?.userName || 'unknown',
          authorVerified: t.author?.isVerified || false,
          authorBlueVerified: t.author?.isBlueVerified || false,
          createdAt: t.createdAt || '',
          isRetweet: t.isRetweet || false,
          isQuote: t.isQuote || false,
          // Track which search term/handle matched this tweet
          matchedSearchTerms: t.matchedSearchTerms || [],
          matchedHandles: t.matchedHandles || []
        };
      })
      .filter((t: any): t is NonNullable<typeof t> => {
        if (!t) return false;
        if (!t.text || t.text.length === 0) {
          log.warn('STEP-3-PREPARE', `Filtered out tweet with empty text at index ${t?.index}`);
          return false;
        }
        if (t.text.length > 5000) {
          log.warn('STEP-3-PREPARE', `Filtered out tweet with excessive length at index ${t.index}`, { 
            length: t.text.length 
          });
          return false;
        }
        return true;
      });

    if (tweetsToAnalyze.length === 0) {
      log.error('STEP-3-PREPARE', 'No valid tweets to analyze after filtering');
      throw new Error('No valid tweets found after preprocessing');
    }

    const filteredCount = tweets.length - tweetsToAnalyze.length;
    log.info('STEP-3-PREPARE', `Prepared ${tweetsToAnalyze.length} tweets for analysis (max ${MAX_TWEETS}, filtered ${filteredCount})`, {
      originalCount: tweets.length,
      validCount: tweetsToAnalyze.length,
      filteredCount,
      avgTextLength: Math.round(tweetsToAnalyze.reduce((sum: number, t: any) => sum + t.text.length, 0) / tweetsToAnalyze.length)
    });

    // Split into batches of 200 (Gemini 2.5 Pro has 1M token context window)
    const BATCH_SIZE = 200;
    const batches = [];
    for (let i = 0; i < tweetsToAnalyze.length; i += BATCH_SIZE) {
      batches.push(tweetsToAnalyze.slice(i, i + BATCH_SIZE));
    }
    
    const totalTokensEstimate = tweetsToAnalyze.reduce((sum: number, t: any) => sum + Math.ceil(t.text.length / 4), 0);
    log.info('STEP-3-PREPARE', `Split into ${batches.length} batches of up to ${BATCH_SIZE} tweets`, {
      batchCount: batches.length,
      estimatedInputTokens: totalTokensEstimate,
      batchSizes: batches.map(b => b.length)
    });

    // STEP 4: Analyze sentiment with OpenRouter (Batch Processing)
    const analysisModel = requestedModel || 'google/gemini-2.5-pro';
    log.info('STEP-4-OPENROUTER', `Starting batch OpenRouter sentiment analysis [${requestId}]`, {
      totalBatches: batches.length,
      model: analysisModel,
      estimatedDuration: `${Math.ceil(batches.length * 3)} seconds`
    });
    const openrouterStartTime = Date.now();

    // Define the structured output schema for OpenRouter
    // Merge custom metrics into per-tweet schema if provided by client
    const defaultTweetProperties: Record<string, any> = {
      index: { type: "number", description: "رقم التغريدة في المجموعة" },
      sentiment: { type: "string", enum: ["positive", "negative", "neutral"], description: "تصنيف المشاعر" },
      confidence: { type: "number", description: "مستوى الثقة من 0 إلى 1" },
      reason: { type: "string", description: "سبب التصنيف بالعربية" },
      keywords: { type: "array", items: { type: "string" }, description: "الكلمات المفتاحية" },
      emotion: { type: "string", enum: ["فرح", "غضب", "حزن", "مفاجأة", "محايد", "حماس", "إحباط", "قلق"], description: "العاطفة السائدة بالعربية" },
    };
    const defaultTweetRequired = ["index", "sentiment", "confidence", "reason"];

    // Apply custom metrics schema from client settings
    let tweetProperties = { ...defaultTweetProperties };
    let tweetRequired = [...defaultTweetRequired];
    if (customMetricsSchema && customMetricsSchema.properties) {
      tweetProperties = { ...tweetProperties, ...customMetricsSchema.properties };
      if (Array.isArray(customMetricsSchema.required)) {
        tweetRequired = [...new Set([...tweetRequired, ...customMetricsSchema.required])];
      }
      log.info('STEP-4-OPENROUTER', 'Applied custom metrics schema', {
        customFields: Object.keys(customMetricsSchema.properties),
      });
    }

    const responseFormat = {
      type: "json_schema",
      json_schema: {
        name: "tweet_sentiment_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            tweets: {
              type: "array",
              description: "قائمة التغريدات المُحللة",
              items: {
                type: "object",
                properties: tweetProperties,
                required: tweetRequired,
                additionalProperties: false
              }
            },
            overall_insights: { 
              type: "string",
              description: "الرؤى العامة حول التغريدات"
            },
            key_themes: { 
              type: "array", 
              items: { type: "string" },
              description: "المواضيع الرئيسية"
            },
            main_issues: {
              type: "array",
              items: { type: "string" },
              description: "أهم المشاكل والشكاوى من التغريدات السلبية كنقاط محددة"
            },
            recommendations: { 
              type: "array",
              items: { type: "string" },
              description: "التوصيات بناءً على التحليل كقائمة نقاط"
            },
            sentiment_summary: {
              type: "object",
              properties: {
                dominant_sentiment: { 
                  type: "string", 
                  enum: ["positive", "negative", "neutral"],
                  description: "المشاعر السائدة"
                },
                trend: { 
                  type: "string", 
                  enum: ["improving", "declining", "stable"],
                  description: "الاتجاه العام"
                },
                engagement_correlation: { 
                  type: "string",
                  description: "العلاقة بين المشاعر والتفاعل"
                }
              },
              required: ["dominant_sentiment", "trend", "engagement_correlation"],
              additionalProperties: false
            }
          },
          required: ["tweets", "overall_insights", "recommendations"],
          additionalProperties: false
        }
      }
    };

    const customMetricsSection = customMetricsPrompt || '';
    const systemPrompt = `أنت محلل خبير للمشاعر في وسائل التواصل الاجتماعي باللغة العربية.
مهمتك تحليل التغريدات بدقة وتقديم رؤى عميقة.

معايير التحليل:
1. إيجابي: التغريدات التي تعبر عن رضا، إعجاب، دعم، أو مشاعر إيجابية
2. سلبي: التغريدات التي تحتوي على شكاوى، انتقادات، غضب، أو استياء
3. محايد: التغريدات الإخبارية أو التي لا تحمل مشاعر واضحة
${customMetricsSection}
تعليمات مهمة:
- اكتب جميع العواطف بالعربية (مثل: فرح، غضب، حزن، مفاجأة، محايد، حماس، إحباط، قلق)
- اكتب التوصيات كقائمة من النقاط المنفصلة (array) وليس فقرة واحدة
- تأكد من استخراج أهم المشاكل والشكاوى من التغريدات السلبية في قائمة واضحة ومحددة`;

    // Process all batches with timeout protection
    const allAnalysisResults = [];
    let totalOpenaiDuration = 0;
    const batchErrors = [];

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      // Check if we're approaching timeout
      const elapsed = Date.now() - startTime;
      if (elapsed > timeoutWarningAt) {
        log.warn('STEP-4-OPENAI', `Approaching timeout limit (${elapsed}ms elapsed). Processing ${batchIndex}/${batches.length} batches completed.`);
        
        // If we have some results, return partial analysis
        if (allAnalysisResults.length > 0) {
          log.warn('STEP-4-OPENAI', `Returning partial results to avoid timeout. Processed ${batchIndex}/${batches.length} batches.`);
          break; // Exit batch loop and return what we have
        }
      }
      
      if (elapsed > MAX_EXECUTION_TIME) {
        log.error('STEP-4-OPENAI', `Maximum execution time exceeded at batch ${batchIndex + 1}/${batches.length}`);
        throw new Error(`Analysis timeout: Processing took too long. Try reducing the number of tweets (current: ${validatedMaxItems})`);
      }
      
      const batch = batches[batchIndex];
      log.info('STEP-4-OPENROUTER', `Processing batch ${batchIndex + 1}/${batches.length} with ${batch.length} tweets [${requestId}]`, {
        elapsed: `${(elapsed / 1000).toFixed(1)}s`,
        remaining: `~${((MAX_EXECUTION_TIME - elapsed) / 1000).toFixed(0)}s`
      });

      const userPrompt = `حلل المشاعر في التغريدات التالية بدقة:

${batch.map((t: any) => 
  `[${t.index}] "${t.text}" (❤️ ${t.likes} | 🔁 ${t.retweets})`
).join('\n\n')}`;

      const openrouterPayload = {
        model: analysisModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: responseFormat
      };

      const MAX_OPENROUTER_RETRIES = 2;
      let batchSuccess = false;

      for (let retryAttempt = 1; retryAttempt <= MAX_OPENROUTER_RETRIES; retryAttempt++) {
        try {
          const batchStartTime = Date.now();
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
          
          log.info('STEP-4-OPENROUTER', `🚀 Sending request to OpenRouter for batch ${batchIndex + 1}`, {
            model: analysisModel,
            tweetsCount: batch.length,
            payloadSize: JSON.stringify(openrouterPayload).length
          });
          
          const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openrouterKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(openrouterPayload),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          const batchDuration = Date.now() - batchStartTime;
          totalOpenaiDuration += batchDuration;
          
          log.info('STEP-4-OPENROUTER', `📡 Batch ${batchIndex + 1} responded in ${batchDuration}ms with status ${openrouterResponse.status}`);

          if (openrouterResponse.status === 429) {
            log.warn('STEP-4-OPENROUTER', `⚠️ Rate limited on batch ${batchIndex + 1}, attempt ${retryAttempt}`);
            if (retryAttempt < MAX_OPENROUTER_RETRIES) {
              await new Promise(resolve => setTimeout(resolve, 5000 * retryAttempt));
              continue;
            }
            throw new Error('OpenRouter rate limit exceeded');
          }

          if (!openrouterResponse.ok) {
            const errorText = await openrouterResponse.text();
            log.error('STEP-4-OPENROUTER', `❌ Batch ${batchIndex + 1} failed`, { 
              status: openrouterResponse.status, 
              error: errorText.substring(0, 500),
              attempt: retryAttempt
            });
            
            if (retryAttempt < MAX_OPENROUTER_RETRIES && openrouterResponse.status >= 500) {
              await new Promise(resolve => setTimeout(resolve, 3000));
              continue;
            }
            
            throw new Error(`Analysis service failed on batch ${batchIndex + 1}: ${openrouterResponse.status}`);
          }

          const openrouterData = await openrouterResponse.json();
          
          // 🔍 COMPREHENSIVE LOGGING OF RESPONSE
          log.info('STEP-4-OPENROUTER', `📋 FULL OPENROUTER RESPONSE FOR BATCH ${batchIndex + 1}`, {
            fullResponse: JSON.stringify(openrouterData, null, 2),
            responseKeys: Object.keys(openrouterData),
            choicesCount: openrouterData.choices?.length || 0,
            firstChoice: openrouterData.choices?.[0] ? JSON.stringify(openrouterData.choices[0], null, 2) : 'N/A',
            messageContent: openrouterData.choices?.[0]?.message?.content || 'N/A',
            messageRole: openrouterData.choices?.[0]?.message?.role || 'N/A'
          });
          
          // Log token usage if available
          if (openrouterData.usage) {
            log.info('STEP-4-OPENROUTER', `💰 Batch ${batchIndex + 1} token usage`, {
              promptTokens: openrouterData.usage.prompt_tokens,
              completionTokens: openrouterData.usage.completion_tokens,
              totalTokens: openrouterData.usage.total_tokens
            });
          }
          
          // STEP 5: Parse batch response with structured outputs
          try {
            const message = openrouterData.choices?.[0]?.message;
            
            if (!message) {
              throw new Error('No message in response');
            }
            
            log.info('STEP-5-PARSE', `🔍 Parsing message content for batch ${batchIndex + 1}`, {
              hasContent: !!message.content,
              contentType: typeof message.content,
              contentLength: message.content?.length || 0,
              contentPreview: message.content?.substring(0, 200) || 'N/A'
            });
            
            // Parse the JSON content from structured outputs
            const batchAnalysis = JSON.parse(message.content);
            
            log.info('STEP-5-PARSE', `✅ Parsed JSON structure for batch ${batchIndex + 1}`, {
              parsedKeys: Object.keys(batchAnalysis),
              hasTweets: !!batchAnalysis.tweets,
              tweetsCount: batchAnalysis.tweets?.length || 0,
              hasInsights: !!batchAnalysis.overall_insights,
              hasThemes: !!batchAnalysis.key_themes,
              hasRecommendations: !!batchAnalysis.recommendations,
              hasSummary: !!batchAnalysis.sentiment_summary,
              fullAnalysis: JSON.stringify(batchAnalysis, null, 2)
            });
            
            // Validate batch analysis structure
            if (!batchAnalysis.tweets || !Array.isArray(batchAnalysis.tweets)) {
              throw new Error('Invalid analysis format: missing tweets array');
            }
            
            if (batchAnalysis.tweets.length !== batch.length) {
              log.warn('STEP-5-PARSE', `⚠️ Batch ${batchIndex + 1} analyzed ${batchAnalysis.tweets.length} tweets, expected ${batch.length}`);
            }
            
            allAnalysisResults.push(batchAnalysis);
            log.success('STEP-4-OPENROUTER', `✨ Batch ${batchIndex + 1} analyzed ${batchAnalysis.tweets?.length || 0} tweets successfully`);
            batchSuccess = true;
            break; // Success, exit retry loop
            
          } catch (parseError) {
            log.error('STEP-5-PARSE', `❌ Failed to parse batch ${batchIndex + 1}`, {
              error: parseError instanceof Error ? parseError.message : String(parseError),
              stack: parseError instanceof Error ? parseError.stack : 'N/A',
              rawContent: openrouterData.choices?.[0]?.message?.content || 'N/A',
              attempt: retryAttempt
            });
            
            if (retryAttempt < MAX_OPENROUTER_RETRIES) {
              continue;
            }
            
            throw parseError;
          }
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            log.error('STEP-4-OPENROUTER', `⏱️ Batch ${batchIndex + 1} timeout on attempt ${retryAttempt}`);
            if (retryAttempt < MAX_OPENROUTER_RETRIES) {
              continue;
            }
          }
          
          if (retryAttempt === MAX_OPENROUTER_RETRIES) {
            const errorMsg = `Batch ${batchIndex + 1} failed after ${MAX_OPENROUTER_RETRIES} attempts`;
            log.error('STEP-4-OPENROUTER', errorMsg, {
              error: error instanceof Error ? error.message : String(error)
            });
            batchErrors.push({ batchIndex: batchIndex + 1, error: errorMsg });
            
            // Continue with other batches instead of failing completely
            break;
          }
        }
      }

      if (!batchSuccess) {
        log.warn('STEP-4-OPENROUTER', `Skipping failed batch ${batchIndex + 1}, continuing with remaining batches`);
      }
    }

    // Check if we got any successful results
    if (allAnalysisResults.length === 0) {
      log.error('STEP-4-OPENROUTER', 'All batches failed to process');
      throw new Error('Analysis failed: Could not process any tweets. Please try with fewer tweets or check your API credentials.');
    }

    if (batchErrors.length > 0) {
      log.warn('STEP-4-OPENROUTER', `Completed with ${batchErrors.length} failed batches out of ${batches.length}`, {
        failedBatches: batchErrors,
        isPartial: allAnalysisResults.length < batches.length
      });
    }
    
    if (allAnalysisResults.length < batches.length) {
      log.warn('STEP-4-OPENROUTER', `Returning partial results: ${allAnalysisResults.length}/${batches.length} batches completed to avoid timeout`);
    }

    const openrouterDuration = totalOpenaiDuration;
    log.success('STEP-4-OPENROUTER', `All batches completed in ${openrouterDuration}ms [${requestId}]`, {
      successfulBatches: allAnalysisResults.length,
      totalBatches: batches.length,
      failedBatches: batchErrors.length,
      avgBatchDuration: Math.round(openrouterDuration / batches.length)
    });

    // STEP 5: Aggregate all batch results
    log.info('STEP-5-AGGREGATE', `Aggregating results from ${allAnalysisResults.length} successful batches [${requestId}]`);
    const allTweets = allAnalysisResults.flatMap(result => result.tweets || []);
    const allInsights = allAnalysisResults.map(r => r.overall_insights).filter(Boolean);
    const allRecommendations = allAnalysisResults.flatMap(r => r.recommendations || []).filter(Boolean);
    const allThemes = allAnalysisResults.flatMap(r => r.key_themes || []);
    const allMainIssues = allAnalysisResults.flatMap(r => r.main_issues || []);
    const lastSummary = allAnalysisResults[allAnalysisResults.length - 1]?.sentiment_summary;

    const analysis = {
      tweets: allTweets,
      overall_insights: allInsights.join('\n\n'),
      recommendations: allRecommendations, // Keep as array
      key_themes: [...new Set(allThemes)],
      main_issues: [...new Set(allMainIssues)],
      sentiment_summary: lastSummary
    };

    log.success('STEP-5-AGGREGATE', `Aggregated ${allTweets.length} tweet analyses [${requestId}]`, {
      analyzedTweets: allTweets.length,
      insights: allInsights.length,
      recommendations: allRecommendations.length,
      themes: allThemes.length
    });

    // STEP 6: Process analysis results
    log.info('STEP-6-PROCESS', `Processing analysis results [${requestId}]`);
    const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
    const emotionCounts: Record<string, number> = {};
    const allKeywords: string[] = [];
    
    analysis.tweets?.forEach((t: any) => {
      // Validate sentiment value
      const validSentiments = ['positive', 'negative', 'neutral'];
      if (!validSentiments.includes(t.sentiment)) {
        log.warn('STEP-6-PROCESS', `Invalid sentiment value: ${t.sentiment}, defaulting to neutral`);
        t.sentiment = 'neutral';
      }
      
      if (t.sentiment === 'positive') sentimentCounts.positive++;
      else if (t.sentiment === 'negative') sentimentCounts.negative++;
      else sentimentCounts.neutral++;
      
      if (t.emotion) {
        const emotion = String(t.emotion).toLowerCase();
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      }
      if (t.keywords && Array.isArray(t.keywords)) {
        allKeywords.push(...t.keywords.filter((k: any) => typeof k === 'string'));
      }
    });

    log.info('STEP-6-PROCESS', 'Sentiment counts calculated', { 
      ...sentimentCounts,
      totalAnalyzed: analysis.tweets?.length || 0,
      emotionsFound: Object.keys(emotionCounts).length
    });

    // Calculate top keywords
    const keywordFrequency: Record<string, number> = {};
    allKeywords.forEach(keyword => {
      keywordFrequency[keyword] = (keywordFrequency[keyword] || 0) + 1;
    });
    const topKeywords = Object.entries(keywordFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count }));

    log.info('STEP-6-PROCESS', `Extracted ${topKeywords.length} top keywords`, {
      topKeywords: topKeywords.slice(0, 5).map(k => k.keyword)
    });

    // Get sample tweets
    const sampleTweets = { positive: [] as any[], negative: [] as any[], neutral: [] as any[] };

    ['positive', 'negative', 'neutral'].forEach(sentimentType => {
      const filtered = analysis.tweets
        ?.filter((t: any) => t.sentiment === sentimentType)
        .sort((a: any, b: any) => {
          const engagementA = tweets[a.index]?.likeCount + tweets[a.index]?.retweetCount || 0;
          const engagementB = tweets[b.index]?.likeCount + tweets[b.index]?.retweetCount || 0;
          return (b.confidence * engagementB) - (a.confidence * engagementA);
        })
        .slice(0, 5);

      filtered?.forEach((t: any) => {
        const tweet = tweets[t.index];
        const analyzedTweet = tweetsToAnalyze[t.index];
        if (tweet) {
          sampleTweets[sentimentType as keyof typeof sampleTweets].push({
            text: tweet.text,
            author: tweet.author?.userName || 'مجهول',
            authorName: tweet.author?.name || tweet.author?.userName || 'مجهول',
            authorVerified: tweet.author?.isVerified || false,
            authorBlueVerified: tweet.author?.isBlueVerified || false,
            likes: tweet.likeCount || 0,
            retweets: tweet.retweetCount || 0,
            replies: tweet.replyCount || 0,
            quotes: tweet.quoteCount || 0,
            bookmarks: tweet.bookmarkCount || 0,
            createdAt: tweet.createdAt || '',
            isRetweet: tweet.isRetweet || false,
            isQuote: tweet.isQuote || false,
            reason: t.reason,
            confidence: t.confidence,
            emotion: t.emotion,
            keywords: t.keywords || [],
            url: tweet.url || tweet.twitterUrl || '',
            matchedSearchTerms: analyzedTweet?.matchedSearchTerms || [],
            matchedHandles: analyzedTweet?.matchedHandles || []
          });
        }
      });
    });

    // Map all analyzed tweets to include full data
    const allAnalyzedTweets = analysis.tweets?.map((t: any) => {
      const tweet = tweets[t.index];
      const analyzedTweet = tweetsToAnalyze[t.index];
      
      if (!tweet) {
        log.warn('STEP-6-PROCESS', `Tweet at index ${t.index} not found in original tweets array`, {
          index: t.index,
          totalTweets: tweets.length,
          analyzedTweetsCount: analysis.tweets?.length
        });
        return null;
      }
      
      return {
        text: tweet.text || tweet.fullText || '',
        author: tweet.author?.userName || 'مجهول',
        authorName: tweet.author?.name || tweet.author?.userName || 'مجهول',
        authorVerified: tweet.author?.isVerified || false,
        authorBlueVerified: tweet.author?.isBlueVerified || false,
        likes: tweet.likeCount || 0,
        retweets: tweet.retweetCount || 0,
        replies: tweet.replyCount || 0,
        quotes: tweet.quoteCount || 0,
        bookmarks: tweet.bookmarkCount || 0,
        createdAt: tweet.createdAt || '',
        isRetweet: tweet.isRetweet || false,
        isQuote: tweet.isQuote || false,
        sentiment: t.sentiment,
        reason: t.reason,
        confidence: t.confidence,
        emotion: t.emotion,
        keywords: t.keywords || [],
        url: tweet.url || tweet.twitterUrl || '',
        matchedSearchTerms: analyzedTweet?.matchedSearchTerms || [],
        matchedHandles: analyzedTweet?.matchedHandles || []
      };
    }).filter(Boolean) || [];

    log.success('STEP-6-PROCESS', 'All analyzed tweets mapped', {
      totalAnalyzedTweets: allAnalyzedTweets.length,
      analysisCount: analysis.tweets?.length || 0,
      originalTweetsCount: tweets.length,
      nullCount: (analysis.tweets?.length || 0) - allAnalyzedTweets.length
    });

    log.success('STEP-6-PROCESS', 'Sample tweets extracted', {
      positive: sampleTweets.positive.length,
      negative: sampleTweets.negative.length,
      neutral: sampleTweets.neutral.length,
      totalSampleTweets: sampleTweets.positive.length + sampleTweets.negative.length + sampleTweets.neutral.length
    });

    log.info('STEP-6-PROCESS', 'Final data check before database save', {
      allAnalyzedTweetsCount: allAnalyzedTweets.length,
      analysisInsights: !!analysis.overall_insights,
      analysisRecommendations: !!analysis.recommendations,
      sentimentCounts
    });

    // STEP 7: Save to database
    if (supabaseUrl && supabaseKey) {
      try {
        log.info('STEP-7-DATABASE', `Saving analysis to database [${requestId}]`);
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        const dbPayload = {
          search_terms: termsArray,
          max_items: validatedMaxItems,
          sort_order: validatedSort,
          total_tweets: tweets.length,
          positive_count: sentimentCounts.positive,
          negative_count: sentimentCounts.negative,
          neutral_count: sentimentCounts.neutral,
          insights: analysis.overall_insights || '',
          recommendations: Array.isArray(analysis.recommendations) 
            ? analysis.recommendations.join('\n') 
            : (analysis.recommendations || ''),
          main_issues: (analysis.main_issues || []).join('\n'),
          all_tweets: allAnalyzedTweets, // Store all analyzed tweets with full data
          sample_tweets: {
            ...sampleTweets,
            topKeywords,
            emotions: emotionCounts,
            themes: analysis.key_themes || [],
            sentimentSummary: analysis.sentiment_summary,
            metadata: {
              requestId,
              processedAt: new Date().toISOString(),
              batchCount: batches.length,
              failedBatches: batchErrors.length
            }
          }
        };

        const { error: dbError } = await supabase
          .from('tweet_analyses')
          .insert(dbPayload);

        if (dbError) {
          log.error('STEP-7-DATABASE', 'Database save failed', {
            error: dbError.message,
            code: dbError.code,
            details: dbError.details
          });
          // Don't throw - database errors shouldn't fail the whole request
        } else {
          log.success('STEP-7-DATABASE', `Analysis saved to database successfully [${requestId}]`);
        }
      } catch (dbError) {
        log.error('STEP-7-DATABASE', 'Database operation failed', {
          error: dbError instanceof Error ? dbError.message : String(dbError)
        });
        // Continue even if database save fails
      }
    } else {
      log.warn('STEP-7-DATABASE', 'Skipping database save: credentials not configured');
    }

    // STEP 8: Return results
    const totalDuration = Date.now() - startTime;
    log.success('STEP-8-COMPLETE', `Analysis completed successfully in ${totalDuration}ms [${requestId}]`, {
      totalTweets: tweets.length,
      analyzedTweets: analysis.tweets?.length || 0,
      duration: totalDuration
    });

    const isPartialResult = allAnalysisResults.length < batches.length;
    const response = {
      success: true,
      requestId,
      totalTweets: tweets.length,
      analyzedTweets: analysis.tweets?.length || 0,
      isPartialResult,
      sentiments: {
        positive: sentimentCounts.positive,
        negative: sentimentCounts.negative,
        neutral: sentimentCounts.neutral,
        percentages: {
          positive: ((sentimentCounts.positive / (analysis.tweets?.length || 1)) * 100).toFixed(1),
          negative: ((sentimentCounts.negative / (analysis.tweets?.length || 1)) * 100).toFixed(1),
          neutral: ((sentimentCounts.neutral / (analysis.tweets?.length || 1)) * 100).toFixed(1)
        }
      },
      emotions: emotionCounts,
      topKeywords,
      themes: analysis.key_themes || [],
      mainIssues: analysis.main_issues || [],
      insights: analysis.overall_insights || '',
      recommendations: analysis.recommendations || '',
      sentimentSummary: analysis.sentiment_summary,
      allTweets: allAnalyzedTweets, // Include all analyzed tweets with full data in response
      sampleTweets,
      performance: {
        totalDuration,
        dataCollectionDuration: apifyDuration,
        analysisDuration: openrouterDuration,
        avgBatchDuration: Math.round(openrouterDuration / batches.length)
      },
      metadata: {
        batchesProcessed: allAnalysisResults.length,
        totalBatches: batches.length,
        failedBatches: batchErrors.length,
        errors: batchErrors.length > 0 ? batchErrors : undefined,
        warning: isPartialResult ? `Analysis completed with partial results (${allAnalysisResults.length}/${batches.length} batches) due to time constraints. Consider reducing the number of tweets for complete analysis.` : undefined
      }
    };

    log.info('STEP-8-COMPLETE', 'Response payload prepared', {
      dataSize: `${(JSON.stringify(response).length / 1024).toFixed(2)} KB`,
      performance: response.performance,
      requestId
    });

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    log.error('ERROR', `Analysis failed after ${duration}ms [${requestId}]`, {
      error: errorMessage,
      stack: errorStack,
      duration,
      requestId
    });
    
    // Determine appropriate status code
    let statusCode = 500;
    if (errorMessage.includes('Rate limit')) statusCode = 429;
    else if (errorMessage.includes('timeout')) statusCode = 504;
    else if (errorMessage.includes('Invalid') || errorMessage.includes('required')) statusCode = 400;
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
        details: Deno.env.get('NODE_ENV') === 'development' ? errorStack : undefined,
        duration,
        statusCode,
        requestId
      }),
      { 
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
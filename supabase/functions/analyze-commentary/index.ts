import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function for retry logic
async function fetchWithRetry(url: string, options: any, maxRetries = 3, timeoutMs = 120000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      console.error(`Attempt ${i + 1}/${maxRetries} failed:`, error.message);
      
      if (i === maxRetries - 1) throw error;
      if (error.name === 'AbortError') {
        throw new Error('انتهت مهلة الطلب. الملف قد يكون كبيراً جداً.');
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  throw new Error('فشلت جميع المحاولات');
}

// Validation helper
function validateAnalysisResponse(analysis: any): { valid: boolean; error?: string } {
  if (!analysis.overallScore || typeof analysis.overallScore !== 'number') {
    return { valid: false, error: 'Missing or invalid overallScore' };
  }
  if (analysis.overallScore < 0 || analysis.overallScore > 10) {
    return { valid: false, error: 'overallScore out of range (0-10)' };
  }
  
  // Validate new criteria structure
  if (!analysis.criteria || typeof analysis.criteria !== 'object') {
    return { valid: false, error: 'Missing or invalid criteria object' };
  }
  
  const requiredCriteria = ['clarity', 'enthusiasm', 'accuracy', 'timing', 'terminology', 'eventReaction', 'styleVariety'];
  for (const criterion of requiredCriteria) {
    const criterionData = analysis.criteria[criterion];
    if (!criterionData || typeof criterionData !== 'object') {
      return { valid: false, error: `Missing or invalid criterion: ${criterion}` };
    }
    if (typeof criterionData.score !== 'number' || criterionData.score < 0 || criterionData.score > 10) {
      return { valid: false, error: `Invalid score for ${criterion}` };
    }
    if (!criterionData.explanation || typeof criterionData.explanation !== 'string') {
      return { valid: false, error: `Missing explanation for ${criterion}` };
    }
    if (!Array.isArray(criterionData.quotes) || criterionData.quotes.length === 0) {
      return { valid: false, error: `Missing or empty quotes for ${criterion}` };
    }
  }
  
  // Validate emotional analysis in new format
  if (analysis.emotionalAnalysis) {
    if (typeof analysis.emotionalAnalysis !== 'object') {
      return { valid: false, error: 'emotionalAnalysis must be an object' };
    }
    if (typeof analysis.emotionalAnalysis.score !== 'number' || analysis.emotionalAnalysis.score < 0 || analysis.emotionalAnalysis.score > 10) {
      return { valid: false, error: 'Invalid score for emotionalAnalysis' };
    }
    if (!analysis.emotionalAnalysis.explanation || typeof analysis.emotionalAnalysis.explanation !== 'string') {
      return { valid: false, error: 'Missing explanation for emotionalAnalysis' };
    }
    if (!Array.isArray(analysis.emotionalAnalysis.quotes) || analysis.emotionalAnalysis.quotes.length === 0) {
      return { valid: false, error: 'Missing or empty quotes for emotionalAnalysis' };
    }
  }
  
  if (!Array.isArray(analysis.strengths) || analysis.strengths.length === 0) {
    return { valid: false, error: 'strengths must be a non-empty array' };
  }
  if (!Array.isArray(analysis.improvements) || analysis.improvements.length === 0) {
    return { valid: false, error: 'improvements must be a non-empty array' };
  }
  if (!Array.isArray(analysis.excitementTimeline) || analysis.excitementTimeline.length === 0) {
    return { valid: false, error: 'excitementTimeline must be a non-empty array' };
  }
  
  return { valid: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const MAX_FUNCTION_TIME = 480000; // 8 minutes total function timeout
  console.log("=== Commentary Analysis Started ===");

  // Create timeout promise for overall function
  const functionTimeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('انتهت مهلة التحليل. الملف قد يكون كبيراً جداً أو معقداً. جرب ملفاً أصغر (أقل من 5 دقائق).'));
    }, MAX_FUNCTION_TIME);
  });

  try {
    // Step 0: Parse and validate request (support multipart or JSON)
    let requestBody: any = undefined;
    let filename: string = '';
    let audioBase64: string | undefined = undefined;
    let uploadFile: File | null = null;

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      try {
        const form = await req.formData();
        const f = form.get('file');
        const providedName = form.get('filename');
        if (!(f instanceof File)) {
          console.error('ERROR: No file found in multipart body');
          throw new Error('لم يتم تقديم ملف صالح');
        }
        uploadFile = f;
        filename = (typeof providedName === 'string' && providedName) || (uploadFile.name || 'audio');
      } catch (e) {
        console.error('ERROR: Failed to parse multipart body', e);
        throw new Error('خطأ في تنسيق البيانات المرسلة');
      }
    } else {
      try {
        requestBody = await req.json();
      } catch (parseError) {
        console.error('ERROR: Invalid JSON in request body');
        throw new Error('خطأ في تنسيق البيانات المرسلة');
      }
      filename = typeof requestBody.filename === 'string' ? requestBody.filename : '';
      audioBase64 = typeof requestBody.audio === 'string' ? requestBody.audio : undefined;

      if (!audioBase64) {
        console.error('ERROR: No audio data provided or invalid format');
        throw new Error('لم يتم تقديم بيانات صوتية صالحة');
      }
      if (!filename) {
        console.error('ERROR: No filename provided');
        throw new Error('اسم الملف مفقود');
      }
    }
    console.log(`[${Date.now() - startTime}ms] Processing file: ${filename}`);
    if (uploadFile) {
      console.log(`[${Date.now() - startTime}ms] File size: ${(uploadFile.size / (1024 * 1024)).toFixed(2)} MB`);
    } else {
      console.log(`[${Date.now() - startTime}ms] Audio data length: ${audioBase64!.length} characters`);
    }

    // Step 1: Validate API keys
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error("ERROR: OPENAI_API_KEY not configured");
      throw new Error('خطأ في الإعداد: مفتاح OpenAI غير متوفر. يرجى التواصل مع الدعم.');
    }
    
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterApiKey) {
      console.error("ERROR: OPENROUTER_API_KEY not configured");
      throw new Error('خطأ في الإعداد: مفتاح OpenRouter غير متوفر. يرجى التواصل مع الدعم.');
    }

    // Step 2: Prepare audio and validate size (stream-friendly)
    let formData = new FormData();
    const defaultMime = 'audio/mpeg';
    try {
      if (uploadFile) {
        // Validate using original file without copying into memory
        const sizeInMB = uploadFile.size / (1024 * 1024);
        if (uploadFile.size < 10 * 1024) {
          throw new Error('الملف صغير جداً. يجب أن يكون أكبر من 10 كيلوبايت.');
        }
        if (sizeInMB > 25) {
          throw new Error(`حجم الملف (${sizeInMB.toFixed(2)} ميجابايت) يتجاوز الحد الأقصى (25 ميجابايت).`);
        }
        console.log(`[${Date.now() - startTime}ms] File size validation passed: ${sizeInMB.toFixed(2)} MB`);

        // Forward original file to OpenAI to avoid extra copies
        formData.append('file', uploadFile, filename);
      } else {
        // Fallback path: base64 -> binary (kept for backward compatibility)
        console.log(`[${Date.now() - startTime}ms] Step 2: Converting audio to binary...`);
        const binaryAudio = Uint8Array.from(atob(audioBase64!), (c) => c.charCodeAt(0));
        console.log(`[${Date.now() - startTime}ms] Binary conversion successful, size: ${binaryAudio.length} bytes`);

        // Immediately free large base64 string to lower peak memory
        audioBase64 = undefined;
        try { (requestBody as any).audio = undefined; } catch {}

        // Validate file size (min 10KB, max 25MB)
        const sizeInMB = binaryAudio.length / (1024 * 1024);
        if (binaryAudio.length < 10 * 1024) {
          throw new Error('الملف صغير جداً. يجب أن يكون أكبر من 10 كيلوبايت.');
        }
        if (sizeInMB > 25) {
          throw new Error(`حجم الملف (${sizeInMB.toFixed(2)} ميجابايت) يتجاوز الحد الأقصى (25 ميجابايت).`);
        }
        console.log(`[${Date.now() - startTime}ms] File size validation passed: ${sizeInMB.toFixed(2)} MB`);

        const audioBlob = new Blob([binaryAudio as unknown as BlobPart], { type: defaultMime });
        formData.append('file', audioBlob, filename);
      }
    } catch (conversionError: any) {
      console.error(`[${Date.now() - startTime}ms] ERROR preparing audio:`, conversionError);
      if (conversionError.message?.includes('يجب') || conversionError.message?.includes('يتجاوز')) {
        throw conversionError;
      }
      throw new Error('فشل في معالجة الملف الصوتي. تأكد من أن الملف صحيح وليس تالفاً.');
    }

    // Step 3: Prepare OpenAI transcription request with timestamps
    console.log(`[${Date.now() - startTime}ms] Step 3: Preparing OpenAI request with timestamps...`);
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities[]', 'segment');
    formData.append('language', 'ar'); // Optimize for Arabic

    // Step 4: Call OpenAI API with retry logic and race against timeout
    console.log(`[${Date.now() - startTime}ms] Step 4: Sending to OpenAI Whisper API (with retry)...`);
    let transcriptionResponse;
    try {
      transcriptionResponse = await Promise.race([
        fetchWithRetry(
          'https://api.openai.com/v1/audio/transcriptions',
          {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${openAIApiKey}` },
            body: formData,
          },
          2, // reduced retries
          240000 // 4 minutes timeout for large files
        ),
        functionTimeoutPromise
      ]) as Response;
      console.log(`[${Date.now() - startTime}ms] Whisper API responded successfully`);
    } catch (fetchError: any) {
      console.error(`[${Date.now() - startTime}ms] OpenAI fetch failed:`, fetchError.message);
      throw new Error(fetchError.message || 'فشل الاتصال بخدمة التفريغ الصوتي. حاول مرة أخرى لاحقاً.');
    }

    if (!transcriptionResponse.ok) {
      const errorText = await transcriptionResponse.text();
      console.error(`[${Date.now() - startTime}ms] OpenAI transcription error (${transcriptionResponse.status}):`, errorText);
      
      let errorMessage = 'فشل تحويل الصوت إلى نص';
      if (transcriptionResponse.status === 400) {
        errorMessage = 'تنسيق الملف غير صحيح أو الملف تالف';
      } else if (transcriptionResponse.status === 401) {
        errorMessage = 'خطأ في مفتاح API. يرجى التواصل مع الدعم';
      } else if (transcriptionResponse.status === 413) {
        errorMessage = 'الملف كبير جداً. الحد الأقصى 25 ميجابايت';
      } else if (transcriptionResponse.status === 429) {
        errorMessage = 'تم تجاوز الحد الأقصى للطلبات. حاول مرة أخرى بعد دقيقة';
      } else if (transcriptionResponse.status >= 500) {
        errorMessage = 'خطأ في خادم OpenAI. حاول مرة أخرى لاحقاً';
      }
      
      throw new Error(`${errorMessage} (${transcriptionResponse.status})`);
    }

    let transcriptionData;
    try {
      transcriptionData = await transcriptionResponse.json();
    } catch (jsonError) {
      console.error(`[${Date.now() - startTime}ms] Failed to parse transcription JSON:`, jsonError);
      throw new Error('فشل في قراءة استجابة التفريغ الصوتي');
    }
    
    console.log(`[${Date.now() - startTime}ms] Transcription successful`);
    console.log(`[${Date.now() - startTime}ms] Transcription text length: ${transcriptionData.text?.length || 0} characters`);

    // Validate transcription
    if (!transcriptionData.text || typeof transcriptionData.text !== 'string') {
      console.error(`[${Date.now() - startTime}ms] ERROR: Invalid transcription format`);
      throw new Error('تنسيق استجابة التفريغ غير صالح');
    }
    
    const trimmedText = transcriptionData.text.trim();
    if (trimmedText.length === 0) {
      console.error(`[${Date.now() - startTime}ms] ERROR: Empty transcription`);
      throw new Error('لم يتم العثور على محتوى صوتي في الملف. تأكد من وجود صوت واضح في التسجيل.');
    }
    
    if (trimmedText.length < 50) {
      console.warn(`[${Date.now() - startTime}ms] WARNING: Very short transcription (${trimmedText.length} chars)`);
    }
    
    console.log(`[${Date.now() - startTime}ms] First 100 chars: ${trimmedText.substring(0, 100)}...`);

    // Extract segments with timestamps
    const segments = transcriptionData.segments || [];
    console.log(`[${Date.now() - startTime}ms] Extracted ${segments.length} segments with timestamps`);

    // Step 4.5: Skip typo correction to reduce resources and enforce determinism
    console.log(`[${Date.now() - startTime}ms] Step 4.5: Skipping typo correction (ignoring typos by design)`);
    const correctedText = trimmedText;

    // Step 5: Prepare analysis request with deterministic, measurable criteria
    const systemPrompt = `أنت محلل خبير في التعليق الرياضي لكرة القدم. مهمتك تحليل أداء المعلق بشكل موضوعي وقابل للقياس.

⚠️ مهم جداً: تجاهل تماماً أي أخطاء إملائية أو نحوية في النص. ركز فقط على المحتوى والأداء. الأخطاء الإملائية لا تؤثر على التقييم أبداً.

معايير التقييم الموضوعية (كل معيار من 1-10):

1. **وضوح الصوت والنطق** (Clarity):
   - 9-10: نطق واضح جداً، صوت مسموع بشكل ممتاز، لا يوجد تلعثم أو تداخل كلمات
   - 7-8: نطق واضح مع بعض اللحظات البسيطة من عدم الوضوح
   - 5-6: وضوح متوسط، بعض الكلمات غير واضحة أو صوت منخفض أحياناً
   - 3-4: صعوبة في الفهم في عدة مواضع
   - 1-2: غير واضح في معظم الأوقات

2. **الحماس والطاقة** (Enthusiasm):
   - 9-10: طاقة عالية جداً، حماس واضح، تفاعل قوي مع الأحداث المهمة
   - 7-8: حماس جيد مع بعض اللحظات المميزة
   - 5-6: طاقة متوسطة، بعض التفاعل لكن ليس قوياً
   - 3-4: حماس ضعيف، أداء رتيب
   - 1-2: لا يوجد حماس أو طاقة تقريباً

3. **دقة الوصف** (Accuracy):
   - 9-10: وصف دقيق للأحداث، ذكر أسماء اللاعبين بشكل صحيح، تفاصيل المباراة واضحة
   - 7-8: وصف جيد مع بعض التفاصيل الناقصة
   - 5-6: وصف أساسي مع نقص في التفاصيل
   - 3-4: وصف غامض أو غير دقيق
   - 1-2: معلومات خاطئة أو وصف غير مفيد

4. **التوقيت والسرعة** (Timing):
   - 9-10: سرعة مناسبة جداً، توقيت ممتاز للتعليق على الأحداث
   - 7-8: توقيت جيد مع بعض التأخير أو التسريع البسيط
   - 5-6: سرعة متوسطة، بعض التأخير في التعليق
   - 3-4: بطيء جداً أو سريع جداً بشكل يؤثر على الفهم
   - 1-2: توقيت سيء، تأخير كبير أو تسريع مفرط

5. **استخدام المصطلحات الرياضية** (Terminology):
   - 9-10: استخدام مصطلحات احترافية متنوعة، لغة رياضية غنية
   - 7-8: مصطلحات جيدة مع بعض التكرار
   - 5-6: مصطلحات أساسية فقط، تكرار واضح
   - 3-4: مصطلحات محدودة جداً أو غير احترافية
   - 1-2: لا يوجد استخدام صحيح للمصطلحات

6. **التفاعل مع الأحداث** (Event Reaction):
   - 9-10: تفاعل فوري وقوي مع كل الأحداث المهمة، تصعيد صوتي مناسب
   - 7-8: تفاعل جيد مع معظم الأحداث
   - 5-6: تفاعل متوسط، بعض الأحداث تمر دون رد فعل كافٍ
   - 3-4: تفاعل ضعيف أو متأخر
   - 1-2: لا يوجد تفاعل تقريباً

7. **التنوع في الأسلوب** (Style Variety):
   - 9-10: تنوع كبير في طبقات الصوت، تعبيرات متعددة، أسلوب غني
   - 7-8: تنوع جيد مع بعض التكرار
   - 5-6: تنوع محدود، أسلوب رتيب أحياناً
   - 3-4: رتيب، لا يوجد تنوع
   - 1-2: أسلوب أحادي تماماً

8. **التحليل العاطفي الشامل** (Emotional Analysis):
   - 9-10: عمق عاطفي كبير، ينقل المشاعر بقوة (إثارة، فرح، توتر)
   - 7-8: بعد عاطفي جيد، يظهر مشاعر واضحة
   - 5-6: عاطفة متوسطة، بعض المشاعر موجودة
   - 3-4: عاطفة ضعيفة، أداء جاف
   - 1-2: لا يوجد بعد عاطفي تقريباً

**الدرجة الإجمالية**: متوسط الدرجات السبعة الأولى + تأثير التحليل العاطفي

**تنسيق JSON المطلوب** (بدون أي نص إضافي قبله أو بعده):
{
  "overallScore": رقم عشري من 1-10 (متوسط المعايير),
  "criteria": {
    "clarity": {
      "score": رقم من 1-10,
      "explanation": "شرح موضوعي يستند إلى المعايير أعلاه (2-3 جمل)",
      "quotes": ["اقتباس حرفي 1", "اقتباس حرفي 2", "اقتباس حرفي 3"]
    },
    "enthusiasm": { "score": رقم, "explanation": "شرح", "quotes": ["اقتباس 1", "اقتباس 2", "اقتباس 3"] },
    "accuracy": { "score": رقم, "explanation": "شرح", "quotes": ["اقتباس 1", "اقتباس 2"] },
    "timing": { "score": رقم, "explanation": "شرح", "quotes": ["اقتباس 1", "اقتباس 2"] },
    "terminology": { "score": رقم, "explanation": "شرح", "quotes": ["اقتباس 1", "اقتباس 2", "اقتباس 3"] },
    "eventReaction": { "score": رقم, "explanation": "شرح", "quotes": ["اقتباس 1", "اقتباس 2"] },
    "styleVariety": { "score": رقم, "explanation": "شرح", "quotes": ["اقتباس 1", "اقتباس 2"] }
  },
  "emotionalAnalysis": {
    "score": رقم من 1-10,
    "explanation": "تحليل العمق العاطفي (2-3 جمل)",
    "quotes": ["اقتباس 1", "اقتباس 2", "اقتباس 3"]
  },
  "emotionalTimeline": [
    {"timestamp": رقم الثانية, "emotion": "اسم العاطفة", "intensity": 1-10, "description": "وصف قصير"}
  ],
  "strengths": ["نقطة قوة 1", "نقطة قوة 2", "نقطة قوة 3", "نقطة قوة 4"],
  "improvements": ["نقطة تحسين 1", "نقطة تحسين 2", "نقطة تحسين 3", "نقطة تحسين 4"],
  "excitementTimeline": [
    {"timestamp": رقم الثانية, "score": 1-10, "event": "وصف الحدث"}
  ]
}

**قواعد مهمة**:
- استخدم المعايير الموضوعية أعلاه لتحديد الدرجات
- تجاهل تماماً الأخطاء الإملائية والنحوية
- الاقتباسات يجب أن تكون حرفية من النص (5-15 كلمة)
- emotionalTimeline: 12 نقطة موزعة بالتساوي
- excitementTimeline: 10 نقاط موزعة بالتساوي
- كن موضوعياً ومتسقاً`;

    console.log(`[${Date.now() - startTime}ms] Step 5: Sending to OpenRouter for analysis (with retry)...`);
    console.log(`[${Date.now() - startTime}ms] Using corrected text length: ${correctedText.length} characters`);

    let analysisResponse;
    try {
      analysisResponse = await Promise.race([
        fetchWithRetry(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openRouterApiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': Deno.env.get('SUPABASE_URL') || '',
            },
            body: JSON.stringify({
              model: 'anthropic/claude-sonnet-4',
              max_tokens: 3500,
              temperature: 0,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: correctedText }
              ],
            }),
          },
          2, // max retries
          180000 // 3 minutes timeout for analysis
        ),
        functionTimeoutPromise
      ]) as Response;
      console.log(`[${Date.now() - startTime}ms] Analysis API responded successfully`);
    } catch (fetchError: any) {
      console.error(`[${Date.now() - startTime}ms] OpenRouter fetch failed:`, fetchError.message);
      throw new Error(fetchError.message || 'فشل الاتصال بخدمة التحليل. حاول مرة أخرى لاحقاً.');
    }

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      console.error(`[${Date.now() - startTime}ms] OpenRouter error (${analysisResponse.status}):`, errorText);
      
      let errorMessage = 'فشل تحليل المحتوى';
      if (analysisResponse.status === 400) {
        errorMessage = 'خطأ في طلب التحليل';
      } else if (analysisResponse.status === 401) {
        errorMessage = 'خطأ في مفتاح API. يرجى التواصل مع الدعم';
      } else if (analysisResponse.status === 429) {
        errorMessage = 'تم تجاوز الحد الأقصى للطلبات. حاول مرة أخرى بعد دقيقة';
      } else if (analysisResponse.status >= 500) {
        errorMessage = 'خطأ في خادم التحليل. حاول مرة أخرى لاحقاً';
      }
      
      throw new Error(`${errorMessage} (${analysisResponse.status})`);
    }

    // Step 6: Parse and validate analysis response
    let analysisData;
    try {
      analysisData = await analysisResponse.json();
    } catch (jsonError) {
      console.error(`[${Date.now() - startTime}ms] Failed to parse analysis JSON:`, jsonError);
      throw new Error('فشل في قراءة استجابة التحليل');
    }
    
    if (!analysisData.choices || !analysisData.choices[0] || !analysisData.choices[0].message) {
      console.error(`[${Date.now() - startTime}ms] ERROR: Invalid analysis response structure`);
      console.error(`[${Date.now() - startTime}ms] Response:`, JSON.stringify(analysisData, null, 2));
      throw new Error('تنسيق استجابة التحليل غير صالح');
    }
    
    const analysisContent = analysisData.choices[0].message.content;
    console.log(`[${Date.now() - startTime}ms] Analysis completed, response length: ${analysisContent.length} characters`);

    // Parse the JSON response from the analysis
    let analysis;
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = analysisContent.match(/```json\n([\s\S]*?)\n```/) || 
                       analysisContent.match(/```\n([\s\S]*?)\n```/);
      const jsonText = jsonMatch ? jsonMatch[1] : analysisContent;
      analysis = JSON.parse(jsonText.trim());
      console.log(`[${Date.now() - startTime}ms] JSON parsing successful`);
    } catch (parseError) {
      console.error(`[${Date.now() - startTime}ms] ERROR parsing analysis JSON:`, parseError);
      console.error(`[${Date.now() - startTime}ms] Raw content (first 500 chars):`, analysisContent.substring(0, 500));
      throw new Error('فشل في تحليل استجابة النموذج. الاستجابة ليست بتنسيق JSON صحيح.');
    }
    
    // Validate the analysis structure with detailed logging
    console.log(`[${Date.now() - startTime}ms] Validating analysis structure...`);
    console.log(`[${Date.now() - startTime}ms] Analysis keys:`, Object.keys(analysis));
    
    if (analysis.criteria) {
      console.log(`[${Date.now() - startTime}ms] Criteria keys:`, Object.keys(analysis.criteria));
      for (const [key, value] of Object.entries(analysis.criteria)) {
        if (value && typeof value === 'object') {
          console.log(`[${Date.now() - startTime}ms] ${key}:`, {
            hasScore: 'score' in value,
            hasExplanation: 'explanation' in value,
            hasQuotes: 'quotes' in value,
            quotesCount: Array.isArray((value as any).quotes) ? (value as any).quotes.length : 0
          });
        }
      }
    }
    
    const validation = validateAnalysisResponse(analysis);
    if (!validation.valid) {
      console.error(`[${Date.now() - startTime}ms] ERROR: Invalid analysis structure:`, validation.error);
      console.error(`[${Date.now() - startTime}ms] Analysis object:`, JSON.stringify(analysis, null, 2));
      
      // Provide more specific error messages for common issues
      if (validation.error?.includes('criteria')) {
        throw new Error('التحليل غير مكتمل: بعض المعايير مفقودة أو غير صحيحة. يرجى المحاولة مرة أخرى.');
      } else if (validation.error?.includes('score')) {
        throw new Error('التحليل غير مكتمل: بعض الدرجات مفقودة أو غير صحيحة. يرجى المحاولة مرة أخرى.');
      } else if (validation.error?.includes('quotes')) {
        throw new Error('التحليل غير مكتمل: الاقتباسات الداعمة مفقودة. يرجى المحاولة مرة أخرى.');
      }
      
      throw new Error(`استجابة التحليل غير مكتملة أو غير صحيحة: ${validation.error}`);
    }

    console.log(`[${Date.now() - startTime}ms] Analysis validation passed`);
    console.log(`[${Date.now() - startTime}ms] Overall score: ${analysis.overallScore}/10`);
    console.log(`[${Date.now() - startTime}ms] Criteria scores:`, {
      clarity: analysis.criteria.clarity.score,
      enthusiasm: analysis.criteria.enthusiasm.score,
      accuracy: analysis.criteria.accuracy.score,
      timing: analysis.criteria.timing.score,
      terminology: analysis.criteria.terminology.score,
      eventReaction: analysis.criteria.eventReaction.score,
      styleVariety: analysis.criteria.styleVariety.score,
    });
    console.log(`[${Date.now() - startTime}ms] Strengths: ${analysis.strengths.length} items`);
    console.log(`[${Date.now() - startTime}ms] Improvements: ${analysis.improvements.length} items`);
    console.log(`[${Date.now() - startTime}ms] Excitement timeline: ${analysis.excitementTimeline.length} points`);
    console.log(`[${Date.now() - startTime}ms] Emotional timeline: ${analysis.emotionalTimeline?.length || 0} points`);

    const finalResponse = {
      transcription: correctedText,
      segments: segments.map((seg: any) => ({
        text: seg.text || '',
        start: seg.start || 0,
        end: seg.end || 0,
      })),
      analysis,
    };

    console.log(`[${Date.now() - startTime}ms] === Analysis Completed Successfully ===`);

    return new Response(
      JSON.stringify(finalResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    const elapsedTime = Date.now() - startTime;
    console.error(`[${elapsedTime}ms] === ERROR in analyze-commentary ===`);
    console.error(`[${elapsedTime}ms] Error type:`, error.constructor?.name || 'Unknown');
    console.error(`[${elapsedTime}ms] Error message:`, error.message);
    if (error.stack) {
      console.error(`[${elapsedTime}ms] Error stack:`, error.stack);
    }
    
    // Determine error status code
    let statusCode = 500;
    let userMessage = error.message || 'حدث خطأ غير متوقع';
    
    // Map certain errors to appropriate status codes
    if (error.message?.includes('تنسيق البيانات') || error.message?.includes('اسم الملف')) {
      statusCode = 400; // Bad Request
    } else if (error.message?.includes('مفتاح API') || error.message?.includes('غير مصرح')) {
      statusCode = 401; // Unauthorized
    } else if (error.message?.includes('تجاوز الحد')) {
      statusCode = 429; // Too Many Requests
    } else if (error.message?.includes('انتهت مهلة')) {
      statusCode = 408; // Request Timeout
    }
    
    // Add helpful context to error message
    if (!error.message || error.message === 'حدث خطأ غير متوقع') {
      userMessage = 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى أو التواصل مع الدعم إذا استمرت المشكلة.';
    }
    
    console.error(`[${elapsedTime}ms] Returning error to client with status ${statusCode}`);
    
    return new Response(
      JSON.stringify({ 
        error: userMessage,
        timestamp: new Date().toISOString(),
        elapsedMs: elapsedTime
      }),
      {
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

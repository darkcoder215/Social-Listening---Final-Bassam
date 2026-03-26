import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.78.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('=== NEW SEARCH REQUEST ===');
  const startTime = Date.now();

  try {
    const requestBody = await req.json();
    const { jobTitle, city, companies, skills, experienceLevel, education, excludeTerms, startIndex = 0 } = requestBody;
    
    console.log('Search request:', { jobTitle, city, companies, skills, experienceLevel, education, excludeTerms, startIndex });

    const SERPAPI_KEY = Deno.env.get('SERPAPI_API_KEY');
    const OPENROUTER_KEY = Deno.env.get('OPENROUTER_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SERPAPI_KEY || !OPENROUTER_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    // Build LinkedIn search query with all advanced operators
    let searchQuery = 'site:linkedin.com/in/';
    
    // Job titles (OR if multiple)
    if (jobTitle) {
      searchQuery += ` ${jobTitle}`;
    }
    
    // Cities (already OR-ed in jobTitle format)
    if (city) {
      searchQuery += ` ${city}`;
    }
    
    // Companies (OR)
    if (companies && companies.length > 0) {
      const companiesQuery = companies.map((c: string) => `"${c}"`).join(' OR ');
      searchQuery += ` (${companiesQuery})`;
    }
    
    // Skills (AND - all required)
    if (skills && skills.length > 0) {
      skills.forEach((skill: string) => {
        searchQuery += ` "${skill}"`;
      });
    }
    
    // Experience level (OR)
    if (experienceLevel && experienceLevel.length > 0) {
      const expQuery = experienceLevel.map((e: string) => `"${e}"`).join(' OR ');
      searchQuery += ` (${expQuery})`;
    }
    
    // Education (OR)
    if (education && education.length > 0) {
      const eduQuery = education.map((e: string) => `"${e}"`).join(' OR ');
      searchQuery += ` (${eduQuery})`;
    }
    
    // Exclude terms (NOT operator)
    if (excludeTerms && excludeTerms.length > 0) {
      excludeTerms.forEach((term: string) => {
        searchQuery += ` -"${term}"`;
      });
    }

    console.log('Constructed search query:', searchQuery);

    // Call SerpAPI
    const serpApiUrl = new URL('https://serpapi.com/search');
    serpApiUrl.searchParams.append('api_key', SERPAPI_KEY);
    serpApiUrl.searchParams.append('engine', 'google');
    serpApiUrl.searchParams.append('q', searchQuery);
    serpApiUrl.searchParams.append('location', 'Saudi Arabia');
    serpApiUrl.searchParams.append('google_domain', 'google.com.sa');
    serpApiUrl.searchParams.append('gl', 'us');
    serpApiUrl.searchParams.append('hl', 'en');
    serpApiUrl.searchParams.append('num', '20');
    if (startIndex > 0) {
      serpApiUrl.searchParams.append('start', startIndex.toString());
    }

    console.log('🔍 STAGE 1: Calling SerpAPI...');
    const serpResponse = await fetch(serpApiUrl.toString()).catch(err => {
      console.error('❌ SerpAPI fetch failed:', err);
      throw new Error(`SerpAPI connection failed: ${err.message}`);
    });
    
    if (!serpResponse.ok) {
      const errorText = await serpResponse.text();
      console.error('❌ SerpAPI error response:', serpResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: `SerpAPI failed: ${serpResponse.status}`,
          details: errorText,
          stage: 'serp_api_call'
        }),
        { 
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const serpData = await serpResponse.json();
    console.log('✅ SerpAPI response received, organic results:', serpData.organic_results?.length || 0);

    if (!serpData.organic_results || serpData.organic_results.length === 0) {
      console.log('⚠️ No results found from SerpAPI');
      return new Response(
        JSON.stringify({ 
          candidates: [], 
          totalResults: 0, 
          nextPage: null,
          searchId: null,
          message: 'No candidates found matching the search criteria'
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extract candidates from SerpAPI results
    const rawCandidates = serpData.organic_results.map((result: any) => ({
      name: result.title?.split(' - ')[0]?.trim() || 'Unknown',
      linkedinUrl: result.link,
      snippet: result.snippet || '',
      highlightedWords: result.snippet_highlighted_words || []
    }));

    console.log('Extracted candidates:', rawCandidates.length);

    // Prepare AI analysis prompt
    const candidatesForAI = rawCandidates.map((c: any, idx: number) => 
      `${idx + 1}. ${c.name}\nLinkedIn: ${c.linkedinUrl}\nالملف الشخصي: ${c.snippet}\n`
    ).join('\n');

    const aiPrompt = `أنت محلل توظيف أول في ثمانية، شركة رائدة في رأس المال الجريء والاستثمار في المملكة العربية السعودية. قم بتحليل ملفات LinkedIn التالية لدور "${jobTitle}" في ${city}.

المرشحون:
${candidatesForAI}

لكل مرشح، قدم:
1. درجة الملاءمة (1-10) حيث 10 هو الأنسب تماماً
2. نقاط القوة الرئيسية (2-3 نقاط)
3. الفجوات أو المخاوف المحتملة (1-2 نقطة)
4. تقييم شامل (2-3 جمل)

ركز على:
- الخبرة ذات الصلة في رأس المال الجريء أو التمويل أو المجالات ذات الصلة
- تطابق الموقع (${city} أو المملكة العربية السعودية)
- قدرات القيادة والتفكير الاستراتيجي
- الشبكة والعلاقات في الصناعة
- مهارات التواصل

أعد تحليلك كمصفوفة JSON بهذا الهيكل بالضبط (يجب أن تكون جميع النصوص بالعربية):
[
  {
    "candidateIndex": 0,
    "score": 8.5,
    "strengths": ["نقطة قوة 1", "نقطة قوة 2", "نقطة قوة 3"],
    "gaps": ["فجوة 1", "فجوة 2"],
    "assessment": "نص التقييم الشامل بالعربية"
  }
]`;

    console.log('🤖 STAGE 2: Calling OpenRouter AI for initial analysis...');
    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': SUPABASE_URL,
        'X-Title': 'LinkedIn Candidate Hunter'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: 'أنت محلل توظيف خبير. أجب دائماً بصيغة JSON صالحة فقط. يجب أن تكون جميع النصوص في الرد بالعربية.' },
          { role: 'user', content: aiPrompt }
        ]
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('❌ OpenRouter error:', aiResponse.status, errorText);
      console.log('⚠️ Continuing with fallback analysis due to AI error');
      // Don't throw - continue with fallback
    } else {
      console.log('✅ OpenRouter AI response received');
    }

    // Parse AI response
    let aiAnalyses = [];
    try {
      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const aiContent = aiData.choices[0].message.content;
        console.log('✅ AI analysis parsed successfully');
        
        // Extract JSON from markdown code blocks if present
        const jsonMatch = aiContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, aiContent];
        aiAnalyses = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('AI response not ok');
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      console.error('⚠️ AI analysis parsing failed, using fallback:', errorMsg);
      // Fallback: create basic analysis in Arabic
      aiAnalyses = rawCandidates.map((_: any, idx: number) => ({
        candidateIndex: idx,
        score: 5,
        strengths: ['الملف الشخصي متاح على LinkedIn', 'يحتاج إلى مراجعة يدوية للتقييم الدقيق'],
        gaps: ['التحليل الآلي غير متاح حالياً'],
        assessment: 'التحليل الذكي غير متاح مؤقتاً. يرجى المراجعة اليدوية لهذا المرشح وتقييم مدى ملاءمته للدور بناءً على الملف الشخصي على LinkedIn.'
      }));
    }

    // Get authorization header for user context
    console.log('🔐 STAGE 3: Authenticating user...');
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      console.error('❌ No authorization header provided');
      return new Response(
        JSON.stringify({ 
          error: 'Authentication required',
          details: 'No authorization header provided',
          stage: 'authentication'
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        headers: { Authorization: authHeader }
      }
    });

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ Authentication failed:', userError);
      return new Response(
        JSON.stringify({ 
          error: 'Authentication failed',
          details: userError?.message || 'User not found',
          stage: 'authentication'
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ User authenticated:', user.id);

    // Save search to database
    console.log('💾 STAGE 4: Saving search to database...');
    const { data: search, error: searchError } = await supabase
      .from('candidate_searches')
      .insert({
        user_id: user.id,
        job_title: jobTitle,
        city: city,
        companies: companies || [],
        search_query: searchQuery,
        total_results: serpData.search_information?.total_results || rawCandidates.length,
        job_titles: jobTitle?.split(' OR ')?.map((t: string) => t.replace(/"/g, '').trim()) || [],
        cities: city?.split(' OR ')?.map((c: string) => c.replace(/"/g, '').trim()) || [],
        skills: skills || [],
        experience_level: experienceLevel || [],
        education: education || [],
        exclude_terms: excludeTerms || []
      })
      .select()
      .single();

    if (searchError) {
      console.error('❌ Error saving search:', searchError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to save search',
          details: searchError.message,
          stage: 'save_search'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ Search saved with ID:', search.id);

    // Combine candidates with AI analysis and save
    const candidates = rawCandidates.map((candidate: any, idx: number) => {
      const analysis = aiAnalyses.find((a: any) => a.candidateIndex === idx) || {
        score: 0,
        strengths: [],
        gaps: [],
        assessment: 'Analysis unavailable'
      };

      return {
        search_id: search.id,
        user_id: user.id,
        name: candidate.name,
        linkedin_url: candidate.linkedinUrl,
        profile_summary: candidate.snippet,
        ai_analysis: {
          score: analysis.score,
          strengths: analysis.strengths,
          gaps: analysis.gaps,
          assessment: analysis.assessment
        },
        status: 'pending'
      };
    });

    console.log('💾 STAGE 5: Saving candidates to database...');
    const { data: savedCandidates, error: candidatesError } = await supabase
      .from('candidates')
      .insert(candidates)
      .select();

    if (candidatesError) {
      console.error('❌ Error saving candidates:', candidatesError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to save candidates',
          details: candidatesError.message,
          stage: 'save_candidates'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ Saved candidates:', savedCandidates.length);

    // Return immediately - enrichment will happen via separate function call
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Search completed in ${elapsedTime}s - returning ${savedCandidates.length} candidates`);
    
    return new Response(
      JSON.stringify({
        searchId: search.id,
        candidates: savedCandidates,
        totalResults: serpData.search_information?.total_results || rawCandidates.length,
        candidatesFound: savedCandidates.length,
        message: `Found ${savedCandidates.length} candidates. Call enrich-candidate function to enrich individual profiles.`
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error('❌ FATAL ERROR in search-linkedin-candidates after', elapsedTime, 'seconds');
    console.error('Error:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'N/A');
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorDetails = error instanceof Error ? error.stack : String(error);
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails,
        stage: 'unknown',
        elapsedTime: elapsedTime
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
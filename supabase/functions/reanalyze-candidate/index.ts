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

  try {
    const { candidateId } = await req.json();
    
    if (!candidateId) {
      throw new Error('Candidate ID is required');
    }

    console.log('Re-analyzing candidate:', candidateId);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const authHeader = req.headers.get('authorization');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        headers: authHeader ? { Authorization: authHeader } : {}
      }
    });

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      throw new Error('Authentication required');
    }

    // Fetch candidate with enriched profile and search criteria
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select('*, candidate_searches(*)')
      .eq('id', candidateId)
      .eq('user_id', user.id)
      .single();

    if (candidateError) {
      console.error('Error fetching candidate:', candidateError);
      throw new Error('Candidate not found');
    }

    if (!candidate.enriched_profile || !candidate.enriched_profile.experiences) {
      throw new Error('Candidate profile must be enriched before analysis');
    }

    const profile = candidate.enriched_profile;
    const search = candidate.candidate_searches;

    // Perform AI relevancy analysis
    const analysisPrompt = `أنت محلل موارد بشرية خبير. قم بتحليل هذا الملف الشخصي من LinkedIn بناءً على معايير البحث التالية:

معايير البحث:
- المسمى الوظيفي المطلوب: ${search?.job_title || 'غير محدد'}
- الصناعة/القطاع المستهدف: ${search?.companies?.join(', ') || 'غير محدد'}
- المهارات المطلوبة: ${search?.skills?.join(', ') || 'غير محدد'}
- مستوى الخبرة المطلوب: ${search?.experience_level?.join(', ') || 'غير محدد'}

الملف الشخصي للمرشح:
الاسم: ${profile.fullName}
العنوان: ${profile.headline || 'غير متوفر'}
النبذة: ${profile.about || 'غير متوفرة'}

الخبرات العملية:
${profile.experiences.map((exp: any) => {
  const start = exp.jobStartedOn || 'غير محدد';
  const end = exp.jobStillWorking ? 'حتى الآن' : (exp.jobEndedOn || 'غير محدد');
  return `- ${exp.title} في ${exp.companyName} (${start} - ${end})${exp.jobLocation ? ` - ${exp.jobLocation}` : ''}`;
}).join('\n')}

المهارات:
${profile.skills?.map((s: any) => `- ${s.title}`).join('\n') || 'غير متوفرة'}

التعليم:
${profile.educations?.map((e: any) => {
  const years = e.period ? `(${e.period.startedOn?.year || ''} - ${e.period.endedOn?.year || 'حتى الآن'})` : '';
  return `- ${e.title}${e.subtitle ? ` - ${e.subtitle}` : ''} ${years}`;
}).join('\n') || 'غير متوفر'}

يجب عليك تحليل وتقديم:
1. **overall_relevancy**: نسبة التطابق الإجمالية (0-100) مع معايير البحث
2. **job_title_relevancy**: نسبة الخبرة في المسمى الوظيفي المطلوب (0-100)
3. **industry_relevancy**: نسبة الخبرة في الصناعة/القطاع المستهدف (0-100)
4. **years_relevant_experience**: عدد سنوات الخبرة ذات الصلة (استثنِ: التطوع، عضويات المجالس، الأعمال الجانبية، الاستشارات، الخبرات في مجالات مختلفة تماماً)
5. **total_years_experience**: إجمالي سنوات الخبرة المهنية (كل الوظائف الفعلية، استثنِ فقط: التطوع، عضويات المجالس)
6. **qualification_status**: تقييم المؤهلات ("overqualified" إذا كانت خبرته أكثر بكثير من المطلوب، "qualified" إذا كان مناسب، "underqualified" إذا كان أقل من المطلوب)
7. **explanation_ar**: شرح تفصيلي بالعربية يوضح:
   - لماذا هذه النسب؟
   - ما هي الخبرات ذات الصلة المباشرة؟
   - ما هي الخبرات التي تم استثناؤها ولماذا؟
   - ما مدى توافق المرشح مع المتطلبات؟
   - سبب تصنيف المؤهلات (مؤهل بشكل زائد/مناسب/أقل من المطلوب)

**ملاحظات مهمة:**
- استبعد من حساب السنوات ذات الصلة: التطوع، عضويات المجالس، الاستشارات، الأعمال الجانبية، أي خبرات لا تتعلق مباشرة بالمسمى الوظيفي المطلوب
- احسب السنوات بدقة من تواريخ البداية والنهاية
- إذا كانت الوظيفة لا تزال مستمرة (jobStillWorking = true)، احسب حتى اليوم
- كن دقيقاً في تقييم مدى ملاءمة الخبرات
- عند تحديد qualification_status، قارن بين مستوى الخبرة المطلوب وخبرة المرشح الفعلية

قدم الإجابة بصيغة JSON فقط بهذا الشكل:
{
  "overall_relevancy": رقم من 0 إلى 100,
  "job_title_relevancy": رقم من 0 إلى 100,
  "industry_relevancy": رقم من 0 إلى 100,
  "years_relevant_experience": رقم بالعشرات (مثل 5.5 أو 3.2),
  "total_years_experience": رقم بالعشرات (مثل 8.5 أو 12.0),
  "qualification_status": "overqualified" أو "qualified" أو "underqualified",
  "explanation_ar": "شرح تفصيلي بالعربية"
}`;

    console.log('Calling AI for analysis...');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.3
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from AI');
    }

    let aiAnalysis;
    try {
      // Extract JSON from markdown code blocks if present
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      
      aiAnalysis = JSON.parse(jsonStr);
      console.log('AI analysis completed successfully');
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('Raw content:', content);
      throw new Error('Failed to parse AI response');
    }

    // Update candidate with new analysis
    const { error: updateError } = await supabase
      .from('candidates')
      .update({
        overall_relevancy_score: Math.round(aiAnalysis.overall_relevancy || 0),
        job_title_relevancy_score: Math.round(aiAnalysis.job_title_relevancy || 0),
        industry_relevancy_score: Math.round(aiAnalysis.industry_relevancy || 0),
        years_relevant_experience: parseFloat((aiAnalysis.years_relevant_experience || 0).toFixed(1)),
        total_years_experience: parseFloat((aiAnalysis.total_years_experience || 0).toFixed(1)),
        qualification_status: aiAnalysis.qualification_status || 'pending',
        ai_relevancy_analysis: {
          explanation: aiAnalysis.explanation_ar || '',
          analyzed_at: new Date().toISOString()
        }
      })
      .eq('id', candidateId);

    if (updateError) {
      console.error('Error updating candidate:', updateError);
      throw updateError;
    }

    console.log('Candidate updated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
          overall_relevancy_score: Math.round(aiAnalysis.overall_relevancy || 0),
          job_title_relevancy_score: Math.round(aiAnalysis.job_title_relevancy || 0),
          industry_relevancy_score: Math.round(aiAnalysis.industry_relevancy || 0),
          years_relevant_experience: parseFloat((aiAnalysis.years_relevant_experience || 0).toFixed(1)),
          total_years_experience: parseFloat((aiAnalysis.total_years_experience || 0).toFixed(1)),
          qualification_status: aiAnalysis.qualification_status || 'pending',
          ai_relevancy_analysis: {
            explanation: aiAnalysis.explanation_ar || '',
            analyzed_at: new Date().toISOString()
          }
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in reanalyze-candidate function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

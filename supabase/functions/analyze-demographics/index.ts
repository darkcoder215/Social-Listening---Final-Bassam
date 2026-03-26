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

    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!OPENROUTER_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const authHeader = req.headers.get('authorization');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: authHeader ? { Authorization: authHeader } : {} }
    });

    // Get candidate data
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', candidateId)
      .single();

    if (candidateError || !candidate) {
      throw new Error('Candidate not found');
    }

    // Extract name, profile picture, and education from enriched profile
    const fullName = candidate.enriched_profile?.fullName || candidate.name;
    
    // Try multiple possible field names for profile picture
    const profilePicture = candidate.enriched_profile?.profilePictureUrl || 
                          candidate.enriched_profile?.photoUrl ||
                          candidate.enriched_profile?.profilePicture ||
                          candidate.enriched_profile?.imageUrl ||
                          candidate.enriched_profile?.photo;

    // Extract education history
    const educations = candidate.enriched_profile?.educations || [];
    const educationSummary = educations.map((edu: any) => {
      const school = edu.title || edu.subtitle || 'Unknown institution';
      const years = edu.period ? 
        `${edu.period.startedOn?.year || ''}-${edu.period.endedOn?.year || 'Present'}` : 
        '';
      return `${school}${years ? ` (${years})` : ''}`;
    }).join(', ');

    console.log('Enriched profile keys:', Object.keys(candidate.enriched_profile || {}));
    console.log('Profile picture URL:', profilePicture);
    console.log('Education history:', educationSummary);

    if (!profilePicture) {
      // If no profile picture, analyze based on name and education only
      console.log('No profile picture found, analyzing based on name and education only');
    }

    // Prepare AI analysis prompt
    const messages = [
      {
        role: 'system',
        content: 'You are a demographic analyst. Based on name patterns, cultural indicators, educational institutions, and profile pictures (when available), make educated predictions about gender and citizenship. Be transparent about what indicators you used. Be VERY conservative with confidence scores. Return ONLY valid JSON.'
      },
      {
        role: 'user',
        content: profilePicture ? [
          {
            type: 'text',
            text: `Analyze demographic indicators for this profile:

Name: ${fullName}
Education History: ${educationSummary || 'Not available'}

Based on the available indicators (name pattern, cultural markers, educational institutions, and profile picture), provide:

1. Gender prediction (Male/Female/Unknown)
2. Confidence score (0-100) - BE STRICT: Only >80% if extremely clear, >60% if clear, <60% if uncertain
3. Explanation (max 30 words) - MUST specify which indicators were used (e.g., "Based on name pattern common in..." or "Profile picture suggests..." or "Education at [institution] indicates...")
4. Citizenship/nationality prediction
5. Citizenship confidence score (0-100) - BE STRICT: Only >80% with strong evidence (e.g., clearly identifiable regional institutions)
6. Citizenship explanation (max 30 words) - MUST specify which indicators were used (e.g., "Education at Saudi institutions..." or "Name pattern common in...")

CRITICAL GUIDELINES:
- Name patterns: Identify cultural/regional origin based on common naming conventions
- Educational institutions: Use university/school names to infer likely citizenship (e.g., Saudi universities → Saudi citizenship likely)
- Profile picture: Use visual presentation style if available
- ALWAYS state which indicator(s) led to your prediction in the explanation
- Be culturally sensitive and acknowledge limitations
- If indicators are mixed or unclear, use "Unknown" and explain why
- Confidence must reflect actual certainty based on available evidence
- Example good explanations: "Name pattern typical of Saudi Arabia" or "Educated at King Fahd University (Saudi institution)" or "Western name pattern without clear regional markers"

Return ONLY this JSON format:
{
  "gender": "Male/Female/Unknown",
  "gender_confidence": 0-100,
  "gender_explanation": "Explanation stating which indicators were used",
  "citizenship": "Country name or Unknown",
  "citizenship_confidence": 0-100,
  "citizenship_explanation": "Explanation stating which indicators were used"
}`
          },
          {
            type: 'image_url',
            image_url: {
              url: profilePicture
            }
          }
        ] : `Analyze demographic indicators for this profile:

Name: ${fullName}
Education History: ${educationSummary || 'Not available'}

Note: No profile picture available. Base predictions ONLY on name patterns and educational institutions.

Based on the name and education history, provide:
1. Gender prediction (Male/Female/Unknown)
2. Confidence score (0-100) - BE STRICT: Without photo, max 75% even for culturally clear names
3. Explanation (max 30 words) - MUST specify which indicators were used
4. Citizenship/nationality prediction  
5. Citizenship confidence score (0-100) - Focus on education institutions as primary indicator
6. Citizenship explanation (max 30 words) - MUST specify which indicators were used

CRITICAL GUIDELINES:
- Name patterns: Identify cultural/regional patterns but acknowledge uncertainty without photo
- Educational institutions: PRIMARY indicator for citizenship (e.g., "King Saud University" → likely Saudi)
- Without photo, be MORE conservative - explain this limitation
- ALWAYS state which indicator(s) you used in your explanation
- If education history is empty and name is ambiguous, use "Unknown" 
- Example good explanations: "Name pattern suggests Saudi origin, but no photo to confirm" or "Educated at [specific institution] in Saudi Arabia"

Return ONLY this JSON format:
{
  "gender": "Male/Female/Unknown",
  "gender_confidence": 0-100,
  "gender_explanation": "Explanation stating which indicators were used and noting lack of photo",
  "citizenship": "Country name or Unknown",
  "citizenship_confidence": 0-100,
  "citizenship_explanation": "Explanation stating which indicators were used (especially education institutions)"
}`
      }
    ];

    console.log('Calling OpenRouter for demographic analysis...');
    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': SUPABASE_URL,
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages,
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('OpenRouter API error:', aiResponse.status, errorText);
      throw new Error(`OpenRouter API failed: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    console.log('OpenRouter response received');
    
    const aiContent = aiData.choices[0].message.content;
    console.log('AI content:', aiContent);
    
    // Extract JSON from response - try multiple patterns
    let analysis;
    try {
      // First try: look for JSON in code blocks
      const jsonMatch = aiContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[1]);
      } else {
        // Second try: look for JSON object in the text
        const jsonObjectMatch = aiContent.match(/\{[\s\S]*\}/);
        if (jsonObjectMatch) {
          analysis = JSON.parse(jsonObjectMatch[0]);
        } else {
          // Third try: parse the entire content as JSON
          analysis = JSON.parse(aiContent);
        }
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw AI content:', aiContent);
      throw new Error('Failed to parse AI analysis response');
    }

    // Validate required fields
    if (!analysis.gender || !analysis.citizenship) {
      console.error('Invalid analysis structure:', analysis);
      throw new Error('AI response missing required fields');
    }

    // Update candidate with analysis
    const { error: updateError } = await supabase
      .from('candidates')
      .update({
        gender: analysis.gender,
        gender_confidence: analysis.gender_confidence,
        gender_explanation: analysis.gender_explanation,
        citizenship: analysis.citizenship,
        citizenship_confidence: analysis.citizenship_confidence,
        citizenship_explanation: analysis.citizenship_explanation
      })
      .eq('id', candidateId);

    if (updateError) {
      console.error('Error updating candidate:', updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-demographics:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const statusCode = errorMessage.includes('not found') ? 404 : 
                       errorMessage.includes('not configured') ? 503 : 500;
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

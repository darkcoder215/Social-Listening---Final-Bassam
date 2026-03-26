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

    console.log('Enriching candidate:', candidateId);

    const APIFY_API_TOKEN = Deno.env.get('APIFY_API_TOKEN');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!APIFY_API_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
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

    // Fetch candidate
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', candidateId)
      .eq('user_id', user.id)
      .single();

    if (candidateError) {
      console.error('Error fetching candidate:', candidateError);
      throw new Error('Candidate not found');
    }

    console.log('Starting enrichment for:', candidate.name);

    // Call Apify to enrich the profile
    const actorId = 'dev_fusion~linkedin-profile-scraper';
    console.log('Using Apify actor:', actorId);

    const apifyResponse = await fetch(
      `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_API_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileUrls: [candidate.linkedin_url],
        }),
      }
    );

    if (!apifyResponse.ok) {
      const errorText = await apifyResponse.text();
      console.error('Apify error:', apifyResponse.status, errorText);
      throw new Error(`Apify enrichment failed: ${apifyResponse.status} ${errorText}`);
    }

    const enrichedProfiles = await apifyResponse.json();
    console.log('Received enriched profiles:', enrichedProfiles.length);

    if (!enrichedProfiles || enrichedProfiles.length === 0) {
      throw new Error('No profile data returned from Apify');
    }

    const enrichedProfile = enrichedProfiles[0];
    
    if (!enrichedProfile || !enrichedProfile.fullName) {
      throw new Error('Invalid profile data received from Apify');
    }

    console.log('✓ Enriched profile for:', enrichedProfile.fullName);

    // Update candidate with enriched profile
    const { error: updateError } = await supabase
      .from('candidates')
      .update({
        enriched_profile: enrichedProfile,
        updated_at: new Date().toISOString()
      })
      .eq('id', candidateId);

    if (updateError) {
      console.error('Error updating candidate:', updateError);
      throw new Error('Failed to save enriched profile');
    }

    console.log('✓ Successfully enriched candidate:', candidate.name);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Candidate enriched successfully',
        enrichedProfile
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in enrich-candidate function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

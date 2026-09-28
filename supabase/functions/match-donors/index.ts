// Supabase Edge Function: match-donors
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { blood_group, component, latitude, longitude, max_distance_km, limit } = await req.json();

    // Call stored procedure match_potential_donors
    const { data: matches, error: rpcError } = await supabaseClient.rpc('match_potential_donors', {
      p_blood_group: blood_group,
      p_component: component || 'WHOLE_BLOOD',
      p_latitude: latitude,
      p_longitude: longitude,
      p_max_distance_km: max_distance_km || 30.0,
      p_limit: limit || 10,
    });

    if (rpcError) throw rpcError;

    // Apply Privacy Masking: Obfuscate donor exact coordinates for public projection
    const privacyPreservedCandidates = (matches || []).map((cand: any) => ({
      donor_profile_id: cand.donor_profile_id,
      blood_group: cand.blood_group,
      approx_distance_km: Math.round(cand.distance_km * 10) / 10,
      availability_status: cand.availability_status,
      total_donations_count: cand.total_donations_count,
      match_label: 'Potential Donor Match', // NEVER "Medically Approved Donor"
    }));

    return new Response(JSON.stringify({ success: true, candidates: privacyPreservedCandidates }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

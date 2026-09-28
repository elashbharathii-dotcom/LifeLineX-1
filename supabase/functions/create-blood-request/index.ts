// Supabase Edge Function: create-blood-request
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

    const { hospital_id, blood_group, component, units_needed, urgency, clinical_notes } = await req.json();

    const requestCode = `BLD-${Date.now().toString().slice(-6)}`;
    const requiredBy = new Date(Date.now() + 4 * 3600 * 1000).toISOString();

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    const { data: request, error: insertError } = await supabaseClient
      .from('blood_requests')
      .insert({
        request_code: requestCode,
        hospital_id,
        requested_by: profile?.id,
        blood_group,
        component: component || 'WHOLE_BLOOD',
        units_needed: units_needed || 1,
        urgency: urgency || 'CRITICAL',
        status: 'SEARCHING',
        required_by_time: requiredBy,
        clinical_notes,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ success: true, request }), {
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

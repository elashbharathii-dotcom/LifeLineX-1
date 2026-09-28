// Supabase Edge Function: update-ambulance-location
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

    const { ambulance_id, latitude, longitude, heading, speed_kmh, timestamp } = await req.json();

    // Verify telemetry freshness (reject stale GPS > 30s)
    if (timestamp && Date.now() - timestamp > 30000) {
      return new Response(JSON.stringify({ error: 'Stale telemetry rejected (>30s)' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data, error } = await supabaseClient
      .from('ambulances')
      .update({
        current_latitude: latitude,
        current_longitude: longitude,
        current_heading: heading || 0,
        current_speed_kmh: speed_kmh || 0,
        last_gps_update: new Date().toISOString(),
      })
      .eq('id', ambulance_id)
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, ambulance: data }), {
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

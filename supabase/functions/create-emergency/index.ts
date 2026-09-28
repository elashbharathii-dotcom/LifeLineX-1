// Supabase Edge Function: create-emergency
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

    const { latitude, longitude, accuracy_meters, triage_notes } = await req.json();

    if (!latitude || !longitude) {
      return new Response(JSON.stringify({ error: 'Valid latitude and longitude are required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get user profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    const sessionCode = `EMG-${Date.now().toString().slice(-6)}`;

    // Query nearest verified hospital using PostGIS/Haversine
    const { data: hospitals } = await supabaseClient
      .from('hospitals')
      .select('id, name, latitude, longitude')
      .eq('verification_status', 'VERIFIED')
      .eq('is_active', true);

    let nearestHospitalId = null;
    let minDistance = Infinity;

    if (hospitals && hospitals.length > 0) {
      for (const h of hospitals) {
        const dLat = (h.latitude - latitude) * (Math.PI / 180);
        const dLon = (h.longitude - longitude) * (Math.PI / 180);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(latitude * (Math.PI / 180)) * Math.cos(h.latitude * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
        const d = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        if (d < minDistance) {
          minDistance = d;
          nearestHospitalId = h.id;
        }
      }
    }

    // Insert emergency session
    const { data: session, error: insertError } = await supabaseClient
      .from('emergency_sessions')
      .insert({
        session_code: sessionCode,
        patient_profile_id: profile?.id || user.id,
        status: 'LOCATION_CONFIRMED',
        latitude,
        longitude,
        location_accuracy_meters: accuracy_meters || 10,
        address_description: `Emergency GPS: [${latitude.toFixed(4)}, ${longitude.toFixed(4)}]`,
        assigned_hospital_id: nearestHospitalId,
        triage_notes: triage_notes || 'Emergency Trauma SOS Dispatched',
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // Record Event
    await supabaseClient.from('emergency_events').insert({
      emergency_session_id: session.id,
      event_type: 'EMERGENCY_INITIATED',
      status_snapshot: 'LOCATION_CONFIRMED',
      title: 'Emergency SOS Confirmed',
      description: `GPS coordinates locked within ±${accuracy_meters || 10}m. Nearest trauma facility identified (~${minDistance.toFixed(1)} km).`,
      actor_id: profile?.id,
      actor_role: 'PATIENT',
    });

    return new Response(JSON.stringify({ success: true, session }), {
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

// Supabase Edge Function: book-appointment
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

    const { appointment_type, facility_type, facility_id, facility_name, doctor_id, appointment_date, start_time, notes } = await req.json();

    const { data: profile } = await supabaseClient.from('profiles').select('id').eq('auth_user_id', user.id).single();

    // Call stored procedure book_appointment_slot_atomic
    const { data, error } = await supabaseClient.rpc('book_appointment_slot_atomic', {
      p_patient_profile_id: profile?.id || user.id,
      p_appointment_type: appointment_type,
      p_facility_type: facility_type,
      p_facility_id: facility_id,
      p_facility_name: facility_name,
      p_doctor_id: doctor_id || null,
      p_appointment_date: appointment_date,
      p_start_time: start_time,
      p_notes: notes || null,
    });

    if (error) throw error;
    if (!data.success) {
      return new Response(JSON.stringify({ error: data.error }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: true, appointment: data }), {
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

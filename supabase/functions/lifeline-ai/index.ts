// Supabase Edge Function: lifeline-ai
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Medical safety guardrails - NO diagnosis, NO prescriptions
const FORBIDDEN_PATTERNS = [
  /prescri(be|ption)/i, /diagnos/i, /cure\s+my/i, /dose\s+of/i,
  /what\s+drug/i, /medical\s+advice/i, /should\s+i\s+take/i,
  /medication\s+for/i, /inject/i, /what\s+antibiotic/i,
];

// Forbidden cross-user data requests
const CROSS_TENANT_PATTERNS = [
  /other\s+patient/i, /another\s+user/i, /show\s+me\s+.*patient/i,
  /access\s+.*records/i, /all\s+users/i, /everyone's/i,
];

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

    const { message, context } = await req.json();

    // GUARDRAIL 1: Block medical prescriptions/diagnoses
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(message)) {
        return new Response(JSON.stringify({
          success: true,
          response: '⚠️ Medical Guardrail Active: Lifeline AI is an emergency coordination assistant only. It cannot diagnose medical conditions, recommend prescriptions, or determine clinical eligibility. Please consult a qualified healthcare professional at the assigned facility.',
          guardrail_triggered: 'MEDICAL_SAFETY',
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }
    }

    // GUARDRAIL 2: Block cross-user data requests
    for (const pattern of CROSS_TENANT_PATTERNS) {
      if (pattern.test(message)) {
        return new Response(JSON.stringify({
          success: true,
          response: '🔒 Access Denied: Lifeline AI cannot access other users\' information. All data access is restricted to your own authorized records.',
          guardrail_triggered: 'CROSS_TENANT_ACCESS',
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }
    }

    // Fetch only current user's authorized context
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('id, full_name, primary_role')
      .eq('auth_user_id', user.id)
      .single();

    // Return safe coordination response
    const response = buildCoordinationResponse(message, profile, context);

    return new Response(JSON.stringify({ success: true, response, profile_context: profile?.primary_role }), {
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

function buildCoordinationResponse(message: string, _profile: any, _context: any): string {
  const m = message.toLowerCase();
  if (m.includes('emergency status') || m.includes('my emergency')) {
    return `Your emergency session status is available in the Emergency tab. I can help you understand each stage of the coordination workflow.`;
  }
  if (m.includes('ambulance') || m.includes('vehicle')) {
    return `Ambulance tracking is shown on your Patient Map once a vehicle has been assigned. Live GPS updates every 10–15 seconds.`;
  }
  if (m.includes('blood request') || m.includes('blood status')) {
    return `Your blood request is being processed. The Donor Chain system will notify eligible donors. Hospital staff at your assigned facility manage the clinical coordination.`;
  }
  if (m.includes('appointment')) {
    return `Your appointments are listed in the Appointments tab. You can book, cancel, or reschedule from there.`;
  }
  if (m.includes('hospital') || m.includes('nearest')) {
    return `The nearest verified hospital with trauma capabilities has been automatically identified from your GPS coordinates and assigned to your emergency session.`;
  }
  return `I'm the Lifeline AI coordination assistant. I can help you understand your emergency status, ambulance tracking, blood request progress, and appointment information. For medical advice, please consult the healthcare professionals at your assigned facility.`;
}

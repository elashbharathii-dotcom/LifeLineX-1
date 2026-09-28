// Supabase Edge Function: process-verification
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
    // Edge Function uses Service Role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify caller is LIFELINEX_ADMIN via user JWT
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Only LIFELINEX_ADMIN or SUPER_ADMIN may process verifications
    const { data: roleCheck } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['LIFELINEX_ADMIN', 'SUPER_ADMIN'])
      .single();

    if (!roleCheck) {
      return new Response(JSON.stringify({ error: '403 Forbidden: Insufficient administrative privileges' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { entity_type, entity_id, decision, reviewer_notes } = await req.json();
    if (!['APPROVED', 'REJECTED'].includes(decision)) {
      return new Response(JSON.stringify({ error: 'Decision must be APPROVED or REJECTED' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Update the appropriate verification table
    const tableMap: Record<string, string> = {
      DONOR: 'donor_verifications',
      HOSPITAL: 'hospital_verifications',
      BLOOD_BANK: 'blood_bank_verifications',
      AMBULANCE_PROVIDER: 'ambulance_provider_verifications',
    };

    const table = tableMap[entity_type];
    if (!table) {
      return new Response(JSON.stringify({ error: 'Invalid entity_type' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data, error } = await supabaseAdmin
      .from(table)
      .update({
        verification_status: decision,
        reviewer_id: user.id,
        reviewer_notes: reviewer_notes || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('entity_id', entity_id)
      .select()
      .single();

    if (error) throw error;

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      actor_id: user.id,
      action: `VERIFICATION_${decision}`,
      entity_name: table,
      entity_id: entity_id,
      new_state: { status: decision },
    });

    return new Response(JSON.stringify({ success: true, verification: data }), {
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

// Supabase Edge Function: process-donor-response
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

    const { member_id, accepted, rejection_reason } = await req.json();

    const { data: member, error: memberError } = await supabaseClient
      .from('donor_chain_members')
      .update({
        status: accepted ? 'ACCEPTED' : 'DECLINED',
        responded_at: new Date().toISOString(),
        rejection_reason: accepted ? null : rejection_reason,
      })
      .eq('id', member_id)
      .select()
      .single();

    if (memberError) throw memberError;

    if (accepted) {
      // Lock Donor Chain status to SECURED
      await supabaseClient
        .from('donor_chains')
        .update({ status: 'SECURED' })
        .eq('id', member.donor_chain_id);
    }

    return new Response(JSON.stringify({ success: true, member }), {
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

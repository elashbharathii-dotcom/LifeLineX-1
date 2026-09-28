// Supabase Edge Function: start-donor-chain
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

    const { blood_request_id, batch_size, timeout_minutes } = await req.json();

    // Create Donor Chain
    const { data: chain, error: chainError } = await supabaseClient
      .from('donor_chains')
      .insert({
        blood_request_id,
        status: 'DISPATCHING',
        current_tier: 1,
        batch_size: batch_size || 3,
        response_timeout_minutes: timeout_minutes || 15,
        auto_escalate: true,
      })
      .select()
      .single();

    if (chainError) throw chainError;

    // Log Chain Event
    await supabaseClient.from('donor_chain_events').insert({
      donor_chain_id: chain.id,
      event_type: 'CHAIN_INITIATED',
      details: { tier: 1, batch_size: batch_size || 3 },
    });

    return new Response(JSON.stringify({ success: true, chain }), {
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

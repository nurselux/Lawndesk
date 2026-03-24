import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders });

  const { to, message } = await req.json();

  if (!to || !message) {
    return new Response(JSON.stringify({ error: 'Missing to or message' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const [{ data: TWILIO_ACCOUNT_SID }, { data: TWILIO_AUTH_TOKEN }, { data: TWILIO_PHONE_NUMBER }] = await Promise.all([
    supabase.rpc('get_secret', { secret_name: 'TWILIO_ACCOUNT_SID' }),
    supabase.rpc('get_secret', { secret_name: 'TWILIO_AUTH_TOKEN' }),
    supabase.rpc('get_secret', { secret_name: 'TWILIO_PHONE_NUMBER' }),
  ]);

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    return new Response(JSON.stringify({ error: 'Twilio credentials not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: to, From: TWILIO_PHONE_NUMBER, Body: message }).toString(),
  });

  const result = await res.json();

  if (!res.ok) {
    return new Response(JSON.stringify({ error: result }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true, sid: result.sid }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});

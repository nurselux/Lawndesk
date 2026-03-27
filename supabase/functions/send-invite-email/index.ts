import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  const { email, inviteLink, adminName } = await req.json();

  if (!email || !inviteLink) {
    return new Response(JSON.stringify({ error: 'Missing email or inviteLink' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: RESEND_API_KEY } = await supabase.rpc('get_secret', { secret_name: 'RESEND_API_KEY' });

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not found' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'LawnDesk <noreply@lawndesk.pro>',
      reply_to: 'support@lawndesk.pro',
      to: [email],
      subject: `You've been invited to join LawnDesk`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
          <h1 style="color: #15803d; font-size: 28px; margin-bottom: 4px;">🌿 LawnDesk</h1>
          <p style="color: #6b7280; margin-top: 0;">Less paperwork, more yardwork</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <h2 style="color: #111827; font-size: 20px;">You've been invited to join a team</h2>
          <p style="color: #374151;">${adminName ? `<strong>${adminName}</strong> has invited you` : 'You have been invited'} to join their crew on LawnDesk.</p>
          <p style="color: #374151;">Click the button below to set up your worker account.</p>
          <a href="${inviteLink}" style="display: inline-block; background: #15803d; color: white; font-weight: bold; padding: 14px 28px; border-radius: 10px; text-decoration: none; margin: 16px 0;">Accept Invite &amp; Create Account</a>
          <p style="color: #9ca3af; font-size: 13px; margin-top: 24px;">Or copy this link:<br/><span style="color: #374151;">${inviteLink}</span></p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">If you weren't expecting this, you can ignore this email.</p>
        </div>
      `,
    }),
  });

  const result = await res.json();

  if (!res.ok) {
    return new Response(JSON.stringify({ error: result }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});

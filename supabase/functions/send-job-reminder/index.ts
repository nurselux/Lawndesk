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

  const { clientName, clientEmail, clientPhone, jobTitle, jobDate, jobTime, businessName } = await req.json();

  if (!clientName || (!clientEmail && !clientPhone)) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const fromBusiness = businessName || 'Your lawn care provider';
  const dateStr = jobDate ? new Date(jobDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : jobDate;
  const timeStr = jobTime ? ` at ${jobTime}` : '';

  const results: Record<string, unknown> = {};

  // Send SMS via Twilio
  if (clientPhone) {
    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
    const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
      const msg = `Hi ${clientName}! Just a heads up — ${fromBusiness} is scheduled to service your property on ${dateStr}${timeStr}. See you then! 🌿`;
      const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
      const smsRes = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: clientPhone, From: TWILIO_PHONE_NUMBER, Body: msg }).toString(),
      });
      const smsData = await smsRes.json();
      results.sms = smsRes.ok ? { success: true, sid: smsData.sid } : { error: smsData };
    }
  }

  // Send email via Resend
  if (clientEmail) {
    const { data: RESEND_API_KEY } = await supabase.rpc('get_secret', { secret_name: 'RESEND_API_KEY' });
    if (RESEND_API_KEY) {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: `${fromBusiness} <noreply@lawndesk.pro>`,
          reply_to: 'support@lawndesk.pro',
          to: [clientEmail],
          subject: `Upcoming service: ${jobTitle || 'Lawn care'} on ${dateStr}`,
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
              <h1 style="color:#15803d;font-size:26px;margin-bottom:4px;">🌿 LawnDesk</h1>
              <p style="color:#6b7280;margin-top:0;font-size:13px;">Less paperwork, more yardwork</p>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;"/>
              <p style="color:#374151;margin:0 0 8px 0;">Hi ${clientName},</p>
              <p style="color:#374151;margin:0 0 20px 0;">
                This is a friendly reminder that <strong>${fromBusiness}</strong> is scheduled to service your property.
              </p>
              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:24px;">
                <p style="color:#15803d;font-size:18px;font-weight:bold;margin:0 0 8px 0;">📅 ${dateStr}${timeStr}</p>
                <p style="color:#374151;margin:0;">${jobTitle || 'Lawn care service'}</p>
              </div>
              <p style="color:#6b7280;font-size:13px;">No action needed — we'll take care of everything. You'll receive an invoice once the work is complete.</p>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>
              <p style="color:#9ca3af;font-size:12px;">Sent via LawnDesk · <a href="https://lawndesk.pro" style="color:#9ca3af;">lawndesk.pro</a></p>
            </div>
          `,
        }),
      });
      const emailData = await emailRes.json();
      results.email = emailRes.ok ? { success: true } : { error: emailData };
    }
  }

  return new Response(JSON.stringify({ success: true, results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});

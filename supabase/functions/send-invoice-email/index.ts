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

  const { recipientEmail, recipientName, invoiceNumber, amount, description, dueDate, invoiceLink, businessName } = await req.json();

  if (!recipientEmail || !invoiceLink) {
    return new Response(JSON.stringify({ error: 'Missing recipientEmail or invoiceLink' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: RESEND_API_KEY } = await supabase.rpc('get_secret', { secret_name: 'RESEND_API_KEY' });

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not found' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const invNum = invoiceNumber ? `INV-${String(invoiceNumber).padStart(3, '0')}` : 'Invoice';
  const fromBusiness = businessName || 'LawnDesk';
  const greeting = recipientName ? `Hi ${recipientName},` : 'Hi,';
  const dueLine = dueDate ? `<p style="color:#374151;margin:0 0 12px 0;">Due by: <strong>${dueDate}</strong></p>` : '';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'LawnDesk <noreply@lawndesk.pro>',
      to: [recipientEmail],
      subject: `${invNum} from ${fromBusiness} — $${Number(amount).toFixed(2)} due`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
          <h1 style="color:#15803d;font-size:26px;margin-bottom:4px;">🌿 LawnDesk</h1>
          <p style="color:#6b7280;margin-top:0;font-size:13px;">Less paperwork, more yardwork</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;"/>
          <p style="color:#374151;margin:0 0 8px 0;">${greeting}</p>
          <p style="color:#374151;margin:0 0 20px 0;">You have a new invoice from <strong>${fromBusiness}</strong>.</p>
          <div style="background:#f9fafb;border-radius:12px;padding:20px;margin-bottom:20px;">
            <p style="color:#6b7280;font-size:12px;font-family:monospace;margin:0 0 4px 0;">${invNum}</p>
            <p style="color:#111827;font-size:32px;font-weight:bold;margin:0 0 8px 0;">$${Number(amount).toFixed(2)}</p>
            ${description ? `<p style="color:#374151;margin:0 0 12px 0;">${description}</p>` : ''}
            ${dueLine}
          </div>
          <a href="${invoiceLink}" style="display:inline-block;background:#15803d;color:#fff;font-weight:bold;padding:14px 32px;border-radius:10px;text-decoration:none;font-size:16px;">View &amp; Pay Invoice →</a>
          <p style="color:#9ca3af;font-size:12px;margin-top:24px;">Or open this link:<br/><span style="color:#374151;">${invoiceLink}</span></p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>
          <p style="color:#9ca3af;font-size:12px;">Sent via LawnDesk · <a href="https://lawndesk.pro" style="color:#9ca3af;">lawndesk.pro</a></p>
        </div>
      `,
    }),
  });

  const result = await res.json();
  if (!res.ok) {
    return new Response(JSON.stringify({ error: result }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});

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

  const { recipientEmail, recipientName, quoteTitle, amount, description, lineItems, expiresAt, quoteLink, businessName, portalLink } = await req.json();

  if (!recipientEmail || !quoteLink) {
    return new Response(JSON.stringify({ error: 'Missing recipientEmail or quoteLink' }), {
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

  const fromBusiness = businessName || 'LawnDesk';
  const greeting = recipientName ? `Hi ${recipientName},` : 'Hi,';
  const expLine = expiresAt ? `<p style="color:#6b7280;font-size:13px;margin:0 0 16px 0;">This quote is valid until <strong>${expiresAt}</strong>.</p>` : '';

  const lineItemsHtml = lineItems?.length ? `
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px;">
      <thead>
        <tr style="border-bottom:2px solid #e5e7eb;">
          <th style="text-align:left;padding:6px 0;color:#6b7280;font-weight:600;">Description</th>
          <th style="text-align:right;padding:6px 0;color:#6b7280;font-weight:600;">Qty</th>
          <th style="text-align:right;padding:6px 0;color:#6b7280;font-weight:600;">Price</th>
          <th style="text-align:right;padding:6px 0;color:#6b7280;font-weight:600;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${lineItems.map((item: any) => `
          <tr style="border-bottom:1px solid #f3f4f6;">
            <td style="padding:8px 0;color:#111827;">${item.description}</td>
            <td style="padding:8px 0;text-align:right;color:#374151;">${item.quantity}</td>
            <td style="padding:8px 0;text-align:right;color:#374151;">$${Number(item.unit_price).toFixed(2)}</td>
            <td style="padding:8px 0;text-align:right;font-weight:600;color:#111827;">$${(item.quantity * item.unit_price).toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : '';

  const portalSection = portalLink ? `
    <p style="color:#6b7280;font-size:13px;margin:24px 0 8px 0;">Want to view all your quotes and invoices?</p>
    <a href="${portalLink}" style="color:#7c3aed;font-size:13px;text-decoration:underline;">Access your client portal →</a>
  ` : '';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `${fromBusiness} <noreply@lawndesk.pro>`,
      reply_to: 'support@lawndesk.pro',
      to: [recipientEmail],
      subject: `Quote from ${fromBusiness} — $${Number(amount).toFixed(2)}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
          <h1 style="color:#15803d;font-size:26px;margin-bottom:4px;">🌿 LawnDesk</h1>
          <p style="color:#6b7280;margin-top:0;font-size:13px;">Less paperwork, more yardwork</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;"/>
          <p style="color:#374151;margin:0 0 8px 0;">${greeting}</p>
          <p style="color:#374151;margin:0 0 20px 0;"><strong>${fromBusiness}</strong> has sent you a quote.</p>
          <div style="background:#f9fafb;border-radius:12px;padding:20px;margin-bottom:20px;">
            <h2 style="color:#111827;font-size:18px;margin:0 0 4px 0;">${quoteTitle}</h2>
            ${description ? `<p style="color:#6b7280;margin:0 0 16px 0;font-size:14px;">${description}</p>` : ''}
            ${lineItemsHtml}
            <div style="background:#fff;border-radius:8px;padding:12px 16px;border:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;">
              <span style="font-weight:600;color:#374151;">Total Estimate</span>
              <span style="font-size:24px;font-weight:bold;color:#15803d;">$${Number(amount).toFixed(2)}</span>
            </div>
          </div>
          ${expLine}
          <a href="${quoteLink}" style="display:inline-block;background:#15803d;color:#fff;font-weight:bold;padding:14px 32px;border-radius:10px;text-decoration:none;font-size:16px;">Review &amp; Approve Quote →</a>
          <p style="color:#9ca3af;font-size:12px;margin-top:20px;">Or open: <span style="color:#374151;">${quoteLink}</span></p>
          ${portalSection}
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>
          <p style="color:#9ca3af;font-size:12px;">Sent via LawnDesk · <a href="https://lawndesk.pro" style="color:#9ca3af;">lawndesk.pro</a></p>
        </div>
      `,
    }),
  });

  const result = await res.json();
  if (!res.ok) return new Response(JSON.stringify({ error: result }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});

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

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: RESEND_API_KEY } = await supabase.rpc('get_secret', { secret_name: 'RESEND_API_KEY' });

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not found' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Find all jobs scheduled for tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const { data: jobs, error } = await supabase
    .from('Jobs')
    .select('id, user_id, client_name, client_id, title, scheduled_date, scheduled_time, notes')
    .eq('scheduled_date', tomorrowStr)
    .not('status', 'eq', '✅ Completed')
    .not('status', 'eq', '❌ Cancelled');

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!jobs || jobs.length === 0) {
    return new Response(JSON.stringify({ success: true, sent: 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Collect unique user_ids to fetch their business names
  const userIds = [...new Set(jobs.map((j: any) => j.user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, business_name')
    .in('id', userIds);

  const businessMap: Record<string, string> = {};
  if (profiles) {
    for (const p of profiles) {
      businessMap[p.id] = p.business_name || 'Your lawn care provider';
    }
  }

  // Collect client emails — fetch from Clients table for jobs that have a client_id
  const clientIds = jobs.filter((j: any) => j.client_id).map((j: any) => j.client_id);
  const { data: clients } = clientIds.length > 0
    ? await supabase.from('Clients').select('id, name, email, phone').in('id', clientIds)
    : { data: [] };

  const clientMap: Record<string, { email: string | null; phone: string | null }> = {};
  if (clients) {
    for (const c of clients) {
      clientMap[c.id] = { email: c.email, phone: c.phone };
    }
  }

  let sent = 0;
  const errors: string[] = [];

  for (const job of jobs as any[]) {
    const clientContact = job.client_id ? clientMap[job.client_id] : null;
    const clientEmail = clientContact?.email;
    if (!clientEmail) continue;

    const businessName = businessMap[job.user_id] || 'Your lawn care provider';
    const dateStr = new Date(tomorrowStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
    });
    const timeStr = job.scheduled_time ? ` at ${job.scheduled_time}` : '';

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `${businessName} <noreply@lawndesk.pro>`,
        reply_to: 'support@lawndesk.pro',
        to: [clientEmail],
        subject: `Upcoming service: ${job.title || 'Lawn care'} on ${dateStr}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
            <h1 style="color:#15803d;font-size:26px;margin-bottom:4px;">🌿 LawnDesk</h1>
            <p style="color:#6b7280;margin-top:0;font-size:13px;">Less paperwork, more yardwork</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;"/>
            <p style="color:#374151;margin:0 0 8px 0;">Hi ${job.client_name},</p>
            <p style="color:#374151;margin:0 0 20px 0;">
              This is a friendly reminder that <strong>${businessName}</strong> is scheduled to service your property tomorrow.
            </p>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:24px;">
              <p style="color:#15803d;font-size:18px;font-weight:bold;margin:0 0 8px 0;">📅 ${dateStr}${timeStr}</p>
              <p style="color:#374151;margin:0;">${job.title || 'Lawn care service'}</p>
            </div>
            <p style="color:#6b7280;font-size:13px;">No action needed — we'll take care of everything. You'll receive an invoice once the work is complete.</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>
            <p style="color:#9ca3af;font-size:12px;">Sent via LawnDesk · <a href="https://lawndesk.pro" style="color:#9ca3af;">lawndesk.pro</a></p>
          </div>
        `,
      }),
    });

    if (emailRes.ok) {
      sent++;
    } else {
      const errData = await emailRes.json();
      errors.push(`Job ${job.id}: ${JSON.stringify(errData)}`);
    }
  }

  return new Response(JSON.stringify({ success: true, sent, errors }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});

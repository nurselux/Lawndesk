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

  const { workerEmails } = await req.json();

  if (!workerEmails || !Array.isArray(workerEmails) || workerEmails.length === 0) {
    return new Response(JSON.stringify({ error: 'Invalid or empty workerEmails array' }), {
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

  const successfulEmails = [];
  const failedEmails = [];

  // Send email to each worker
  for (const email of workerEmails) {
    try {
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
          subject: 'Your LawnDesk Account Status Update',
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
              <h1 style="color: #15803d; font-size: 28px; margin-bottom: 4px;">🌿 LawnDesk</h1>
              <p style="color: #6b7280; margin-top: 0;">Less paperwork, more yardwork</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
              <h2 style="color: #111827; font-size: 20px;">Account Update</h2>
              <p style="color: #374151;">Your admin account's owner has permanently deleted their account and company.</p>
              <p style="color: #374151;">Your worker account is still active, but you're no longer linked to that company. You can now:</p>
              <ul style="color: #374151;">
                <li>Continue working as an independent contractor</li>
                <li>Create your own business account</li>
                <li>Join another company through an invite link</li>
              </ul>
              <p style="color: #374151;">No action is required on your part. Your account remains secure.</p>
              <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">If you have questions, reply to this email or contact <a href="mailto:support@lawndesk.pro" style="color: #15803d;">support@lawndesk.pro</a></p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
              <p style="color: #9ca3af; font-size: 12px;">© 2026 LawnDesk. All rights reserved.</p>
            </div>
          `,
        }),
      });

      const result = await res.json();

      if (res.ok) {
        successfulEmails.push(email);
      } else {
        console.error(`Failed to send email to ${email}:`, result);
        failedEmails.push({ email, error: result });
      }
    } catch (error) {
      console.error(`Error sending email to ${email}:`, error);
      failedEmails.push({ email, error: String(error) });
    }
  }

  return new Response(JSON.stringify({
    success: true,
    sentCount: successfulEmails.length,
    failedCount: failedEmails.length,
    successful: successfulEmails,
    failed: failedEmails,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});

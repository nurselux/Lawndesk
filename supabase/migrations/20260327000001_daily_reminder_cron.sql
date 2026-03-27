-- Schedule daily job reminders via pg_cron + pg_net
-- Prerequisites: enable pg_cron and pg_net extensions in Supabase Dashboard → Database → Extensions
-- The service role key must be set: ALTER DATABASE postgres SET app.settings.service_role_key = '<your-service-role-key>';
--
-- Alternative: set up the schedule directly in Supabase Dashboard → Edge Functions → send-daily-reminders → Add schedule: 0 8 * * *

DO $$
BEGIN
  -- Only schedule if pg_cron extension is available
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'daily-job-reminders',
      '0 8 * * *',
      $cron$
      SELECT net.http_post(
        url := 'https://jxsodtvsebtgipgqtdgl.supabase.co/functions/v1/send-daily-reminders',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := '{}'::jsonb
      )
      $cron$
    );
    RAISE NOTICE 'daily-job-reminders cron job scheduled';
  ELSE
    RAISE NOTICE 'pg_cron not enabled — set up schedule manually via Supabase Dashboard';
  END IF;
END $$;

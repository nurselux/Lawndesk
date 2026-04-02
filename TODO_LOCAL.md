# TODO — Local Environment Setup Required

## 1. Add CRON_SECRET to Vercel

Generate a secret and add it as an environment variable in Vercel:

```bash
openssl rand -hex 32   # copy the output
vercel env add CRON_SECRET production
```

Or via Vercel Dashboard → Project → Settings → Environment Variables → add `CRON_SECRET`.

Then redeploy for it to take effect.

## 2. Run Supabase Migrations

Run both of the following (or just `supabase db push` to apply all pending migrations at once):

```bash
supabase db push
```

### Migration 1 — `twilio_number_sid` on profiles
Needed for Twilio number reclamation on trial expiry.

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS twilio_number_sid text;
```

### Migration 2 — `estimates` table + `address` on booking_requests
Needed for the new Estimates workflow (Request → Estimate → Quote → Job).

```sql
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS address TEXT;

CREATE TABLE IF NOT EXISTS estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_email TEXT,
  service_type TEXT NOT NULL,
  address TEXT,
  scheduled_date DATE,
  scheduled_time TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_from_request_id UUID REFERENCES booking_requests(id) ON DELETE SET NULL,
  quote_id UUID,
  converted_to_job_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners manage estimates" ON estimates
  FOR ALL USING (user_id = auth.uid());
```

### Migration 3 — `scheduled_date` + `scheduled_time` + `deleted_at` on booking_requests
Needed so "Schedule Visit" on the Requests page can persist the chosen date/time and soft-delete works.

```sql
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS scheduled_date DATE;
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS scheduled_time TEXT;
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
```

Once applied, the Schedule Visit form will save the date and time to the DB (currently it only updates the status to `approved` and discards the date/time).

---

**Why these matter:**
- `CRON_SECRET` — without it, the daily `/api/cron/expire-trials` job returns 401 and never runs
- Migration 1 — without it, provisioning an AI receptionist number throws a DB error
- Migration 2 — without it, the new `/estimates` page and approving requests will fail
- Migration 3 — without it, Schedule Visit discards the date/time and soft-delete (🗑️) on requests silently fails

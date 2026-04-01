# TODO — Local Environment Setup Required

## 1. Add CRON_SECRET to Vercel

Generate a secret and add it as an environment variable in Vercel:

```bash
openssl rand -hex 32   # copy the output
vercel env add CRON_SECRET production
```

Or via Vercel Dashboard → Project → Settings → Environment Variables → add `CRON_SECRET`.

Then redeploy for it to take effect.

## 2. Run Supabase Migration

Adds the `twilio_number_sid` column to the `profiles` table (needed for Twilio number reclamation on trial expiry).

```bash
supabase db push
```

Or paste directly in Supabase Dashboard → SQL Editor:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS twilio_number_sid text;
```

---

**Why these matter:**
- `CRON_SECRET` — without it, the daily `/api/cron/expire-trials` job won't run (returns 401)
- Migration — without it, provisioning a number will throw a DB error trying to write `twilio_number_sid`

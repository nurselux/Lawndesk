-- Add client contact fields to Invoices for direct send
ALTER TABLE public."Invoices" ADD COLUMN IF NOT EXISTS client_email text;
ALTER TABLE public."Invoices" ADD COLUMN IF NOT EXISTS client_phone text;

-- Add RBAC fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preset_role text DEFAULT 'worker_limited';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{
  "see_all_jobs": false,
  "see_pricing": false,
  "can_edit_jobs": false,
  "see_clients_nav": false,
  "see_clients_detail": "name_address_only",
  "see_invoices": false,
  "see_quotes": false,
  "see_reports": false
}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hourly_rate numeric(10,2);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address text;

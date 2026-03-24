-- Add client contact fields to Quotes (needed for portal + direct send)
ALTER TABLE public."Quotes" ADD COLUMN IF NOT EXISTS client_email text;
ALTER TABLE public."Quotes" ADD COLUMN IF NOT EXISTS client_phone text;

-- Portal: allow authenticated clients to read their own quotes by email
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'quotes_portal_client' AND tablename = 'Quotes') THEN
    CREATE POLICY "quotes_portal_client" ON public."Quotes"
      FOR SELECT USING (auth.uid() IS NOT NULL AND auth.jwt()->>'email' = client_email);
  END IF;
END $$;

-- Portal: allow authenticated clients to read their own invoices by email
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'invoices_portal_client' AND tablename = 'Invoices') THEN
    CREATE POLICY "invoices_portal_client" ON public."Invoices"
      FOR SELECT USING (auth.uid() IS NOT NULL AND auth.jwt()->>'email' = client_email);
  END IF;
END $$;

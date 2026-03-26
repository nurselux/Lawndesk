ALTER TABLE profiles ADD COLUMN IF NOT EXISTS booking_username TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS booking_enabled BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS booking_notify_sms BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS booking_notify_email BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS booking_welcome_message TEXT;

CREATE TABLE IF NOT EXISTS booking_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT NOT NULL,
  service_type TEXT NOT NULL,
  preferred_date DATE,
  preferred_time TIME,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE booking_requests ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'booking_requests' AND policyname = 'owners can manage their requests'
  ) THEN
    CREATE POLICY "owners can manage their requests" ON booking_requests
      FOR ALL USING (owner_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'booking_requests' AND policyname = 'anyone can insert booking request'
  ) THEN
    CREATE POLICY "anyone can insert booking request" ON booking_requests
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

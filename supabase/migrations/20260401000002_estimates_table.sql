-- Add address to booking_requests for site visit navigation
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS address TEXT;

-- Estimates table: tracks site visits between a booking request and a job
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

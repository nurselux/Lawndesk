-- Advanced booking page settings on profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS booking_min_lead_hours   integer DEFAULT 24,
  ADD COLUMN IF NOT EXISTS booking_ask_fence         boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS booking_ask_pets          boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS booking_allow_frequency   boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS booking_arrival_windows   text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS booking_service_zip       text,
  ADD COLUMN IF NOT EXISTS booking_service_radius    integer,
  ADD COLUMN IF NOT EXISTS booking_cancellation_policy text,
  ADD COLUMN IF NOT EXISTS booking_photo_url         text;

-- Capture new client-side fields on booking requests
ALTER TABLE booking_requests
  ADD COLUMN IF NOT EXISTS has_fence         boolean,
  ADD COLUMN IF NOT EXISTS has_pets          boolean,
  ADD COLUMN IF NOT EXISTS service_frequency text,
  ADD COLUMN IF NOT EXISTS arrival_window    text,
  ADD COLUMN IF NOT EXISTS outside_service_area boolean DEFAULT false;

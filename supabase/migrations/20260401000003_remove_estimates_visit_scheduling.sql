-- Remove estimates table (feature consolidated into booking_requests)
DROP TABLE IF EXISTS estimates CASCADE;

-- Add visit scheduling columns to booking_requests
ALTER TABLE booking_requests
  ADD COLUMN IF NOT EXISTS scheduled_date DATE,
  ADD COLUMN IF NOT EXISTS scheduled_time TEXT;

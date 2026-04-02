-- Soft delete support for booking requests
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

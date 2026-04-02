-- Track which booking request has had a quote created, for accurate "awaiting quote" count
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES "Quotes"(id) ON DELETE SET NULL;

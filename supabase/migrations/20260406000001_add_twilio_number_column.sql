-- Track the E.164 phone number assigned to this owner in Twilio
-- Used by the AI receptionist to look up which business owns an incoming call
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS twilio_number text;

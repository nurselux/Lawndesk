-- SMS consent for carrier compliance
-- Users must explicitly opt-in to receive SMS messages
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sms_consent BOOLEAN NOT NULL DEFAULT false;
-- Track when consent was given
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sms_consent_at TIMESTAMPTZ;

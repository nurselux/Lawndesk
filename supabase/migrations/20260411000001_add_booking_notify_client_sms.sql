ALTER TABLE profiles ADD COLUMN IF NOT EXISTS booking_notify_client_sms BOOLEAN DEFAULT true;

-- AI Receptionist SMS notification preferences
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_notify_owner BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_text_caller BOOLEAN NOT NULL DEFAULT true;

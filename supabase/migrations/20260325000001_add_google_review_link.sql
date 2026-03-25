-- Add Google Review Link to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_review_link TEXT;

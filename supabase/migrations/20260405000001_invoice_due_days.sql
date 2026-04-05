-- Add default invoice due days to profiles
-- Owners can set their preferred payment terms (Net 7, 15, 30, 60)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS invoice_due_days integer DEFAULT 15;

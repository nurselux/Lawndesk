-- Add worker assignment to Jobs table
ALTER TABLE "Jobs" ADD COLUMN IF NOT EXISTS assigned_to UUID;

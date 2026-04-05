-- Add line items, notes, and tax rate to invoices
ALTER TABLE "Invoices"
  ADD COLUMN IF NOT EXISTS line_items jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS tax_rate numeric DEFAULT 0;

-- Quotes: optional deposit / full payment required on approval
ALTER TABLE "Quotes" ADD COLUMN IF NOT EXISTS require_payment BOOLEAN DEFAULT false;
ALTER TABLE "Quotes" ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC;

-- Invoices: track partial / installment payments
ALTER TABLE "Invoices" ADD COLUMN IF NOT EXISTS amount_paid NUMERIC DEFAULT 0;

-- Add period_month column to obligation_payments for monthly tracking
ALTER TABLE obligation_payments ADD COLUMN IF NOT EXISTS period_month TEXT;

-- Index for querying by period
CREATE INDEX IF NOT EXISTS idx_obligation_payments_period ON obligation_payments(obligation_id, period_month);

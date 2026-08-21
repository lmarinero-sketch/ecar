-- Migration: Supplier Master, Checking Accounts, and Cheque Payments Integration

-- 1. Extend suppliers table
ALTER TABLE suppliers
ADD COLUMN IF NOT EXISTS commercial_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS category VARCHAR(100),
ADD COLUMN IF NOT EXISTS payment_methods JSONB DEFAULT '["transferencia", "cheque"]'::jsonb,
ADD COLUMN IF NOT EXISTS has_checking_account BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS credit_limit_ars NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS credit_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS default_payment_condition VARCHAR(50) DEFAULT 'Contado',
ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS bank_alias VARCHAR(100),
ADD COLUMN IF NOT EXISTS bank_account_holder VARCHAR(255),
ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Create supplier_payments table
CREATE TABLE IF NOT EXISTS supplier_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method VARCHAR(50) NOT NULL, -- 'cheque_issued', 'cheque_third_party', 'transfer', 'cash'
  amount_ars NUMERIC(15,2) NOT NULL CHECK (amount_ars > 0),
  cheque_id UUID REFERENCES cheques(id) ON DELETE SET NULL,
  purchase_invoice_id UUID REFERENCES purchase_invoices(id) ON DELETE SET NULL,
  bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
  receipt_number VARCHAR(100),
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for supplier_payments
ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'supplier_payments' AND policyname = 'Users can access their tenant supplier_payments'
  ) THEN
    CREATE POLICY "Users can access their tenant supplier_payments"
      ON supplier_payments
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_supplier_payments_supplier ON supplier_payments(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_invoice ON supplier_payments(purchase_invoice_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_cheque ON supplier_payments(cheque_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_date ON supplier_payments(payment_date);

-- 3. Add payment_status column to purchase_invoices if not present
ALTER TABLE purchase_invoices
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending'; -- 'pending', 'partially_paid', 'paid'

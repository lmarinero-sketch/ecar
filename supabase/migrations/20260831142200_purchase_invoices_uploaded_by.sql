ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES profiles(id);

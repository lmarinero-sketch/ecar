ALTER TABLE cheques
ADD COLUMN IF NOT EXISTS linked_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS linked_purchase_invoice_id UUID REFERENCES purchase_invoices(id) ON DELETE SET NULL;

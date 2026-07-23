ALTER TABLE cheques
ADD COLUMN linked_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
ADD COLUMN linked_purchase_invoice_id UUID REFERENCES purchase_invoices(id) ON DELETE SET NULL;

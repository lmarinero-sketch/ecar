-- Add related_invoice_id to purchase_invoices for Credit/Debit Notes
ALTER TABLE public.purchase_invoices
ADD COLUMN related_invoice_id UUID REFERENCES public.purchase_invoices(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.purchase_invoices.related_invoice_id IS 'References the original invoice for Credit/Debit notes';

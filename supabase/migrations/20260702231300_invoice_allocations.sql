-- Migracion: Tabla de asignación múltiple de facturas a centros de costos (proyectos)

CREATE TABLE IF NOT EXISTS public.purchase_invoice_allocations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid NOT NULL,
    invoice_id uuid NOT NULL REFERENCES public.purchase_invoices(id) ON DELETE CASCADE,
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    percentage numeric NOT NULL CHECK (percentage > 0 AND percentage <= 100),
    amount_ars numeric NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    
    UNIQUE(invoice_id, project_id)
);

-- RLS
ALTER TABLE public.purchase_invoice_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view allocations for their tenant"
    ON public.purchase_invoice_allocations FOR SELECT
    USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert allocations for their tenant"
    ON public.purchase_invoice_allocations FOR INSERT
    WITH CHECK (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update allocations for their tenant"
    ON public.purchase_invoice_allocations FOR UPDATE
    USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete allocations for their tenant"
    ON public.purchase_invoice_allocations FOR DELETE
    USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Data Migration
-- Copiar las asociaciones actuales de project_id (1 a 1) hacia la tabla de multiplicidad (100%)
INSERT INTO public.purchase_invoice_allocations (tenant_id, invoice_id, project_id, percentage, amount_ars)
SELECT tenant_id, id, project_id, 100.00, total_ars
FROM public.purchase_invoices
WHERE project_id IS NOT NULL
ON CONFLICT (invoice_id, project_id) DO NOTHING;

-- Opcional: No vamos a dropear la columna project_id todavia por si acaso hay codigo legacy o vistas dependiendo de ella.
-- Pero la UI pasará a usar purchase_invoice_allocations.

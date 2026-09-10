-- Migration: Fix inventory_deposits RLS to allow public access matching warehouse_shelves & inventory_items
-- Date: 2026-09-10

ALTER TABLE public.inventory_deposits ADD COLUMN IF NOT EXISTS tenant_id uuid DEFAULT 'a0000000-0000-0000-0000-000000000001';

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.inventory_deposits;
DROP POLICY IF EXISTS "Allow all for inventory_deposits" ON public.inventory_deposits;

CREATE POLICY "Allow all for inventory_deposits" 
ON public.inventory_deposits 
FOR ALL 
USING (true) 
WITH CHECK (true);

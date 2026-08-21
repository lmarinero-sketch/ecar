-- ==============================================================================
-- Migration: 20260821000000_purchase_circuit_and_stock_prices.sql
-- Description: Purchase invoice line items, stock reception, and price history tracking
-- ==============================================================================

-- 1. Extend purchase_invoices with payment condition, deposit location, reception flag, discounts & notes
ALTER TABLE public.purchase_invoices
ADD COLUMN IF NOT EXISTS payment_condition TEXT,
ADD COLUMN IF NOT EXISTS deposit_location TEXT DEFAULT 'Pañol Central',
ADD COLUMN IF NOT EXISTS has_reception BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Extend inventory_items with item_code, ideal_stock, reserved_stock, and last_supplier_id
ALTER TABLE public.inventory_items
ADD COLUMN IF NOT EXISTS item_code TEXT,
ADD COLUMN IF NOT EXISTS ideal_stock NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS reserved_stock NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL;

-- 3. Create purchase_invoice_items table for line-by-line item details
CREATE TABLE IF NOT EXISTS public.purchase_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.purchase_invoices(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  item_code TEXT,
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'unidad',
  unit_price NUMERIC NOT NULL DEFAULT 0,
  discount_percentage NUMERIC DEFAULT 0,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  previous_price NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup by invoice and inventory item
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_items_invoice ON public.purchase_invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_items_item ON public.purchase_invoice_items(inventory_item_id);

-- RLS policies for purchase_invoice_items
ALTER TABLE public.purchase_invoice_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for purchase_invoice_items" ON public.purchase_invoice_items;
CREATE POLICY "Allow all for purchase_invoice_items" ON public.purchase_invoice_items FOR ALL USING (true) WITH CHECK (true);

-- 4. Create inventory_item_price_history table for auditing price changes per invoice
CREATE TABLE IF NOT EXISTS public.inventory_item_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.purchase_invoices(id) ON DELETE SET NULL,
  invoice_type TEXT,
  invoice_number TEXT,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  supplier_name TEXT,
  old_price NUMERIC NOT NULL DEFAULT 0,
  new_price NUMERIC NOT NULL DEFAULT 0,
  price_diff_ars NUMERIC NOT NULL DEFAULT 0,
  price_diff_pct NUMERIC NOT NULL DEFAULT 0,
  created_by TEXT DEFAULT 'web',
  created_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT
);

-- Index for fast query of item price history
CREATE INDEX IF NOT EXISTS idx_price_history_item ON public.inventory_item_price_history(item_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_invoice ON public.inventory_item_price_history(invoice_id);

-- RLS policies for inventory_item_price_history
ALTER TABLE public.inventory_item_price_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for inventory_item_price_history" ON public.inventory_item_price_history;
CREATE POLICY "Allow all for inventory_item_price_history" ON public.inventory_item_price_history FOR ALL USING (true) WITH CHECK (true);

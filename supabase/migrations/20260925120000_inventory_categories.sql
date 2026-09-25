-- Migration: Create inventory_categories table and relax category constraint on inventory_items
-- Date: 2026-09-25

CREATE TABLE IF NOT EXISTS public.inventory_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID DEFAULT 'a0000000-0000-0000-0000-000000000001',
  name TEXT NOT NULL,
  slug TEXT,
  icon TEXT DEFAULT '📦',
  is_tool BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT inventory_categories_name_unique UNIQUE (name)
);

-- Enable RLS and full access policy
ALTER TABLE public.inventory_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for inventory_categories" ON public.inventory_categories;
CREATE POLICY "Allow all for inventory_categories" 
ON public.inventory_categories 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Seed base categories
INSERT INTO public.inventory_categories (name, slug, icon, is_tool) VALUES 
  ('Material', 'material', '📦', false),
  ('Herramienta', 'herramienta', '🔧', true),
  ('Consumible', 'consumible', '🔩', false)
ON CONFLICT (name) DO UPDATE SET 
  icon = EXCLUDED.icon,
  is_tool = EXCLUDED.is_tool;

-- Drop check constraint on inventory_items so any category can be stored
ALTER TABLE public.inventory_items DROP CONSTRAINT IF EXISTS inventory_items_category_check;

ALTER TABLE public.budget_items ADD COLUMN IF NOT EXISTS machinery_details JSONB DEFAULT '[]'::jsonb;

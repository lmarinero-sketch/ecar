-- Migration: 20260624_weekly_payments_init.sql
-- Recreates the missing weekly_payments tables

CREATE TABLE IF NOT EXISTS public.weekly_payments (
  id uuid primary key default uuid_generate_v4(),
  tenant_id text not null,
  payment_date date not null,
  responsible text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

ALTER TABLE public.weekly_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable ALL for authenticated users on weekly_payments" ON public.weekly_payments;
CREATE POLICY "Enable ALL for authenticated users on weekly_payments" ON public.weekly_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.weekly_payment_items (
  id uuid primary key default uuid_generate_v4(),
  tenant_id text not null,
  payment_id uuid references public.weekly_payments(id) on delete cascade,
  orden integer not null default 1,
  source_type text not null,
  source_id text,
  monto numeric(15,2) not null default 0,
  pagado boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

ALTER TABLE public.weekly_payment_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable ALL for authenticated users on weekly_payment_items" ON public.weekly_payment_items;
CREATE POLICY "Enable ALL for authenticated users on weekly_payment_items" ON public.weekly_payment_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

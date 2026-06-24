CREATE TABLE IF NOT EXISTS public.weekly_payroll_details (
  id uuid primary key default uuid_generate_v4(),
  tenant_id text not null,
  weekly_payment_id uuid references public.weekly_payments(id) on delete cascade,
  weekly_payment_item_id uuid references public.weekly_payment_items(id) on delete cascade,
  employee_id uuid references public.employees(id),
  week_start date,
  week_end date,
  worked_hours numeric(10,2) default 0,
  overtime_hours numeric(10,2) default 0,
  hourly_rate numeric(12,2) default 0,
  base_amount numeric(12,2) default 0,
  extra_amount numeric(12,2) default 0,
  discount_amount numeric(12,2) default 0,
  final_amount numeric(12,2) default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.weekly_payroll_details ENABLE ROW LEVEL SECURITY;

-- Policy
CREATE POLICY "Enable ALL for authenticated users on weekly_payroll_details" 
ON public.weekly_payroll_details FOR ALL TO authenticated USING (true) WITH CHECK (true);

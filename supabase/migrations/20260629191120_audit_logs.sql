create table if not exists public.audit_logs (
    id uuid default gen_random_uuid() primary key,
    tenant_id uuid not null,
    user_id text not null,
    user_name text not null,
    action_type text not null,
    module text not null,
    duration_seconds numeric,
    details jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.audit_logs enable row level security;

DROP POLICY IF EXISTS "Users can view audit logs for their tenant" ON public.audit_logs;
CREATE POLICY "Users can view audit logs for their tenant" ON public.audit_logs for select
    using (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid or tenant_id = '48408cf5-c1fa-40c2-9e9f-7bc6198fbc18');

DROP POLICY IF EXISTS "Users can insert audit logs for their tenant" ON public.audit_logs;
CREATE POLICY "Users can insert audit logs for their tenant" ON public.audit_logs for insert
    with check (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid or tenant_id = '48408cf5-c1fa-40c2-9e9f-7bc6198fbc18');

-- Index for querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON public.audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at desc);

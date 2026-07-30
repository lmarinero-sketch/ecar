create table public.bcra_queries (
    id uuid default gen_random_uuid() primary key,
    cuit varchar(20) not null,
    query_type varchar(20) not null,
    data jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_by uuid references auth.users(id) default auth.uid()
);

-- Habilitar Row Level Security (RLS)
alter table public.bcra_queries enable row level security;

-- Políticas
create policy "Los usuarios autenticados pueden ver todas las consultas"
on public.bcra_queries for select
to authenticated
using (true);

create policy "Los usuarios autenticados pueden insertar consultas"
on public.bcra_queries for insert
to authenticated
with check (true);

-- Otorgar permisos al rol authenticated
grant select, insert on public.bcra_queries to authenticated;

create table if not exists public.inventory_deposits (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    location text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.inventory_deposits enable row level security;

create policy "Enable all access for authenticated users" on public.inventory_deposits for all to authenticated using (true);

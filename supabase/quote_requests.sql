create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  dosage_form text not null,
  customer_email text,
  company_name text,
  status text not null default 'new',
  module_data jsonb not null default '{}'::jsonb
);

alter table public.quote_requests enable row level security;

create policy "Allow activated customer quote inserts"
  on public.quote_requests
  for insert
  to anon
  with check (status = 'new');

create policy "Allow temporary quote request reads"
  on public.quote_requests
  for select
  to anon
  using (true);

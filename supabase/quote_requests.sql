create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  dosage_form text not null,
  customer_email text,
  company_name text,
  product_name text,
  project_name text,
  status text not null default 'new',
  module_data jsonb not null default '{}'::jsonb
);

alter table public.quote_requests
  add column if not exists product_name text,
  add column if not exists project_name text;

alter table public.quote_requests enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'quote_requests'
      and policyname = 'Allow activated customer quote inserts'
  ) then
    create policy "Allow activated customer quote inserts"
      on public.quote_requests
      for insert
      to anon
      with check (status = 'new');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'quote_requests'
      and policyname = 'Allow temporary quote request reads'
  ) then
    create policy "Allow temporary quote request reads"
      on public.quote_requests
      for select
      to anon
      using (true);
  end if;
end $$;

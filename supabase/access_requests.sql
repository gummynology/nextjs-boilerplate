create table if not exists public.access_requests (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  company_name text not null,
  company_website text not null,
  business_email text not null,
  phone text not null,
  address text not null,
  city text not null,
  state text not null,
  zip_code text not null,
  country text not null,
  product_interest text not null,
  estimated_annual_volume text not null,
  message text not null,
  status text not null default 'pending',
  activation_token text,
  activated boolean not null default false,
  activated_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.access_requests
  add column if not exists activation_token text,
  add column if not exists activated boolean not null default false,
  add column if not exists activated_at timestamptz;

alter table public.access_requests enable row level security;

create policy "Allow public access request inserts"
  on public.access_requests
  for insert
  to anon
  with check (status = 'pending');

create policy "Allow temporary public access request reads"
  on public.access_requests
  for select
  to anon
  using (true);

create policy "Allow temporary public status updates"
  on public.access_requests
  for update
  to anon
  using (true)
  with check (status in ('pending', 'approved', 'rejected'));

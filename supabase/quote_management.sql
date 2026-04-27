alter table public.quote_requests
  add column if not exists quotation_number text,
  add column if not exists source text,
  add column if not exists contact_name text,
  add column if not exists phone text,
  add column if not exists address text,
  add column if not exists internal_notes text,
  add column if not exists estimated_total_price numeric,
  add column if not exists estimated_unit_price_cents numeric;

create index if not exists quote_requests_quotation_number_idx
  on public.quote_requests (quotation_number);

create index if not exists quote_requests_customer_email_idx
  on public.quote_requests (customer_email);

create index if not exists quote_requests_company_name_idx
  on public.quote_requests (company_name);

create index if not exists quote_requests_status_idx
  on public.quote_requests (status);

alter table public.quote_requests enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'quote_requests'
      and policyname = 'Allow quote management reads'
  ) then
    create policy "Allow quote management reads"
      on public.quote_requests
      for select
      to anon
      using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'quote_requests'
      and policyname = 'Allow quote management inserts'
  ) then
    create policy "Allow quote management inserts"
      on public.quote_requests
      for insert
      to anon
      with check (
        status in ('new', 'draft', 'reviewing', 'quoted', 'won', 'lost')
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'quote_requests'
      and policyname = 'Allow quote management updates'
  ) then
    create policy "Allow quote management updates"
      on public.quote_requests
      for update
      to anon
      using (true)
      with check (true);
  end if;
end $$;

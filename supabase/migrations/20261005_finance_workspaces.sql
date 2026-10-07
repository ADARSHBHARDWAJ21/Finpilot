-- Saved planning, year-specific tax workspaces and private proof documents.
-- Additive migration: existing profiles, transactions and chats are preserved.
begin;

create table if not exists public.finance_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(title) between 1 and 160),
  description text not null default '' check (length(description) <= 2000),
  due_date date not null,
  category text not null default 'other' check (category in ('tax','investments','compliance','document','bills','other')),
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists finance_events_owner_date on public.finance_events(user_id, due_date);

create table if not exists public.tax_workspace_sections (
  user_id uuid not null references auth.users(id) on delete cascade,
  financial_year text not null check (financial_year ~ '^[0-9]{4}-[0-9]{2}$'),
  section text not null check (section in ('salary-documents','tax-saving-proofs','rent-hra','banking-investments','compliance-filing')),
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object'),
  checklist jsonb not null default '{}'::jsonb check (jsonb_typeof(checklist) = 'object'),
  updated_at timestamptz not null default now(),
  primary key(user_id, financial_year, section)
);

create table if not exists public.tax_documents (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  financial_year text not null check (financial_year ~ '^[0-9]{4}-[0-9]{2}$'),
  section text not null check (section in ('salary-documents','tax-saving-proofs','rent-hra','banking-investments','compliance-filing')),
  proof_key text not null check (length(proof_key) between 1 and 60),
  name text not null check (length(name) between 1 and 180),
  storage_path text not null unique check (split_part(storage_path, '/', 1) = user_id::text),
  mime_type text not null,
  size_bytes bigint not null check (size_bytes between 1 and 10485760),
  created_at timestamptz not null default now()
);
create index if not exists tax_documents_owner_year on public.tax_documents(user_id, financial_year);

alter table public.finance_events enable row level security;
alter table public.tax_workspace_sections enable row level security;
alter table public.tax_documents enable row level security;
revoke all on public.finance_events, public.tax_workspace_sections, public.tax_documents from anon;
grant select, insert, update, delete on public.finance_events, public.tax_workspace_sections, public.tax_documents to authenticated;

do $$
declare table_name text;
begin
  foreach table_name in array array['finance_events','tax_workspace_sections','tax_documents'] loop
    if not exists (select 1 from pg_policies where schemaname='public' and tablename=table_name and policyname='Account owns workspace records') then
      execute format('create policy "Account owns workspace records" on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', table_name);
    end if;
  end loop;
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('tax-proofs', 'tax-proofs', false, 10485760, array['application/pdf','image/png','image/jpeg','image/webp','text/csv','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict (id) do nothing;
do $$ begin
  if exists (select 1 from storage.buckets where id='tax-proofs' and public) then
    raise exception 'tax-proofs must be a private bucket before this migration can finish';
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Private tax proofs owned by account') then
    create policy "Private tax proofs owned by account" on storage.objects
    for all to authenticated
    using (bucket_id='tax-proofs' and (storage.foldername(name))[1]=(select auth.uid())::text)
    with check (bucket_id='tax-proofs' and (storage.foldername(name))[1]=(select auth.uid())::text);
  end if;
end $$;
commit;

-- Additive migration: apply only this file when enabling Copilot on an existing app.
create or replace function public.copilot_number_is_valid(value jsonb, signed boolean default false)
returns boolean language plpgsql immutable set search_path = public as $$
begin
  return jsonb_typeof(value) = 'number'
    and (value #>> '{}')::numeric between (case when signed then -10000000000 else 0 end) and 10000000000;
exception when others then return false;
end;
$$;

create or replace function public.copilot_tax_estimate_is_valid(value jsonb)
returns boolean language plpgsql immutable set search_path = public as $$
declare
  regime text;
  field record;
begin
  if jsonb_typeof(value) is distinct from 'object' or jsonb_typeof(value->'available') is distinct from 'boolean' then return false; end if;
  if value->'available' = 'false'::jsonb then
    return jsonb_typeof(value->'reason') = 'string' and char_length(value->>'reason') between 1 and 2000;
  end if;
  if (value->>'financialYear') not in ('2024-25', '2025-26', '2026-27')
    or (value->>'recommended') not in ('old', 'new', 'equal')
    or not coalesce(public.copilot_number_is_valid(value->'annualSalary'), false)
    or not coalesce(public.copilot_number_is_valid(value->'difference'), false) then return false; end if;
  if value->>'financialYear' is null or value->>'recommended' is null then return false; end if;
  foreach regime in array array['old', 'new'] loop
    if jsonb_typeof(value->regime) is distinct from 'object'
      or not coalesce(public.copilot_number_is_valid(value->regime->'tax'), false)
      or not coalesce(public.copilot_number_is_valid(value->regime->'taxableIncome'), false) then return false; end if;
    for field in select * from jsonb_each(value->regime) loop
      if field.key in ('tax', 'taxableIncome', 'baseTax', 'rebate', 'marginalRelief') then
        if not coalesce(public.copilot_number_is_valid(field.value), false) then return false; end if;
      elsif field.key = 'deductions' then
        if jsonb_typeof(field.value) is distinct from 'object' or exists (
          select 1 from jsonb_each(field.value) as deduction
          where deduction.key not in ('standard', 'section80c', 'healthInsurance', 'personalNps', 'personalNpsWithin80c', 'employerNps', 'hra', 'homeLoanInterest', 'educationLoanInterest')
            or not coalesce(public.copilot_number_is_valid(deduction.value), false)
        ) then return false; end if;
      else return false;
      end if;
    end loop;
  end loop;
  if value ? 'warnings' and (jsonb_typeof(value->'warnings') is distinct from 'array' or jsonb_array_length(value->'warnings') > 20 or exists (
    select 1 from jsonb_array_elements(value->'warnings') as note
    where jsonb_typeof(note) is distinct from 'string' or char_length(note #>> '{}') not between 1 and 2000
  )) then return false; end if;
  return true;
exception when others then return false;
end;
$$;

create or replace function public.copilot_messages_are_valid(value jsonb)
returns boolean language plpgsql immutable set search_path = public as $$
declare
  entry jsonb;
  position bigint;
  role_name text;
  calc jsonb;
  source jsonb;
  field record;
begin
  if jsonb_typeof(value) is distinct from 'array' or jsonb_array_length(value) > 40
    or jsonb_array_length(value) % 2 <> 0 or octet_length(value::text) > 2000000 then return false; end if;
  for entry, position in select item, ordinality from jsonb_array_elements(value) with ordinality as messages(item, ordinality) loop
    role_name := case when position % 2 = 1 then 'user' else 'assistant' end;
    if jsonb_typeof(entry) is distinct from 'object' or entry->>'role' is distinct from role_name
      or jsonb_typeof(entry->'content') is distinct from 'string'
      or entry->>'content' !~ '[^[:space:]]'
      or char_length(entry->>'content') > (case when role_name = 'user' then 3000 else 16000 end) then return false; end if;
    if exists (select 1 from jsonb_object_keys(entry) as fields(key) where key not in ('role', 'content', 'createdAt', 'calculations', 'sources')) then return false; end if;
    if entry ? 'createdAt' and (jsonb_typeof(entry->'createdAt') is distinct from 'string'
      or char_length(entry->>'createdAt') > 40 or entry->>'createdAt' !~ '^\d{4}-\d{2}-\d{2}T') then return false; end if;
    if entry ? 'createdAt' then perform (entry->>'createdAt')::timestamptz; end if;
    if role_name = 'user' and (entry ? 'calculations' or entry ? 'sources') then return false; end if;
    if entry ? 'calculations' then
      if jsonb_typeof(entry->'calculations') is distinct from 'array' or jsonb_array_length(entry->'calculations') > 8
        or octet_length((entry->'calculations')::text) > 64000 then return false; end if;
      for calc in select * from jsonb_array_elements(entry->'calculations') loop
        if jsonb_typeof(calc) is distinct from 'object' then return false; end if;
        if calc->>'kind' = 'tax' then
          if exists (select 1 from jsonb_object_keys(calc) as fields(key) where key not in ('kind', 'baseline', 'scenario', 'changes', 'delta', 'assumptions')) then return false; end if;
          if not coalesce(public.copilot_tax_estimate_is_valid(calc->'baseline'), false)
            or not coalesce(public.copilot_tax_estimate_is_valid(calc->'scenario'), false)
            or jsonb_typeof(calc->'changes') is distinct from 'object' then return false; end if;
          if calc->'changes' ? 'annualSalary' and calc->'changes' ? 'increasePercent' then return false; end if;
          for field in select * from jsonb_each(calc->'changes') loop
            if field.key = 'financialYear' then
              if field.value #>> '{}' not in ('2024-25', '2025-26', '2026-27') then return false; end if;
            elsif field.key in ('parentsSenior', 'governmentEmployer') then
              if jsonb_typeof(field.value) is distinct from 'boolean' then return false; end if;
            elsif field.key = 'increasePercent' then
              if jsonb_typeof(field.value) is distinct from 'number' or (field.value #>> '{}')::numeric not between -100 and 1000 then return false; end if;
            elsif field.key = 'monthsRemaining' then
              if jsonb_typeof(field.value) is distinct from 'number' or (field.value #>> '{}')::numeric not between 1 and 12 or (field.value #>> '{}')::numeric <> trunc((field.value #>> '{}')::numeric) then return false; end if;
            elsif field.key in ('annualSalary', 'baselineAnnualSalary', 'monthlyRent', 'section80c', 'personalNps', 'employerNps', 'healthInsurance', 'parentsHealthInsurance', 'educationLoanInterest', 'confirmedHomeLoanInterest') then
              if not coalesce(public.copilot_number_is_valid(field.value), false) or (field.value #>> '{}')::numeric > 100000000 then return false; end if;
            else return false;
            end if;
          end loop;
          if calc ? 'delta' and calc->'delta' <> 'null'::jsonb and (jsonb_typeof(calc->'delta') is distinct from 'object'
            or not coalesce(public.copilot_number_is_valid(calc->'delta'->'oldTax', true), false)
            or not coalesce(public.copilot_number_is_valid(calc->'delta'->'newTax', true), false)
            or not coalesce(public.copilot_number_is_valid(calc->'delta'->'grossIncome', true), false)) then return false; end if;
        elsif calc->>'kind' = 'emi' then
          if exists (select 1 from jsonb_object_keys(calc) as fields(key) where key not in ('kind', 'inputs', 'monthlyEmi', 'totalInterest', 'declaredMonthlyIncome', 'declaredMonthlyCommitted', 'remainingAfterEmi', 'assumptions')) then return false; end if;
          if jsonb_typeof(calc->'inputs') is distinct from 'object'
            or not coalesce(public.copilot_number_is_valid(calc->'inputs'->'principal'), false)
            or (calc->'inputs'->>'principal')::numeric > 100000000
            or jsonb_typeof(calc->'inputs'->'annualRatePercent') is distinct from 'number'
            or (calc->'inputs'->>'annualRatePercent')::numeric not between 0 and 60
            or jsonb_typeof(calc->'inputs'->'tenureMonths') is distinct from 'number'
            or (calc->'inputs'->>'tenureMonths')::numeric not between 1 and 480
            or (calc->'inputs'->>'tenureMonths')::numeric <> trunc((calc->'inputs'->>'tenureMonths')::numeric) then return false; end if;
          if exists (select 1 from jsonb_object_keys(calc->'inputs') as fields(key) where key not in ('principal', 'annualRatePercent', 'tenureMonths')) then return false; end if;
          foreach role_name in array array['monthlyEmi', 'totalInterest', 'declaredMonthlyIncome', 'declaredMonthlyCommitted'] loop
            if not coalesce(public.copilot_number_is_valid(calc->role_name), false) then return false; end if;
          end loop;
          if not (calc ? 'remainingAfterEmi') or (calc->'remainingAfterEmi' <> 'null'::jsonb
            and not coalesce(public.copilot_number_is_valid(calc->'remainingAfterEmi', true), false)) then return false; end if;
        else return false;
        end if;
        if calc ? 'assumptions' and (jsonb_typeof(calc->'assumptions') is distinct from 'array' or jsonb_array_length(calc->'assumptions') > 20 or exists (
          select 1 from jsonb_array_elements(calc->'assumptions') as note
          where jsonb_typeof(note) is distinct from 'string' or char_length(note #>> '{}') not between 1 and 2000
        )) then return false; end if;
      end loop;
    end if;
    if entry ? 'sources' then
      if jsonb_typeof(entry->'sources') is distinct from 'array' or jsonb_array_length(entry->'sources') > 10 then return false; end if;
      for source in select * from jsonb_array_elements(entry->'sources') loop
        if jsonb_typeof(source) is distinct from 'object' or jsonb_typeof(source->'title') is distinct from 'string'
          or char_length(source->>'title') not between 1 and 240 or source->>'url' is null
          or exists (select 1 from jsonb_object_keys(source) as fields(key) where key not in ('title', 'url'))
          or source->>'url' not in (
            'https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1',
            'https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-3',
            'https://www.incometaxindia.gov.in/en/income-from-salary',
            'https://www.incometaxindia.gov.in/w/section-202-78',
            'https://www.incometaxindia.gov.in/w/section-80cce-21',
            'https://www.incometaxindia.gov.in/w/section-288a-55',
            'https://www.incometaxindia.gov.in/w/section-288b-9',
            'https://www.incometaxindia.gov.in/w/section-516-3'
          ) then return false; end if;
      end loop;
    end if;
  end loop;
  return true;
exception when others then return false;
end;
$$;

create table if not exists public.copilot_chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 100),
  messages jsonb not null default '[]'::jsonb
    check (jsonb_typeof(messages) = 'array' and jsonb_array_length(messages) <= 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Existing malformed chats remain recoverable/deletable; all future writes are validated.
alter table public.copilot_chats drop constraint if exists copilot_chats_messages_valid;
alter table public.copilot_chats add constraint copilot_chats_messages_valid
  check (public.copilot_messages_are_valid(messages)) not valid;
create index if not exists copilot_chats_user_updated_idx
  on public.copilot_chats (user_id, updated_at desc);
alter table public.copilot_chats enable row level security;
revoke all on public.copilot_chats from anon;
grant select, insert, update, delete on public.copilot_chats to authenticated;
drop policy if exists "Users manage own Copilot chats" on public.copilot_chats;
create policy "Users manage own Copilot chats"
  on public.copilot_chats for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

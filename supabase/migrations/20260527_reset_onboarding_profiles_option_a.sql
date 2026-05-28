-- Option A: drop stale table and recreate with full schema (run once in Supabase SQL Editor)

drop table if exists public.onboarding_profiles cascade;

create table public.onboarding_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,

  -- Step 1: Basic profile
  full_name text,
  email text,
  phone_number text,
  alternate_phone_number text,
  age integer,
  city text,
  company_name text,
  employment_type text default 'salaried',
  financial_year text,

  -- Step 2: Salary structure
  annual_ctc numeric default 0,
  monthly_inhand_salary numeric default 0,
  basic_salary numeric default 0,
  hra numeric default 0,
  special_allowance numeric default 0,
  bonus numeric default 0,
  employer_pf numeric default 0,
  employer_nps numeric default 0,
  monthly_tds numeric default 0,

  -- Step 3: Tax regime & deductions
  tax_regime text default 'new',
  elss_investments numeric default 0,
  ppf numeric default 0,
  epf numeric default 0,
  tax_saver_fd numeric default 0,
  life_insurance numeric default 0,
  health_insurance numeric default 0,
  parents_health_insurance numeric default 0,
  nps_contribution numeric default 0,
  home_loan_interest numeric default 0,
  education_loan_interest numeric default 0,
  paying_rent boolean default false,
  monthly_rent numeric default 0,
  home_loan_active boolean default false,

  -- Step 4: Expenses & behavior
  monthly_food_spend numeric default 0,
  monthly_transport_spend numeric default 0,
  monthly_shopping_spend numeric default 0,
  sip_amount numeric default 0,
  emi_obligations numeric default 0,
  credit_card_usage text,
  savings_goal numeric default 0,
  side_income numeric default 0,

  -- Step 5: Future decisions
  expecting_salary_hike boolean default false,
  planning_home_loan boolean default false,
  planning_car_loan boolean default false,
  planning_investments boolean default false,
  planning_side_income boolean default false,

  -- Step 6: Documents (metadata / flags)
  documents jsonb default '{}'::jsonb,

  -- Step 7: Generated summary
  ai_summary jsonb,

  current_step integer default 1,
  onboarding_completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.onboarding_profiles enable row level security;

drop policy if exists "Users manage own onboarding profile" on public.onboarding_profiles;

create policy "Users manage own onboarding profile"
  on public.onboarding_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

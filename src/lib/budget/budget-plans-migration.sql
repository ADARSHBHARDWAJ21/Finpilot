-- Reference: matches Supabase budget_plans (per category, per month)

create table if not exists public.budget_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  category text not null,
  monthly_limit numeric not null default 0,
  spent numeric default 0,
  color text,
  icon text,
  month text,
  year integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.budget_plans enable row level security;

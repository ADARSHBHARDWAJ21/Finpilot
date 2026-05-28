-- Per-category monthly budgets (matches app + Supabase dashboard setup)

create table if not exists public.budget_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  monthly_limit numeric not null default 0,
  spent numeric default 0,
  color text,
  icon text,
  month text not null,
  year integer not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists budget_plans_user_month_idx
  on public.budget_plans (user_id, year, month);

alter table public.budget_plans enable row level security;

drop policy if exists "Users can view own budgets" on public.budget_plans;
drop policy if exists "Users can insert own budgets" on public.budget_plans;
drop policy if exists "Users can update own budgets" on public.budget_plans;
drop policy if exists "Users can delete own budgets" on public.budget_plans;

create policy "Users can view own budgets"
  on public.budget_plans for select
  using (auth.uid() = user_id);

create policy "Users can insert own budgets"
  on public.budget_plans for insert
  with check (auth.uid() = user_id);

create policy "Users can update own budgets"
  on public.budget_plans for update
  using (auth.uid() = user_id);

create policy "Users can delete own budgets"
  on public.budget_plans for delete
  using (auth.uid() = user_id);

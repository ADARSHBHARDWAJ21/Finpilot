-- Run in Supabase SQL editor
alter table public.transactions
  add column if not exists confidence_score numeric default 100;

alter table public.transactions
  add column if not exists review_status text default 'completed';

comment on column public.transactions.confidence_score is '0-100 import reliability';
comment on column public.transactions.review_status is 'completed | needs_review';

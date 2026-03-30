create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.financial_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null default '',
  city text not null default '',
  monthly_in_hand_salary numeric(12, 2) not null default 0 check (monthly_in_hand_salary >= 0),
  current_bank_balance numeric(12, 2) not null default 0 check (current_bank_balance >= 0),
  emergency_savings numeric(12, 2) not null default 0 check (emergency_savings >= 0),
  rent numeric(12, 2) not null default 0 check (rent >= 0),
  fixed_monthly_bills numeric(12, 2) not null default 0 check (fixed_monthly_bills >= 0),
  emi_obligations numeric(12, 2) not null default 0 check (emi_obligations >= 0),
  credit_card_dues numeric(12, 2) not null default 0 check (credit_card_dues >= 0),
  monthly_investments numeric(12, 2) not null default 0 check (monthly_investments >= 0),
  monthly_discretionary_spending numeric(12, 2) not null default 0 check (monthly_discretionary_spending >= 0),
  preferences jsonb not null default '{"currency":"INR","emailInsights":true,"explanationMode":"template"}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.financial_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  priority text not null check (priority in ('primary', 'secondary')),
  target_amount numeric(12, 2) not null default 0 check (target_amount >= 0),
  icon_key text not null default 'sparkles',
  target_date date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scenario_key text,
  title text not null,
  question text not null,
  amount numeric(12, 2) not null default 0 check (amount >= 0),
  monthly_impact numeric(12, 2) not null default 0,
  duration_months integer check (duration_months is null or duration_months between 1 and 120),
  category text not null check (category in ('electronics', 'travel', 'move', 'investment', 'loan', 'lifestyle', 'family', 'housing', 'other')),
  timing text not null check (timing in ('now', 'within_3_months', 'later')),
  verdict text not null check (verdict in ('safe', 'caution', 'risky', 'not_recommended')),
  verdict_label text not null,
  status_tag text not null,
  explanation text not null default '',
  explanation_source text not null default 'template' check (explanation_source in ('template', 'ai')),
  better_alternative text not null default '',
  result_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_financial_goals_user_id on public.financial_goals(user_id);
create index if not exists idx_decisions_user_id_created_at on public.decisions(user_id, created_at desc);

drop trigger if exists set_financial_profiles_updated_at on public.financial_profiles;
create trigger set_financial_profiles_updated_at
before update on public.financial_profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_financial_goals_updated_at on public.financial_goals;
create trigger set_financial_goals_updated_at
before update on public.financial_goals
for each row
execute function public.set_updated_at();

drop trigger if exists set_decisions_updated_at on public.decisions;
create trigger set_decisions_updated_at
before update on public.decisions
for each row
execute function public.set_updated_at();

alter table public.financial_profiles enable row level security;
alter table public.financial_goals enable row level security;
alter table public.decisions enable row level security;

drop policy if exists "Users manage their own financial profile" on public.financial_profiles;
create policy "Users manage their own financial profile"
on public.financial_profiles
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users manage their own financial goals" on public.financial_goals;
create policy "Users manage their own financial goals"
on public.financial_goals
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users manage their own decisions" on public.decisions;
create policy "Users manage their own decisions"
on public.decisions
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

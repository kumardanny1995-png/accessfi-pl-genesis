create table if not exists public.web_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  guest_profile_id uuid not null references public.guest_profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  subscription_json jsonb not null default '{}'::jsonb,
  user_agent text,
  is_active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  last_notified_at timestamptz,
  failure_count integer not null default 0,
  failed_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists web_push_subscriptions_guest_active_idx
  on public.web_push_subscriptions (guest_profile_id, is_active, updated_at desc);

drop trigger if exists web_push_subscriptions_set_updated_at on public.web_push_subscriptions;
create trigger web_push_subscriptions_set_updated_at before update on public.web_push_subscriptions
for each row execute function public.set_updated_at();

alter table public.web_push_subscriptions enable row level security;

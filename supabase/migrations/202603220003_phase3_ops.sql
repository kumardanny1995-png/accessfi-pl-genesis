do $$
begin
  create type prediction_template_key as enum ('classic_social', 'provider_ready');
exception
  when duplicate_object then null;
end $$;

alter table public.matches
  add column if not exists prediction_template_key prediction_template_key not null default 'classic_social';

alter table public.notifications
  add column if not exists dedupe_key text;

create unique index if not exists notifications_dedupe_key_idx
  on public.notifications (dedupe_key)
  where dedupe_key is not null;

alter table public.event_sync_state
  add column if not exists provider_event_label text,
  add column if not exists provider_event_status text,
  add column if not exists last_checked_at timestamptz,
  add column if not exists last_error text;

create table if not exists public.provider_sync_runs (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references public.matches(id) on delete cascade,
  provider_key text not null,
  sync_kind text not null default 'manual',
  status text not null default 'pending',
  summary text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists provider_sync_runs_match_idx
  on public.provider_sync_runs (match_id, created_at desc);

alter table public.provider_sync_runs enable row level security;

drop policy if exists "public read provider sync runs" on public.provider_sync_runs;
create policy "public read provider sync runs" on public.provider_sync_runs
for select using (true);

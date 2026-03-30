alter type public.notification_type add value if not exists 'mini_pick_live';
alter type public.notification_type add value if not exists 'mini_pick_settled';

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'mini_pick_status'
  ) then
    create type public.mini_pick_status as enum ('scheduled', 'open', 'locked', 'settled', 'cancelled');
  end if;
end $$;

create table if not exists public.mini_pick_templates (
  id uuid primary key default gen_random_uuid(),
  sport_id uuid not null references public.sports(id) on delete cascade,
  key text not null,
  name text not null,
  description text,
  default_prompt text not null,
  default_options jsonb not null default '[]'::jsonb,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sport_id, key)
);

create table if not exists public.mini_pick_windows (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  group_id uuid references public.groups(id) on delete set null,
  template_id uuid references public.mini_pick_templates(id) on delete set null,
  key text not null,
  title text not null,
  prompt text not null,
  description text,
  status public.mini_pick_status not null default 'scheduled',
  opens_at timestamptz not null,
  lock_at timestamptz not null,
  settled_at timestamptz,
  resolved_option_id uuid,
  resolution_note text,
  stake_text text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mini_pick_windows_time_check check (lock_at >= opens_at)
);

create table if not exists public.mini_pick_options (
  id uuid primary key default gen_random_uuid(),
  window_id uuid not null references public.mini_pick_windows(id) on delete cascade,
  label text not null,
  value text not null,
  sort_order integer not null default 1
);

alter table public.mini_pick_windows
  drop constraint if exists mini_pick_windows_resolved_option_id_fkey;

alter table public.mini_pick_windows
  add constraint mini_pick_windows_resolved_option_id_fkey
  foreign key (resolved_option_id) references public.mini_pick_options(id) on delete set null;

create table if not exists public.mini_pick_entries (
  id uuid primary key default gen_random_uuid(),
  window_id uuid not null references public.mini_pick_windows(id) on delete cascade,
  guest_profile_id uuid not null references public.guest_profiles(id) on delete cascade,
  display_name text not null,
  selected_option_id uuid not null references public.mini_pick_options(id) on delete cascade,
  submitted_at timestamptz not null default now(),
  is_correct boolean,
  points_awarded integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  unique (window_id, guest_profile_id)
);

create index if not exists mini_pick_windows_match_status_idx
  on public.mini_pick_windows (match_id, status, opens_at, lock_at);

create index if not exists mini_pick_entries_window_idx
  on public.mini_pick_entries (window_id, submitted_at desc);

drop trigger if exists mini_pick_templates_set_updated_at on public.mini_pick_templates;
create trigger mini_pick_templates_set_updated_at before update on public.mini_pick_templates
for each row execute function public.set_updated_at();

drop trigger if exists mini_pick_windows_set_updated_at on public.mini_pick_windows;
create trigger mini_pick_windows_set_updated_at before update on public.mini_pick_windows
for each row execute function public.set_updated_at();

alter table public.mini_pick_templates enable row level security;
alter table public.mini_pick_windows enable row level security;
alter table public.mini_pick_options enable row level security;
alter table public.mini_pick_entries enable row level security;

drop policy if exists "public read mini pick templates" on public.mini_pick_templates;
create policy "public read mini pick templates" on public.mini_pick_templates
for select using (true);

drop policy if exists "public read mini pick windows" on public.mini_pick_windows;
create policy "public read mini pick windows" on public.mini_pick_windows
for select using (true);

drop policy if exists "public read mini pick options" on public.mini_pick_options;
create policy "public read mini pick options" on public.mini_pick_options
for select using (true);

drop policy if exists "public read mini pick entries" on public.mini_pick_entries;
create policy "public read mini pick entries" on public.mini_pick_entries
for select using (true);

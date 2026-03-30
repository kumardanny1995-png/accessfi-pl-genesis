do $$
begin
  create type competitor_entity_type as enum ('team', 'club', 'franchise', 'driver', 'constructor', 'nation');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type season_status as enum ('upcoming', 'active', 'completed', 'archived');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type group_type as enum ('private', 'office', 'college', 'community', 'creator');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type group_visibility as enum ('private', 'invite_only', 'public');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type group_member_role as enum ('owner', 'admin', 'member');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type notification_type as enum (
    'challenge_live',
    'rival_joined',
    'match_starting_soon',
    'picks_locking_soon',
    'results_live',
    'you_won',
    'you_got_cooked',
    'season_table_updated',
    'room_challenge_live'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type badge_rarity as enum ('common', 'rare', 'epic');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type ai_generation_kind as enum (
    'pre_match_storyline',
    'post_match_recap',
    'rivalry_summary',
    'trash_talk',
    'creator_room_hype'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type ai_generation_status as enum ('pending', 'generated', 'failed', 'disabled');
exception
  when duplicate_object then null;
end $$;

alter table public.teams
  add column if not exists entity_type competitor_entity_type not null default 'team';

create table if not exists public.competitions (
  id uuid primary key default gen_random_uuid(),
  sport_id uuid not null references public.sports(id) on delete cascade,
  slug text not null unique,
  name text not null,
  short_name text,
  category text,
  region text,
  theme_accent text,
  is_featured boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  slug text not null unique,
  name text not null,
  year integer,
  status season_status not null default 'upcoming',
  is_current boolean not null default false,
  start_date date,
  end_date date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.matches
  add column if not exists competition_id uuid references public.competitions(id) on delete set null,
  add column if not exists season_id uuid references public.seasons(id) on delete set null,
  add column if not exists stage_label text,
  add column if not exists hero_image_url text,
  add column if not exists external_provider_key text,
  add column if not exists external_event_id text,
  add column if not exists featured_rank integer;

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  group_type group_type not null default 'private',
  visibility group_visibility not null default 'private',
  sport_id uuid references public.sports(id) on delete set null,
  competition_id uuid references public.competitions(id) on delete set null,
  season_id uuid references public.seasons(id) on delete set null,
  creator_user_id uuid references public.users(id) on delete set null,
  creator_guest_profile_id uuid references public.guest_profiles(id) on delete set null,
  headline text,
  stake_template text,
  punishment_template text,
  invite_code text not null unique default encode(gen_random_bytes(5), 'hex'),
  is_recurring boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint groups_identity_check check (creator_user_id is not null or creator_guest_profile_id is not null)
);

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  guest_profile_id uuid references public.guest_profiles(id) on delete set null,
  display_name text not null,
  role group_member_role not null default 'member',
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint group_members_identity_check check (user_id is not null or guest_profile_id is not null)
);

create unique index if not exists group_members_unique_user_per_group
  on public.group_members (group_id, user_id)
  where user_id is not null;

create unique index if not exists group_members_unique_guest_per_group
  on public.group_members (group_id, guest_profile_id)
  where guest_profile_id is not null;

create table if not exists public.group_challenges (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  season_id uuid references public.seasons(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (group_id, challenge_id)
);

alter table public.challenges
  add column if not exists group_id uuid references public.groups(id) on delete set null;

create table if not exists public.season_standings (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  season_id uuid not null references public.seasons(id) on delete cascade,
  group_member_id uuid not null references public.group_members(id) on delete cascade,
  display_name text not null,
  challenges_played integer not null default 0,
  wins integer not null default 0,
  losses integer not null default 0,
  draws integer not null default 0,
  total_points integer not null default 0,
  accuracy_pct numeric(5, 2) not null default 0,
  contrarian_bonus integer not null default 0,
  reputation_score integer not null default 0,
  rank integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, season_id, group_member_id)
);

create table if not exists public.profile_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  guest_profile_id uuid references public.guest_profiles(id) on delete cascade,
  display_name text not null,
  best_sport_id uuid references public.sports(id) on delete set null,
  total_challenges_played integer not null default 0,
  total_wins integer not null default 0,
  total_losses integer not null default 0,
  total_correct_picks integer not null default 0,
  total_possible_picks integer not null default 0,
  win_rate numeric(5, 2) not null default 0,
  accuracy_pct numeric(5, 2) not null default 0,
  contrarian_hits integer not null default 0,
  clean_sweeps integer not null default 0,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  rivals_beaten integer not null default 0,
  leagues_joined integer not null default 0,
  reputation_score integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_stats_identity_check check (user_id is not null or guest_profile_id is not null)
);

create unique index if not exists profile_stats_unique_user
  on public.profile_stats (user_id)
  where user_id is not null;

create unique index if not exists profile_stats_unique_guest
  on public.profile_stats (guest_profile_id)
  where guest_profile_id is not null;

create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text not null,
  icon text,
  rarity badge_rarity not null default 'common',
  theme_color text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_badges (
  id uuid primary key default gen_random_uuid(),
  badge_id uuid not null references public.badges(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  guest_profile_id uuid references public.guest_profiles(id) on delete cascade,
  awarded_for_challenge_id uuid references public.challenges(id) on delete set null,
  awarded_for_group_id uuid references public.groups(id) on delete set null,
  dedupe_key text not null unique,
  reason text,
  created_at timestamptz not null default now(),
  constraint profile_badges_identity_check check (user_id is not null or guest_profile_id is not null)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  guest_profile_id uuid references public.guest_profiles(id) on delete cascade,
  type notification_type not null,
  title text not null,
  body text not null,
  href text,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_identity_check check (user_id is not null or guest_profile_id is not null)
);

create table if not exists public.event_sync_state (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null unique references public.matches(id) on delete cascade,
  provider_key text not null default 'manual',
  external_event_id text,
  auto_settle_supported boolean not null default false,
  sync_status text not null default 'manual',
  last_synced_at timestamptz,
  last_auto_settled_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references public.challenges(id) on delete cascade,
  group_id uuid references public.groups(id) on delete cascade,
  match_id uuid references public.matches(id) on delete cascade,
  kind ai_generation_kind not null,
  status ai_generation_status not null default 'pending',
  provider_key text,
  prompt_version text,
  output_text text,
  output_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists matches_sport_competition_idx on public.matches (sport_id, competition_id, season_id, start_time);
create index if not exists groups_type_visibility_idx on public.groups (group_type, visibility, created_at desc);
create index if not exists group_challenges_group_id_idx on public.group_challenges (group_id, created_at desc);
create index if not exists season_standings_group_rank_idx on public.season_standings (group_id, season_id, rank);
create index if not exists notifications_guest_profile_idx on public.notifications (guest_profile_id, created_at desc);
create index if not exists profile_badges_guest_idx on public.profile_badges (guest_profile_id, created_at desc);
create index if not exists competitions_sport_featured_idx on public.competitions (sport_id, is_featured);
create index if not exists seasons_competition_current_idx on public.seasons (competition_id, is_current);

drop trigger if exists competitions_set_updated_at on public.competitions;
create trigger competitions_set_updated_at before update on public.competitions
for each row execute function public.set_updated_at();

drop trigger if exists seasons_set_updated_at on public.seasons;
create trigger seasons_set_updated_at before update on public.seasons
for each row execute function public.set_updated_at();

drop trigger if exists groups_set_updated_at on public.groups;
create trigger groups_set_updated_at before update on public.groups
for each row execute function public.set_updated_at();

drop trigger if exists group_members_set_updated_at on public.group_members;
create trigger group_members_set_updated_at before update on public.group_members
for each row execute function public.set_updated_at();

drop trigger if exists season_standings_set_updated_at on public.season_standings;
create trigger season_standings_set_updated_at before update on public.season_standings
for each row execute function public.set_updated_at();

drop trigger if exists profile_stats_set_updated_at on public.profile_stats;
create trigger profile_stats_set_updated_at before update on public.profile_stats
for each row execute function public.set_updated_at();

drop trigger if exists badges_set_updated_at on public.badges;
create trigger badges_set_updated_at before update on public.badges
for each row execute function public.set_updated_at();

drop trigger if exists event_sync_state_set_updated_at on public.event_sync_state;
create trigger event_sync_state_set_updated_at before update on public.event_sync_state
for each row execute function public.set_updated_at();

drop trigger if exists ai_generations_set_updated_at on public.ai_generations;
create trigger ai_generations_set_updated_at before update on public.ai_generations
for each row execute function public.set_updated_at();

alter table public.competitions enable row level security;
alter table public.seasons enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_challenges enable row level security;
alter table public.season_standings enable row level security;
alter table public.profile_stats enable row level security;
alter table public.badges enable row level security;
alter table public.profile_badges enable row level security;
alter table public.notifications enable row level security;
alter table public.event_sync_state enable row level security;
alter table public.ai_generations enable row level security;

drop policy if exists "public read competitions" on public.competitions;
create policy "public read competitions" on public.competitions
for select using (true);

drop policy if exists "public read seasons" on public.seasons;
create policy "public read seasons" on public.seasons
for select using (true);

drop policy if exists "public read groups" on public.groups;
create policy "public read groups" on public.groups
for select using (visibility <> 'private');

drop policy if exists "public read group members" on public.group_members;
create policy "public read group members" on public.group_members
for select using (
  exists (
    select 1
    from public.groups g
    where g.id = group_id
      and g.visibility <> 'private'
  )
);

drop policy if exists "public read group challenges" on public.group_challenges;
create policy "public read group challenges" on public.group_challenges
for select using (
  exists (
    select 1
    from public.groups g
    where g.id = group_id
      and g.visibility <> 'private'
  )
);

drop policy if exists "public read season standings" on public.season_standings;
create policy "public read season standings" on public.season_standings
for select using (
  exists (
    select 1
    from public.groups g
    where g.id = group_id
      and g.visibility <> 'private'
  )
);

drop policy if exists "public read profile stats" on public.profile_stats;
create policy "public read profile stats" on public.profile_stats
for select using (true);

drop policy if exists "public read badges" on public.badges;
create policy "public read badges" on public.badges
for select using (true);

drop policy if exists "public read profile badges" on public.profile_badges;
create policy "public read profile badges" on public.profile_badges
for select using (true);

drop policy if exists "public read event sync state" on public.event_sync_state;
create policy "public read event sync state" on public.event_sync_state
for select using (true);

drop policy if exists "public read ai generations" on public.ai_generations;
create policy "public read ai generations" on public.ai_generations
for select using (true);

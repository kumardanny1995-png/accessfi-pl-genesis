create extension if not exists pgcrypto;

do $$
begin
  create type match_status as enum ('scheduled', 'locked', 'live', 'completed', 'cancelled');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type challenge_status as enum ('open', 'locked', 'settled', 'archived', 'cancelled');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type settlement_status as enum ('pending', 'settled');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type challenge_visibility as enum ('public', 'unlisted', 'private');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type participant_status as enum ('joined', 'submitted', 'withdrawn');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type question_answer_type as enum ('single_select', 'free_text', 'numeric_range');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type share_surface as enum ('native', 'whatsapp', 'telegram', 'copy', 'card');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type share_stage as enum ('pre_match', 'results');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type team_role as enum ('side_a', 'side_b');
exception
  when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.sports (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  sport_id uuid not null references public.sports(id) on delete cascade,
  slug text not null unique,
  short_name text not null,
  full_name text not null,
  logo_url text,
  primary_color text,
  secondary_color text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text unique,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guest_profiles (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  avatar_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  sport_id uuid not null references public.sports(id) on delete restrict,
  slug text not null unique,
  title text not null,
  competition_name text not null,
  venue text,
  start_time timestamptz not null,
  lock_time timestamptz not null,
  status match_status not null default 'scheduled',
  settlement_status settlement_status not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  created_by_user_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint matches_lock_before_start check (lock_time <= start_time)
);

create table if not exists public.match_teams (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete restrict,
  role team_role not null,
  created_at timestamptz not null default now(),
  unique (match_id, role),
  unique (match_id, team_id)
);

create table if not exists public.prediction_questions (
  id uuid primary key default gen_random_uuid(),
  sport_id uuid not null references public.sports(id) on delete restrict,
  match_id uuid not null references public.matches(id) on delete cascade,
  key text not null,
  prompt text not null,
  description text,
  answer_type question_answer_type not null default 'single_select',
  is_required boolean not null default true,
  sort_order integer not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (match_id, key),
  unique (match_id, sort_order)
);

create table if not exists public.prediction_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.prediction_questions(id) on delete cascade,
  label text not null,
  value text not null,
  sort_order integer not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (question_id, value),
  unique (question_id, sort_order)
);

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  slug text not null unique,
  title text not null,
  stake_text text,
  share_message text,
  status challenge_status not null default 'open',
  visibility challenge_visibility not null default 'public',
  created_by_user_id uuid references public.users(id) on delete set null,
  created_by_guest_profile_id uuid references public.guest_profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.challenge_participants (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  guest_profile_id uuid references public.guest_profiles(id) on delete set null,
  display_name text not null,
  public_code text not null unique,
  private_token uuid not null default gen_random_uuid(),
  entry_status participant_status not null default 'joined',
  is_creator boolean not null default false,
  total_points integer not null default 0,
  rank integer,
  joined_at timestamptz not null default now(),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint challenge_participants_identity_check check (user_id is not null or guest_profile_id is not null)
);

create unique index if not exists challenge_participants_unique_user_per_challenge
  on public.challenge_participants (challenge_id, user_id)
  where user_id is not null;

create unique index if not exists challenge_participants_unique_guest_per_challenge
  on public.challenge_participants (challenge_id, guest_profile_id)
  where guest_profile_id is not null;

create table if not exists public.participant_predictions (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.challenge_participants(id) on delete cascade,
  question_id uuid not null references public.prediction_questions(id) on delete cascade,
  selected_option_id uuid references public.prediction_options(id) on delete set null,
  selected_value_text text,
  selected_value_numeric numeric(10, 2),
  locked_at timestamptz not null default now(),
  is_correct boolean,
  points_awarded integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (participant_id, question_id)
);

create table if not exists public.match_outcomes (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null unique references public.matches(id) on delete cascade,
  settled_by_user_id uuid references public.users(id) on delete set null,
  settled_by_guest_profile_id uuid references public.guest_profiles(id) on delete set null,
  notes text,
  settled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.match_outcome_answers (
  id uuid primary key default gen_random_uuid(),
  match_outcome_id uuid not null references public.match_outcomes(id) on delete cascade,
  question_id uuid not null references public.prediction_questions(id) on delete cascade,
  resolved_option_id uuid references public.prediction_options(id) on delete set null,
  resolved_value_text text,
  resolved_value_numeric numeric(10, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (match_outcome_id, question_id)
);

create table if not exists public.challenge_scores (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  participant_id uuid not null references public.challenge_participants(id) on delete cascade,
  correct_count integer not null default 0,
  total_points integer not null default 0,
  accuracy_pct numeric(5, 2) not null default 0,
  result_rank integer,
  tiebreak_reason text,
  calculated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (challenge_id, participant_id)
);

create table if not exists public.share_events (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references public.challenges(id) on delete cascade,
  participant_id uuid references public.challenge_participants(id) on delete set null,
  share_surface share_surface not null,
  share_stage share_stage not null,
  target_url text,
  message_template text,
  created_at timestamptz not null default now()
);

create index if not exists matches_start_time_idx on public.matches (start_time);
create index if not exists matches_status_idx on public.matches (status, settlement_status);
create index if not exists challenges_match_id_idx on public.challenges (match_id, status);
create index if not exists challenge_participants_challenge_id_idx on public.challenge_participants (challenge_id);
create index if not exists participant_predictions_participant_id_idx on public.participant_predictions (participant_id);
create index if not exists participant_predictions_question_id_idx on public.participant_predictions (question_id);
create index if not exists share_events_challenge_id_idx on public.share_events (challenge_id, created_at desc);

drop trigger if exists sports_set_updated_at on public.sports;
create trigger sports_set_updated_at before update on public.sports
for each row execute function public.set_updated_at();

drop trigger if exists teams_set_updated_at on public.teams;
create trigger teams_set_updated_at before update on public.teams
for each row execute function public.set_updated_at();

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists guest_profiles_set_updated_at on public.guest_profiles;
create trigger guest_profiles_set_updated_at before update on public.guest_profiles
for each row execute function public.set_updated_at();

drop trigger if exists matches_set_updated_at on public.matches;
create trigger matches_set_updated_at before update on public.matches
for each row execute function public.set_updated_at();

drop trigger if exists prediction_questions_set_updated_at on public.prediction_questions;
create trigger prediction_questions_set_updated_at before update on public.prediction_questions
for each row execute function public.set_updated_at();

drop trigger if exists prediction_options_set_updated_at on public.prediction_options;
create trigger prediction_options_set_updated_at before update on public.prediction_options
for each row execute function public.set_updated_at();

drop trigger if exists challenges_set_updated_at on public.challenges;
create trigger challenges_set_updated_at before update on public.challenges
for each row execute function public.set_updated_at();

drop trigger if exists challenge_participants_set_updated_at on public.challenge_participants;
create trigger challenge_participants_set_updated_at before update on public.challenge_participants
for each row execute function public.set_updated_at();

drop trigger if exists participant_predictions_set_updated_at on public.participant_predictions;
create trigger participant_predictions_set_updated_at before update on public.participant_predictions
for each row execute function public.set_updated_at();

drop trigger if exists match_outcomes_set_updated_at on public.match_outcomes;
create trigger match_outcomes_set_updated_at before update on public.match_outcomes
for each row execute function public.set_updated_at();

drop trigger if exists match_outcome_answers_set_updated_at on public.match_outcome_answers;
create trigger match_outcome_answers_set_updated_at before update on public.match_outcome_answers
for each row execute function public.set_updated_at();

drop trigger if exists challenge_scores_set_updated_at on public.challenge_scores;
create trigger challenge_scores_set_updated_at before update on public.challenge_scores
for each row execute function public.set_updated_at();

alter table public.sports enable row level security;
alter table public.teams enable row level security;
alter table public.users enable row level security;
alter table public.guest_profiles enable row level security;
alter table public.matches enable row level security;
alter table public.match_teams enable row level security;
alter table public.prediction_questions enable row level security;
alter table public.prediction_options enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_participants enable row level security;
alter table public.participant_predictions enable row level security;
alter table public.match_outcomes enable row level security;
alter table public.match_outcome_answers enable row level security;
alter table public.challenge_scores enable row level security;
alter table public.share_events enable row level security;

drop policy if exists "public read sports" on public.sports;
create policy "public read sports" on public.sports
for select using (true);

drop policy if exists "public read teams" on public.teams;
create policy "public read teams" on public.teams
for select using (true);

drop policy if exists "public read matches" on public.matches;
create policy "public read matches" on public.matches
for select using (true);

drop policy if exists "public read match teams" on public.match_teams;
create policy "public read match teams" on public.match_teams
for select using (true);

drop policy if exists "public read prediction questions" on public.prediction_questions;
create policy "public read prediction questions" on public.prediction_questions
for select using (true);

drop policy if exists "public read prediction options" on public.prediction_options;
create policy "public read prediction options" on public.prediction_options
for select using (true);

drop policy if exists "public read challenges" on public.challenges;
create policy "public read challenges" on public.challenges
for select using (visibility <> 'private');

drop policy if exists "public read challenge participants" on public.challenge_participants;
create policy "public read challenge participants" on public.challenge_participants
for select using (
  exists (
    select 1
    from public.challenges c
    where c.id = challenge_id
      and c.visibility <> 'private'
  )
);

drop policy if exists "public read participant predictions" on public.participant_predictions;
create policy "public read participant predictions" on public.participant_predictions
for select using (
  exists (
    select 1
    from public.challenge_participants cp
    join public.challenges c on c.id = cp.challenge_id
    where cp.id = participant_id
      and c.visibility <> 'private'
  )
);

drop policy if exists "public read match outcomes" on public.match_outcomes;
create policy "public read match outcomes" on public.match_outcomes
for select using (true);

drop policy if exists "public read match outcome answers" on public.match_outcome_answers;
create policy "public read match outcome answers" on public.match_outcome_answers
for select using (true);

drop policy if exists "public read challenge scores" on public.challenge_scores;
create policy "public read challenge scores" on public.challenge_scores
for select using (
  exists (
    select 1
    from public.challenges c
    where c.id = challenge_id
      and c.visibility <> 'private'
  )
);

do $$
begin
  create type accessfi_access_type as enum (
    'deposit_to_unlock',
    'subscription_access',
    'token_gated_access',
    'allowlist_access',
    'time_based_access'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type accessfi_membership_status as enum ('pending', 'active', 'paused', 'expired', 'cancelled');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type accessfi_unlock_status as enum ('pending', 'granted', 'blocked', 'failed');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type accessfi_storage_provider as enum ('storacha', 'filecoin', 'local_demo');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type accessfi_checkout_provider as enum ('flow_wallet', 'near_intent', 'email_passkey');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.accessfi_vaults (
  id uuid primary key default gen_random_uuid(),
  creator_user_id uuid references public.users(id) on delete set null,
  creator_name text not null,
  creator_avatar_url text,
  title text not null,
  slug text not null unique,
  teaser text not null,
  description text not null,
  thumbnail_url text,
  preview_url text,
  access_type accessfi_access_type not null,
  deposit_amount numeric(12, 2),
  subscription_amount numeric(12, 2),
  currency text not null default 'USDC',
  published boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.accessfi_assets (
  id uuid primary key default gen_random_uuid(),
  vault_id uuid not null references public.accessfi_vaults(id) on delete cascade,
  title text not null,
  original_file_name text not null,
  mime_type text not null,
  size_bytes bigint not null default 0,
  encrypted boolean not null default true,
  storage_provider accessfi_storage_provider not null default 'local_demo',
  storage_ref text not null,
  encryption_ref text not null,
  preview_text text not null default '',
  encrypted_payload_b64 text,
  created_at timestamptz not null default now()
);

create table if not exists public.accessfi_access_policies (
  id uuid primary key default gen_random_uuid(),
  vault_id uuid not null unique references public.accessfi_vaults(id) on delete cascade,
  policy_type accessfi_access_type not null,
  policy_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.accessfi_memberships (
  id uuid primary key default gen_random_uuid(),
  vault_id uuid not null references public.accessfi_vaults(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  plan_type accessfi_access_type not null,
  status accessfi_membership_status not null default 'pending',
  deposit_amount numeric(12, 2),
  reserved_balance numeric(12, 2),
  subscription_amount numeric(12, 2),
  currency text not null default 'USDC',
  payment_provider accessfi_checkout_provider not null default 'email_passkey',
  external_account_ref text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  start_at timestamptz,
  end_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (vault_id, user_id)
);

create table if not exists public.accessfi_unlock_events (
  id uuid primary key default gen_random_uuid(),
  vault_id uuid not null references public.accessfi_vaults(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  membership_id uuid references public.accessfi_memberships(id) on delete set null,
  asset_id uuid references public.accessfi_assets(id) on delete set null,
  access_type accessfi_access_type not null,
  status accessfi_unlock_status not null,
  provider text not null,
  tx_ref text,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.accessfi_allowlist_entries (
  id uuid primary key default gen_random_uuid(),
  vault_id uuid not null references public.accessfi_vaults(id) on delete cascade,
  identifier text not null,
  identifier_type text not null default 'email',
  created_at timestamptz not null default now()
);

create table if not exists public.accessfi_checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  vault_id uuid not null references public.accessfi_vaults(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  provider accessfi_checkout_provider not null,
  status text not null default 'pending',
  amount numeric(12, 2) not null default 0,
  currency text not null default 'USDC',
  tx_ref text,
  quote_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists accessfi_vaults_creator_idx on public.accessfi_vaults (creator_user_id, updated_at desc);
create index if not exists accessfi_assets_vault_idx on public.accessfi_assets (vault_id, created_at desc);
create index if not exists accessfi_memberships_user_idx on public.accessfi_memberships (user_id, updated_at desc);
create index if not exists accessfi_unlock_events_vault_idx on public.accessfi_unlock_events (vault_id, created_at desc);
create index if not exists accessfi_checkout_sessions_user_idx on public.accessfi_checkout_sessions (user_id, created_at desc);

drop trigger if exists accessfi_vaults_set_updated_at on public.accessfi_vaults;
create trigger accessfi_vaults_set_updated_at before update on public.accessfi_vaults
for each row execute function public.set_updated_at();

drop trigger if exists accessfi_access_policies_set_updated_at on public.accessfi_access_policies;
create trigger accessfi_access_policies_set_updated_at before update on public.accessfi_access_policies
for each row execute function public.set_updated_at();

drop trigger if exists accessfi_memberships_set_updated_at on public.accessfi_memberships;
create trigger accessfi_memberships_set_updated_at before update on public.accessfi_memberships
for each row execute function public.set_updated_at();

drop trigger if exists accessfi_checkout_sessions_set_updated_at on public.accessfi_checkout_sessions;
create trigger accessfi_checkout_sessions_set_updated_at before update on public.accessfi_checkout_sessions
for each row execute function public.set_updated_at();

alter table public.accessfi_vaults enable row level security;
alter table public.accessfi_assets enable row level security;
alter table public.accessfi_access_policies enable row level security;
alter table public.accessfi_memberships enable row level security;
alter table public.accessfi_unlock_events enable row level security;
alter table public.accessfi_allowlist_entries enable row level security;
alter table public.accessfi_checkout_sessions enable row level security;

drop policy if exists "public read accessfi vaults" on public.accessfi_vaults;
create policy "public read accessfi vaults" on public.accessfi_vaults
for select using (published = true);

drop policy if exists "public read accessfi assets" on public.accessfi_assets;
create policy "public read accessfi assets" on public.accessfi_assets
for select using (
  exists (
    select 1
    from public.accessfi_vaults vaults
    where vaults.id = vault_id
      and vaults.published = true
  )
);

drop policy if exists "public read accessfi policies" on public.accessfi_access_policies;
create policy "public read accessfi policies" on public.accessfi_access_policies
for select using (
  exists (
    select 1
    from public.accessfi_vaults vaults
    where vaults.id = vault_id
      and vaults.published = true
  )
);

drop policy if exists "user read own accessfi memberships" on public.accessfi_memberships;
create policy "user read own accessfi memberships" on public.accessfi_memberships
for select using (auth.uid() = user_id);

drop policy if exists "user read own accessfi unlock events" on public.accessfi_unlock_events;
create policy "user read own accessfi unlock events" on public.accessfi_unlock_events
for select using (auth.uid() = user_id);

drop policy if exists "user read own accessfi checkout sessions" on public.accessfi_checkout_sessions;
create policy "user read own accessfi checkout sessions" on public.accessfi_checkout_sessions
for select using (auth.uid() = user_id);

-- Giallo-Aria initial schema.
-- Single-device party game platform. NO multiplayer-room tables by design.
-- All user/admin tables have Row Level Security enabled.

create extension if not exists "pgcrypto";

-- ---------- enums ----------
create type app_role as enum ('user', 'moderator', 'admin');
create type source_type as enum ('official', 'community', 'private', 'imported');
create type content_status as enum ('draft', 'pending', 'approved', 'rejected', 'archived');
create type difficolta as enum ('Facile', 'Medio', 'Difficile', 'Estremo');
create type intensita as enum ('Tranquillo', 'Divertente', 'Audace', 'Caotico');

-- ---------- updated_at helper ----------
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------- profiles ----------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();

-- ---------- user_roles ----------
create table user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null default 'user',
  primary key (user_id, role)
);

-- security-definer helpers (avoid recursive RLS lookups)
create or replace function has_role(uid uuid, r app_role) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from user_roles where user_id = uid and role = r);
$$;

create or replace function is_staff(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from user_roles where user_id = uid and role in ('moderator','admin'));
$$;

-- ---------- categories ----------
create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nome text not null,
  icona text,
  game_types text[] not null default '{}',
  attiva boolean not null default true,
  ordine int not null default 0
);

-- ---------- game_content ----------
create table game_content (
  id uuid primary key default gen_random_uuid(),
  game_type text not null,
  content_type text not null default 'prompt',
  prompt text not null,
  secondary_prompt text,
  answer text,
  forbidden_words text[],
  category_id uuid references categories(id) on delete set null,
  difficolta difficolta not null default 'Facile',
  intensita intensita not null default 'Divertente',
  minimum_age int not null default 0,
  language text not null default 'it',
  source_type source_type not null default 'official',
  created_by uuid references auth.users(id) on delete set null,
  status content_status not null default 'approved',
  is_official boolean not null default false,
  is_featured boolean not null default false,
  usage_count int not null default 0,
  skip_count int not null default 0,
  report_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_content_updated before update on game_content
  for each row execute function set_updated_at();

create index idx_content_filter on game_content (game_type, status, minimum_age, intensita, difficolta);
create index idx_content_owner on game_content (created_by);
create index idx_content_category on game_content (category_id);

-- ---------- reports / favourites / saved data / history / aggregates ----------
create table content_reports (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references game_content(id) on delete cascade,
  reporter uuid references auth.users(id) on delete set null,
  reason text not null,
  resolved boolean not null default false,
  resolution_notes text,
  created_at timestamptz not null default now()
);

create table content_favourites (
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id uuid not null references game_content(id) on delete cascade,
  primary key (user_id, content_id)
);

create table saved_player_groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  players jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table saved_game_presets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  config jsonb not null,
  created_at timestamptz not null default now()
);

create table saved_game_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_type text not null,
  summary jsonb not null,
  created_at timestamptz not null default now()
);

create table content_usage_aggregates (
  content_id uuid primary key references game_content(id) on delete cascade,
  usage_count int not null default 0,
  skip_count int not null default 0,
  updated_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor uuid references auth.users(id) on delete set null,
  action text not null,
  target text,
  details jsonb,
  created_at timestamptz not null default now()
);

create table maintenance_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running',
  affected_records int not null default 0,
  error text
);

-- auto-create a profile row on signup
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, display_name) values (new.id, new.raw_user_meta_data->>'display_name')
  on conflict (id) do nothing;
  insert into user_roles (user_id, role) values (new.id, 'user')
  on conflict do nothing;
  return new;
end;
$$;
create trigger trg_new_user after insert on auth.users
  for each row execute function handle_new_user();

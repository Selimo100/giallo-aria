-- Indovina la parola: the fourth game.
--
-- Words are rows in the existing `game_content` table
-- (game_type = 'indovina-la-parola', content_type = 'word') and are already
-- covered by the read/owner/staff policies in 0002_rls.sql. This migration adds:
--   * an optional `hint` column for the describing players,
--   * a `personal_categories` table so signed-in users can group their own
--     words into private categories, protected by RLS,
--   * supporting indexes.

-- ---------- optional hint on content ----------
alter table game_content
  add column if not exists hint text;

-- ---------- personal (user-owned) categories ----------
create table if not exists personal_categories (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users(id) on delete cascade,
  game_type text not null,
  nome text not null,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- a user cannot create two categories with the same name for the same game
  unique (owner, game_type, nome)
);
drop trigger if exists trg_personal_categories_updated on personal_categories;
create trigger trg_personal_categories_updated before update on personal_categories
  for each row execute function set_updated_at();

-- Let content reference a personal category (in addition to official ones).
alter table game_content
  add column if not exists personal_category_id uuid
    references personal_categories(id) on delete set null;

-- ---------- indexes ----------
-- game type + content type + status + source + active-ish (approved) filtering.
create index if not exists idx_content_gtw
  on game_content (game_type, content_type, status, source_type)
  where game_type = 'indovina-la-parola';
create index if not exists idx_content_creator_source
  on game_content (created_by, source_type);
create index if not exists idx_personal_categories_owner
  on personal_categories (owner, game_type, is_archived);

-- ---------- RLS ----------
alter table personal_categories enable row level security;

-- A user fully manages only their own categories; nobody else can read them.
drop policy if exists personal_categories_owner_rw on personal_categories;
create policy personal_categories_owner_rw on personal_categories
  for all using (owner = auth.uid()) with check (owner = auth.uid());
-- Staff may read (for moderation of any linked community submissions).
drop policy if exists personal_categories_staff_read on personal_categories;
create policy personal_categories_staff_read on personal_categories
  for select using (is_staff(auth.uid()));

-- A user may only attach content to a personal category they own. Combined with
-- the existing content_owner_write policy (created_by = auth.uid()), this blocks
-- assigning your content to someone else's category.
create or replace function owns_personal_category(cat uuid, uid uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select cat is null
    or exists (select 1 from personal_categories where id = cat and owner = uid);
$$;

-- Ownership is enforced with a restrictive policy (a CHECK constraint cannot
-- query another table), applied on top of the existing content policies.
drop policy if exists content_personal_category_owner on game_content;
create policy content_personal_category_owner on game_content
  as restrictive for all
  using (owns_personal_category(personal_category_id, auth.uid()))
  with check (owns_personal_category(personal_category_id, auth.uid()));

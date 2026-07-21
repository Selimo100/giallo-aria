-- Obbligo o Verità: extend game_content with truth/dare safety metadata.
-- No new tables and no new RLS policies are required: truth and dare items are
-- rows in the existing `game_content` table (game_type = 'obbligo-o-verita',
-- content_type in ('truth','dare')) and are already covered by the policies in
-- 0002_rls.sql (public read of approved official/community content, owners see
-- their own private content, staff moderate).

alter table game_content
  add column if not exists safe_alternative text,
  add column if not exists recommended_timer_seconds int,
  add column if not exists requires_movement boolean not null default false,
  add column if not exists requires_physical_contact boolean not null default false,
  add column if not exists minimum_players int not null default 2,
  add column if not exists maximum_players int,
  add column if not exists accessibility_notes text;

-- Keep dare content honest: no dare may require physical contact.
alter table game_content
  add constraint game_content_no_contact
  check (content_type <> 'dare' or requires_physical_contact = false);

-- Fast filtering by type within the game.
create index if not exists idx_content_type
  on game_content (game_type, content_type, status);

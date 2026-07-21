-- Shared, account-free content for the static site.
--
-- Product decision: all user-created content is a SINGLE GLOBAL POOL that every
-- visitor can read AND write WITHOUT logging in. There is no per-user ownership
-- here on purpose. RLS is therefore fully permissive (anon + authenticated).
--
-- ⚠️ Security note: because writes are anonymous, ANY visitor can insert, edit
-- or delete ANY row. If spam/abuse becomes a problem, tighten the *_write
-- policies to `to authenticated` (or admin-only) and add a sign-in flow.

-- ---------------------------------------------------------------------------
-- Custom game content (words / questions / dares / hints), one shared library.
-- Column shape mirrors the ContenutoPersonale type in the app.
-- ---------------------------------------------------------------------------
create table if not exists public.shared_content (
  id                 text primary key,           -- "perso-<uuid>" from the client
  game_type          text not null,
  tipo               text,                        -- Obbligo o Verità only
  prompt             text not null,
  categoria          text not null default '',
  intensita          text not null,
  timer_consigliato  integer,
  richiede_movimento boolean,
  safe_alternative   text,
  suggerimento       text,
  attivo             boolean not null default true,
  creato             bigint not null,             -- epoch ms (client Date.now())
  constraint shared_content_prompt_len check (char_length(prompt) between 1 and 400)
);

create index if not exists idx_shared_content_game_creato
  on public.shared_content (game_type, creato desc);

alter table public.shared_content enable row level security;

drop policy if exists shared_content_read on public.shared_content;
create policy shared_content_read on public.shared_content
  for select to anon, authenticated using (true);

drop policy if exists shared_content_write on public.shared_content;
create policy shared_content_write on public.shared_content
  for all to anon, authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Shared personal categories. Mirrors the CategoriaPersonale type.
-- ---------------------------------------------------------------------------
create table if not exists public.shared_categories (
  id         text primary key,                    -- "cat-<uuid>" from the client
  game_type  text not null,
  nome       text not null,
  archiviata boolean not null default false,
  creato     bigint not null
);

create index if not exists idx_shared_categories_game
  on public.shared_categories (game_type, archiviata);

alter table public.shared_categories enable row level security;

drop policy if exists shared_categories_read on public.shared_categories;
create policy shared_categories_read on public.shared_categories
  for select to anon, authenticated using (true);

drop policy if exists shared_categories_write on public.shared_categories;
create policy shared_categories_write on public.shared_categories
  for all to anon, authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Shared memory notes (the /ricordi page). Also global by product decision.
-- Mirrors MemoryNoteRecord, minus the auth user_id.
-- ---------------------------------------------------------------------------
create table if not exists public.shared_memory_notes (
  id         text primary key,                    -- "memory-<uuid>" from the client
  title      text,
  body       text not null,
  media_id   text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shared_memory_notes_title_len check (title is null or char_length(title) <= 80),
  constraint shared_memory_notes_body_len check (char_length(body) between 2 and 1200)
);

create index if not exists idx_shared_memory_notes_created
  on public.shared_memory_notes (created_at desc);

alter table public.shared_memory_notes enable row level security;

drop policy if exists shared_memory_notes_read on public.shared_memory_notes;
create policy shared_memory_notes_read on public.shared_memory_notes
  for select to anon, authenticated using (true);

drop policy if exists shared_memory_notes_write on public.shared_memory_notes;
create policy shared_memory_notes_write on public.shared_memory_notes
  for all to anon, authenticated using (true) with check (true);

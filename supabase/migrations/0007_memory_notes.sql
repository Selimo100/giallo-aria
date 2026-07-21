create table public.memory_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  body text not null,
  media_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint memory_notes_title_length check (title is null or char_length(title) <= 80),
  constraint memory_notes_body_length check (char_length(body) between 2 and 1200),
  constraint memory_notes_media_id_length check (media_id is null or char_length(media_id) <= 120)
);

create trigger trg_memory_notes_updated before update on public.memory_notes
  for each row execute function set_updated_at();

create index idx_memory_notes_user_created_at on public.memory_notes (user_id, created_at desc);
create index idx_memory_notes_media_id on public.memory_notes (media_id);

alter table public.memory_notes enable row level security;

create policy memory_notes_self on public.memory_notes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

# Giallo-Aria — Supabase setup guide

This guide is written for a developer configuring Supabase for the first time.
Follow the numbered steps in order.

> **Note.** Local gameplay (L'Impostore, Chi è più probabile?) works with **zero**
> Supabase configuration — the official Italian content is bundled in the app.
> Supabase is only required for the optional backend: accounts, custom content,
> favourites, presets, moderation, admin, and the weekly maintenance job.
>
> The weekly maintenance task in this project uses **pg_cron** (a SQL function),
> not an Edge Function, so no `supabase functions deploy` step is required.

---

## 44.1 Create the Supabase project

1. Go to <https://supabase.com> and **Sign up** (GitHub login is easiest).
2. If prompted, **create a new organisation** (any name, e.g. your team).
3. Click **New project**.
4. **Name:** `giallo-aria`.
5. **Region:** choose the one closest to your players (e.g. *West EU (Ireland)*).
6. **Database password:** click *Generate a password*, then store it in your
   password manager. You will need it when linking the CLI.
7. Click **Create new project** and wait ~2 minutes until the status is *Active*.

## 44.2 Find the API credentials

Dashboard → **Project Settings → API**:

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL` — safe for the browser.
- **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY` — safe for the browser
  *together with RLS*.
- **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` — **secret. Server-side only.
  Never expose in frontend code. Never commit it.**
- **Project reference ID** (also in **Settings → General**) — used for CLI linking.

## 44.3 Create the local environment file

Copy the template and fill in the values from 44.2:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=YOUR_PROJECT_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
CRON_SECRET=CREATE_A_LONG_RANDOM_SECRET
```

Create a strong `CRON_SECRET`:

```bash
openssl rand -hex 32
```

`.env.local` is already listed in `.gitignore` — **never commit it**.

## 44.4 Install the Supabase CLI

- **macOS (Homebrew):** `brew install supabase/tap/supabase`
- **Windows (Scoop):** `scoop bucket add supabase https://github.com/supabase/scoop-bucket.git && scoop install supabase`
- **Linux:** download the latest release from
  <https://github.com/supabase/cli/releases> and place it on your `PATH`.
- **npm (any OS):** `npm install -D supabase` then prefix commands with `npx`.

Verify:

```bash
supabase --version
```

## 44.5 Log in through the CLI

```bash
supabase login
```

A browser tab opens; approve the access token. The CLI stores it locally.

## 44.6 Link the local repository

Find the project reference ID (Settings → General → *Reference ID*), then:

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

When asked, enter the **database password** from step 44.1.

## 44.7 Run database migrations

Migration files in `supabase/migrations/`:

- `0001_init.sql` — enums, tables, triggers, helper functions.
- `0002_rls.sql` — Row Level Security policies.
- `0003_maintenance.sql` — the weekly maintenance function.
- `0004_obbligo_verita.sql` — adds truth/dare safety columns to `game_content`
  (`safe_alternative`, `recommended_timer_seconds`, `requires_movement`,
  `requires_physical_contact`, `minimum_players`, `maximum_players`,
  `accessibility_notes`), a check constraint that forbids physical-contact dares,
  and an index on `(game_type, content_type, status)`.
- `0007_memory_notes.sql` — creates owner-only `memory_notes` for `/ricordi`,
  with optional hardcoded `media_id`, validation constraints, indexes, and the
  shared `updated_at` trigger.

Apply them:

```bash
supabase db push
```

Verify in **Dashboard → Table Editor** that these tables exist: `profiles`,
`user_roles`, `categories`, `game_content`, `content_reports`,
`content_favourites`, `saved_player_groups`, `saved_game_presets`,
`saved_game_history`, `content_usage_aggregates`, `audit_logs`,
`maintenance_runs`, `memory_notes`.

## 44.8 Run seed data

Two idempotent seed files, both safe to run repeatedly. Run **categories first**
(the content links to them), then the content:

```bash
# 1) categories
supabase db query --file supabase/seed/seed.sql
# 2) all official Italian content (~379 rows into game_content)
supabase db query --file supabase/seed/content.sql
```

Or, once the CLI is linked, simply:

```bash
npm run db:seed
```

`supabase/seed/content.sql` is generated from the bundled app content by
`npm run db:seed:sql` (script: `scripts/generate-seed.ts`). Regenerate it
whenever you change the files under `src/features/content/`. It uses
deterministic UUIDv5 ids and upserts on the primary key, so re-running never
creates duplicates.

Verify in **Table Editor → categories** that the categories appear — 12 for
L'Impostore and 13 for Obbligo o Verità — and in **game_content** that ~379 rows
exist. Quick check in the SQL editor:

```sql
select game_type, count(*) from game_content group by game_type order by game_type;
```

The full official content is bundled in the app for offline play:

- Truth questions & dares: `src/features/content/obbligo-verita.ts`
  (`tipo: 'truth'` / `tipo: 'dare'`, with `safeAlternative`, `timerConsigliato`,
  `richiedeMovimento`, `richiedeContatto`, `minGiocatori`).
- Impostor words: `src/features/content/impostore.ts`.
- Chi è più probabile? questions: `src/features/content/chi-e-piu-probabile.ts`.

### Verify truth / dare content once loaded into `game_content`

When you load OV content into the backend for admin management, verify it:

```sql
-- how many truths vs dares
select content_type, count(*) from game_content
where game_type = 'obbligo-o-verita' group by content_type;

-- dares must never require physical contact (constraint enforces this)
select count(*) from game_content
where content_type = 'dare' and requires_physical_contact = true;  -- expect 0

-- every movement dare should carry a safe alternative
select count(*) from game_content
where content_type = 'dare' and requires_movement = true and safe_alternative is null;
```

**How OV content is stored.** Truth and dare items are ordinary `game_content`
rows (`game_type = 'obbligo-o-verita'`). A **safe alternative** is stored either
as the row's `safe_alternative` text or, if absent, resolved at runtime to
another compatible non-movement/non-contact dare. Custom truth/dare content
created by a signed-in user is the same table with `source_type = 'private'`
(owner-only) or `'community'` (enters moderation), protected by the existing
`game_content` RLS policies — no OV-specific policy is required. Moderators and
admins review OV submissions through the same moderation permissions
(`is_staff`).

## 44.9 Configure Supabase Authentication

**Dashboard → Authentication → Providers → Email:** enable **Email**. For local
development you may disable *Confirm email* to speed up testing.

**Dashboard → Authentication → URL Configuration:**

- **Site URL:** `http://localhost:3000` (use your production URL in prod).
- **Redirect URLs:** add `http://localhost:3000/**` and your production URL.

Magic links can be enabled later in the same Email provider panel.

## 44.10 Configure Row Level Security

RLS restricts every row to the users allowed to see/modify it, at the database
level — so even a leaked anon key cannot read another user's private data.

RLS is enabled by `0002_rls.sql` on all user/admin tables. Verify: **Table
Editor → any table → RLS should read "enabled"**, or run in the SQL editor:

```sql
select relname, relrowsecurity from pg_class
where relname in ('profiles','game_content','saved_game_presets');
```

Manual check:

1. Register account **A**, create a *private* content row.
2. Sign out, register account **B**.
3. As **B**, querying that row returns nothing and updates are rejected.

Repeat the same ownership check for `memory_notes`:

1. Sign in as account **A** and create a note on `/ricordi`.
2. Sign in as account **B`.
3. Account **B** must not be able to read, update, or delete account **A** notes.

## 44.11 Memory page notes and static media

The `/ricordi` page uses:

- `public/media/ricordi/images/` for static photos
- `public/media/ricordi/videos/` for static local videos
- `public/media/ricordi/posters/` for video poster images
- `public/media/ricordi/tracks/` for optional `.vtt` captions
- `src/features/memories/data/memory-media.ts` for the typed central media configuration
- `public.memory_notes` for private written notes

Each note stores only a `media_id` string matching a hardcoded config entry such
as `memory-photo-01` or `memory-video-01`. There is deliberately **no** media
table in Supabase for the static files.

### `memory_notes` schema

The migration `0007_memory_notes.sql` creates:

```sql
create table public.memory_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  body text not null,
  media_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Validation and indexing:

- `title` max 80 characters
- `body` between 2 and 1200 characters
- `media_id` max 120 characters
- index on `(user_id, created_at desc)`
- index on `(media_id)`

RLS policy:

- every operation requires `user_id = auth.uid()`

### Adding a new hardcoded image

1. Put the file in `public/media/ricordi/images/`
2. Add a stable id entry in `src/features/memories/data/memory-media.ts`
3. Write natural Italian `alt`, caption, and optional `dateLabel`

Example:

```ts
{
  id: "memory-photo-03",
  type: "image",
  src: "/media/ricordi/images/memory-03.jpg",
  alt: "Descrizione accessibile della foto",
  caption: "Una sera rimasta impressa",
  dateLabel: "Luglio 2026",
  aspectRatio: "3/4",
}
```

### Adding a new hardcoded video

Recommended formats:

- MP4 H.264/AAC for broad compatibility
- optional WebM as an additional source

Recommended preparation before commit:

- comprimi il video
- usa una risoluzione sensata
- evita file 4K inutilmente pesanti
- aggiungi un poster
- rimuovi audio non necessario quando possibile

Example:

```ts
{
  id: "memory-video-03",
  type: "video",
  title: "Una serata da ricordare",
  description: "Breve clip del nostro tempo insieme.",
  caption: "Il momento che ci fa ancora sorridere.",
  dateLabel: "Luglio 2026",
  poster: "/media/ricordi/posters/memory-video-03.jpg",
  aspectRatio: "16/9",
  sources: [
    { src: "/media/ricordi/videos/memory-video-03.webm", type: "video/webm" },
    { src: "/media/ricordi/videos/memory-video-03.mp4", type: "video/mp4" },
  ],
  tracks: [
    {
      src: "/media/ricordi/tracks/memory-video-03-it.vtt",
      srcLang: "it",
      label: "Italiano",
      default: true,
    },
  ],
}
```

If a video contains important spoken information, add a `.vtt` track in
`public/media/ricordi/tracks/`.

### Privacy limitation

Anything under `public/` is reachable by URL in the deployed site. That means
the static photos, videos, posters, and caption files on `/ricordi` are **not**
truly private. Only the written notes are private through Supabase RLS.

If the media itself must become private in the future, move it to authenticated
protected storage rather than keeping it in `public/`.

## 44.12 Create the first administrator

1. Register the account normally in the app (or Dashboard → Authentication → Users).
2. **Authentication → Users** → copy the user's **UUID**.
3. **SQL Editor** → run (replace the UUID):

```sql
insert into user_roles (user_id, role)
values ('PASTE-USER-UUID', 'admin')
on conflict do nothing;
```

4. Verify:

```sql
select * from user_roles where user_id = 'PASTE-USER-UUID';
```

## 44.13 Create a moderator

Same as 44.12 but with role `'moderator'`:

```sql
insert into user_roles (user_id, role) values ('PASTE-USER-UUID', 'moderator')
on conflict do nothing;
```

**Moderators** can review, approve, reject and archive community submissions and
resolve reports. **Administrators** can additionally manage roles, categories,
statistics and maintenance.

## 44.14 Configure the weekly maintenance task

This project uses **pg_cron** (no Edge Function). In the SQL Editor:

```sql
-- enable the extension (Dashboard → Database → Extensions also works)
create extension if not exists pg_cron;

-- schedule: every Monday 03:00 UTC
select cron.schedule('giallo-aria-weekly', '0 3 * * 1',
  $$ select run_weekly_maintenance(); $$);
```

Test it manually:

```sql
select run_weekly_maintenance();
select * from maintenance_runs order by started_at desc limit 5;
```

Each run records `started_at`, `finished_at`, `status`, `affected_records` and
any `error`. The function is idempotent — running it twice does not duplicate
data or fabricate activity. Disable the schedule with:

```sql
select cron.unschedule('giallo-aria-weekly');
```

## 44.15 Generate Supabase TypeScript types

```bash
supabase gen types typescript --linked > src/types/database.types.ts
```

Re-run this whenever you change the schema (add/alter migrations).

## 44.16 Start the local application

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. You can play immediately without any backend.

## 44.17 Run checks and tests

```bash
npm run typecheck   # TypeScript
npm run lint        # ESLint
npm test            # Vitest unit tests
npm run build       # production build
```

(Playwright E2E is planned but not yet included.)

## 44.18 Production configuration

On your host (e.g. **Vercel**) add the same variables as `.env.local`:

- Public: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `NEXT_PUBLIC_SITE_URL`.
- Secret: `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`.

Then in Supabase → Authentication → URL Configuration, set **Site URL** to your
production domain and add its redirect URL. Verify sign-in works and repeat the
RLS manual check (44.10) in production. Confirm one local game plays end-to-end.

### Vercel

Project → Settings → Environment Variables → add the six variables → redeploy.

## 44.19 Backup and recovery

- **Backup:** `supabase db dump --file backup.sql` (schema + data), or use the
  Dashboard → Database → Backups (paid plans get automated backups).
- **Export content:** `select * from game_content` → export CSV from the editor.
- **Restore:** apply migrations to a fresh project, then
  `supabase db execute --file backup.sql`.
- Migrations are the source of truth for schema; keep them in Git. Never run
  destructive SQL against production without a fresh backup.

## 44.20 Troubleshooting

| Problem | Likely cause | Fix |
| --- | --- | --- |
| `Invalid API key` | wrong/rotated anon key | re-copy from Settings → API into `.env.local`, restart dev server |
| Requests hit the wrong project | wrong `NEXT_PUBLIC_SUPABASE_URL` | verify the URL matches the project |
| App can't reach Supabase | missing env var | ensure `.env.local` exists and dev server restarted |
| Tables missing | migrations not applied | `supabase db push` |
| Valid user gets "no rows" | RLS blocking | confirm the user's role/ownership; review `0002_rls.sql` |
| Secret leaked to browser | service-role key imported client-side | move it to server-only code; **rotate the key** |
| Auth redirect fails | Site/Redirect URL not set | configure them (44.9) |
| Duplicate seed rows | non-idempotent insert | our `seed.sql` uses `on conflict`; re-run is safe |
| Maintenance failing | check `maintenance_runs.error` | fix cause, re-run `select run_weekly_maintenance();` |
| Types out of date | schema changed | re-run 44.14 |
| Offline content missing | first load never happened | load the app once online; bundled content needs no network after build |

## 44.22 Migration 0005 — removal of the age-level system

The age-level system (fasce d'età / `minimum_age`) has been removed completely
from the application. Content is no longer filtered by age; instead every game
setup uses a **content-source** selector (`ContentSourceMode`):

- `official_only` — *Solo contenuti del gioco*
- `personal_only` — *Solo i miei contenuti*
- `mixed` — *Contenuti del gioco e personali*

`supabase/migrations/0005_remove_age_level.sql` migrates existing databases
safely and idempotently:

1. drops the `idx_content_filter` index (which referenced `minimum_age`);
2. drops `game_content.minimum_age` (and `personal_content.minimum_age` if a
   deployment added it) with `if exists`, so it is non-destructive to unrelated
   content;
3. recreates `idx_content_filter` on `(game_type, status, intensita,
   difficolta)`.

Apply it with the other migrations (`supabase db push`), then regenerate the
TypeScript types (§44.14) so `minimum_age` disappears from the generated
`Database` type. The bundled seed generator (`npm run db:seed:sql`) no longer
emits a `minimum_age` column.

## 44.23 Migration 0006 — Indovina la parola (the fourth game)

`Indovina la parola` is the fourth game (after L'Impostore, Chi è più
probabile? and Obbligo o Verità). Its words are rows in the existing
`game_content` table, so no separate content table is needed:

- `game_type = 'indovina-la-parola'`
- `content_type = 'word'`
- `prompt` holds the word; the optional `hint` column holds a clue for the
  describing players.

`supabase/migrations/0006_indovina_la_parola.sql` adds:

1. `game_content.hint` (optional hint text);
2. a `personal_categories` table so signed-in users can group their own words
   into private, per-game categories (`owner`, `game_type`, `nome`,
   `is_archived`), with a `unique (owner, game_type, nome)` constraint;
3. `game_content.personal_category_id` referencing `personal_categories`;
4. indexes for game type, content type, status, source and creator
   (`idx_content_gtw`, `idx_content_creator_source`,
   `idx_personal_categories_owner`).

### RLS

- Approved official words are publicly readable (existing `content_read`).
- A user reads/creates/updates/deletes only **their own** private words
  (existing `content_owner_write`) — another user cannot read your private
  words.
- `personal_categories` are strictly per-owner (`personal_categories_owner_rw`);
  staff may read for moderation.
- A restrictive policy `content_personal_category_owner` (backed by the
  `owns_personal_category()` security-definer function) prevents assigning your
  content to **another user's** personal category.

### Seeding

`npm run db:seed:sql` regenerates `supabase/seed/content.sql` from the bundled
Italian word bank in `src/features/content/indovina-la-parola.ts` (16 official
categories, 400+ words). The category rows themselves are seeded by
`supabase/seed/seed.sql` (`gtw-*` slugs).

### Verifying

- **Official words** — `select count(*) from game_content where game_type =
  'indovina-la-parola' and status = 'approved';` should be ≥ 400 after seeding.
- **Personal-only mode** — signed in as a normal user, `Solo i miei contenuti`
  must return only that user's active custom words; official words never appear
  (verified by the `combinaFonti` / `costruisciPool` unit tests). If there are
  not enough words the setup blocks the start with a precise message and does
  **not** silently switch source mode.

## 44.21 Final checklist

- [ ] Project `giallo-aria` created
- [ ] `.env.local` configured (public + secret vars)
- [ ] Supabase CLI installed
- [ ] Repository linked
- [ ] Migrations applied (`0001`, `0002`, `0003`, `0004`, `0005`, `0006`)
- [ ] Seed data inserted
- [ ] Authentication configured (email + URLs)
- [ ] RLS verified
- [ ] First administrator created
- [ ] Weekly maintenance scheduled + tested
- [ ] TypeScript types generated
- [ ] `typecheck`, `lint`, `test`, `build` all pass
- [ ] Production variables configured

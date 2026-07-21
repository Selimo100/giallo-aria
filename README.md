# Giallo-Aria 🎈

_Giochi, risate e un soffio di follia._

Giallo-Aria is a local **one-shared-device** party-game platform, entirely in
Italian. All players use a single phone or tablet: pass it around, reveal
information privately, hide it again, play. **No rooms, no room codes, no second
device, no realtime multiplayer** — by design.

## Status

This repository is a working **foundation + two fully-playable flagship games**.

| Area | State |
| --- | --- |
| Design system, brand, light/dark, reduced-motion, safe-areas | ✅ |
| i18n structure (Italian catalog, extensible) | ✅ |
| Shared multi-step setup flow | ✅ |
| Pass-the-phone private reveal (secrets removed from DOM on hide) | ✅ |
| Local session persistence + safe restore (never re-shows a secret) | ✅ |
| **L'Impostore** — full round loop, voting, final guess, scoring | ✅ playable offline |
| **Chi è più probabile?** — group + private sequential voting | ✅ playable offline |
| **Obbligo o Verità** — turns, choice, truth/dare, safe alternatives, timer, skips, scoring | ✅ playable offline |
| Game engine + unit tests (31) | ✅ |
| Supabase schema, RLS, weekly maintenance function | ✅ SQL migrations |
| Other 6 modes, accounts/admin UI, DB seeding, Playwright E2E | ⏳ scaffolded / documented |

Playable games run with **bundled Italian content and no network** — Supabase is
only for the optional account/custom-content/admin backend.

## Commands

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm test           # vitest unit tests
```

## Try the games

1. Open `/` → **Gioca ora**.
2. Setup wizard → pick **L'Impostore**, add 3+ players, choose levels, start.
3. Pass the phone: each player reveals their card, then hides it before passing.
4. Discuss, vote, reveal, score, next round.

## Structure

```
src/
  app/               routes (landing, giochi, partita, static pages)
  components/ui       design-system kit
  components/games    PassaTelefono (reusable private reveal)
  features/games      registry, SetupWizard, PartitaRunner, per-mode engines
  features/content    bundled Italian official content
  lib/game-engine     filtering / selection / shuffle (pure, tested)
  lib/local-storage   safe public-only session persistence
  messages/it.ts      Italian message catalog
  types/domain.ts     shared domain types
supabase/migrations   schema (0001), RLS (0002), maintenance (0003)
supabase/seed         idempotent category seed
tests/unit            engine unit tests
docs/SUPABASE_SETUP.md  full backend setup guide
```

## Backend

See [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md).
# giallo-aria

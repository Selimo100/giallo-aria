# Deploying Giallo-Aria to shared hosting (SFTP/FTP)

Giallo-Aria is exported as **plain static files** (`output: "export"`). There is
**no Node.js, no Next.js server, no serverless function, no API route** at
runtime. You build it on your computer and upload the generated files to any
normal Apache/shared web host. It runs identically anywhere, including from
Egypt without a VPN, because the games are fully client-side.

Production domain: **https://giallo-aria.mogicato.ch**

---

## 1. Build locally

From the project root:

```bash
npm install
npm run typecheck
npm run lint
npm test
npm run build          # produces the static site in out/
npm run verify:static  # checks the export is complete and secret-free
```

If any step fails, fix it before uploading. `npm run verify:static` must end
with `✅ Static export verified`.

## 2. Set the production environment (before building)

Public values are **baked into the build**, so set them *before* `npm run build`.
Create/edit `.env.local` in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=...            # only if you enable the optional account backend
NEXT_PUBLIC_SUPABASE_ANON_KEY=...       # publishable/anon key ONLY — never the service-role key
NEXT_PUBLIC_SITE_URL=https://giallo-aria.mogicato.ch
```

> The core games (all 10) work with **no** Supabase at all. Personal content and
> private memory notes are stored in the browser. Supabase variables are only
> needed if/when you turn on the optional online account backend.

**Never** put `SUPABASE_SERVICE_ROLE_KEY` or `CRON_SECRET` in `.env.local` when
building for upload — they are secrets and would be pointless (and unsafe) in a
static bundle. They belong only in local database-admin scripts.

## 3. Find the generated site

Everything to upload is inside **`out/`**. You can also use the ready-made
archive `giallo-aria-ftp-deploy.zip` (its contents are exactly `out/`).

## 4. Preview locally (recommended)

Because the host serves directory indexes, preview with a static server that
resolves `index.html` inside folders:

```bash
npm run preview:static      # npx serve out
# then open the printed URL, e.g. http://localhost:3000
```

Test these routes directly: `/`, `/giochi/`, `/giochi/impostore/`,
`/contenuti-personali/`, `/ricordi/`, `/partita/nuova/`.

## 5. Upload correctly

Upload the **contents of `out/`** into the site's web root — **not** the `out/`
folder itself.

Correct:

```
WEBROOT/index.html
WEBROOT/_next/
WEBROOT/giochi/
WEBROOT/ricordi/
WEBROOT/contenuti-personali/
WEBROOT/media/
WEBROOT/.htaccess
```

Wrong:

```
WEBROOT/out/index.html   ← do NOT nest an extra out/ folder
```

Make sure hidden files are shown in your FTP client so **`.htaccess`** is
uploaded too.

### Finding the web root

Common names: `public_html`, `httpdocs`, `htdocs`, `www`. For the
`giallo-aria` subdomain it may be a dedicated folder (e.g.
`giallo-aria.mogicato.ch/`). Check your hosting panel.

### Use SFTP

Prefer **SFTP** (encrypted) over plain FTP. Any client works —
[FileZilla](https://filezilla-project.org/) or
[Cyberduck](https://cyberduck.io/) are common, but not required.

### Remove default placeholder files

If the web root already contains an `index.php`, `index.html` or a host
"coming soon" page, **delete it** — otherwise it may hide the uploaded app.

### File permissions

Use normal static permissions:

- directories: `755`
- files: `644`

Never use `777`.

## 6. Supabase configuration (only if using accounts)

In the Supabase dashboard → Authentication → URL configuration:

- **Site URL:** `https://giallo-aria.mogicato.ch`
- **Redirect URLs:**
  - `http://localhost:3000/**`
  - `https://giallo-aria.mogicato.ch/**`

All private data is protected by **Row Level Security** (`auth.uid()`), because
the browser talks to Supabase directly. Client-side hiding of account sections
is for UX only — RLS is the real security boundary.

## 7. HTTPS

The domain must have a valid SSL certificate from the host (most panels offer
free Let's Encrypt). Do **not** disable HTTPS verification anywhere.

## 8. Testing checklist (open each directly in the browser)

- [ ] Homepage `/`
- [ ] Games overview `/giochi/`
- [ ] `/giochi/impostore/`
- [ ] `/giochi/chi-e-piu-probabile/`
- [ ] `/giochi/obbligo-o-verita/`
- [ ] `/giochi/indovina-la-parola/`
- [ ] Personal content `/contenuti-personali/`
- [ ] Memories `/ricordi/`
- [ ] Images load, videos play
- [ ] Create / edit / delete a memory note
- [ ] Refresh a deep page (e.g. `/giochi/impostore/`) — it must load directly
- [ ] Mobile access (one shared phone)
- [ ] Access from Egypt without a VPN
- [ ] Sign-in / sign-out (only if the account backend is enabled)

## 9. Rollback

Before overwriting an existing site, download/back up the current web root (or
rename it, e.g. `public_html` → `public_html.bak`). To roll back, restore that
backup.

## 10. Troubleshooting

- **Old page still shows** → a leftover `index.php`/`index.html` is being served,
  or browser cache. Remove default files; hard-refresh.
- **CSS/JS 404** → you uploaded `out/` as a nested folder, or skipped `_next/`.
  Re-upload the *contents* of `out/`.
- **Deep link 404 without trailing slash** → ensure `.htaccess` was uploaded and
  `mod_rewrite` is enabled, or enable "directory index" + trailing-slash
  handling in the hosting panel.
- **Videos don't play** → check case-sensitive filenames (Linux is
  case-sensitive) under `media/ricordi/videos/`.
- **Account features error** → Supabase unreachable; the app shows an Italian
  error and the local games keep working. Verify the Supabase URL/anon key and
  the redirect URLs above.

/**
 * Verifies the static export in `out/` is complete and safe to upload to a
 * plain Apache/SFTP host. Fails loudly (non-zero exit) on the first problem.
 *
 * Run after `npm run build`:  npm run verify:static
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(__dirname, "..");
const out = join(root, "out");
const errors: string[] = [];
const ok: string[] = [];

function check(label: string, cond: boolean) {
  if (cond) ok.push(label);
  else errors.push(label);
}

function fileExists(rel: string) {
  check(`file exists: ${rel}`, existsSync(join(out, rel)) && statSync(join(out, rel)).isFile());
}

function dirExists(rel: string) {
  check(`dir exists: ${rel}`, existsSync(join(out, rel)) && statSync(join(out, rel)).isDirectory());
}

if (!existsSync(out)) {
  console.error("✖ out/ does not exist. Run `npm run build` first.");
  process.exit(1);
}

// --- Canonical game slugs, read from the registry (single source of truth) ---
const registrySrc = readFileSync(join(root, "src/features/games/registry.ts"), "utf8");
const slugs = [...registrySrc.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]);
check("registry exposes at least 10 game slugs", slugs.length >= 10);

// --- Core files & directories ---
fileExists("index.html");
dirExists("_next");
fileExists(".htaccess");
fileExists("manifest.webmanifest");

// --- Top-level routes ---
for (const rel of [
  "giochi/index.html",
  "ricordi/index.html",
  "contenuti-personali/index.html",
  "partita/index.html",
  "partita/nuova/index.html",
  "informazioni/index.html",
  "privacy/index.html",
  "termini/index.html",
]) {
  fileExists(rel);
}

// --- Every game route must be statically generated ---
for (const slug of slugs) {
  fileExists(`giochi/${slug}/index.html`);
}

// --- Memory media referenced by configuration must be exported ---
const mediaSrc = readFileSync(
  join(root, "src/features/memories/data/memory-media.ts"),
  "utf8",
);
const mediaPaths = [...mediaSrc.matchAll(/src:\s*"(\/media\/[^"]+)"/g)].map((m) => m[1]);
check("memory media configuration references at least one asset", mediaPaths.length > 0);
for (const p of mediaPaths) {
  fileExists(p.replace(/^\//, ""));
}

// --- Static icons / logos ---
for (const rel of ["logo_horizontal.png", "logo_icon.png", "icon.png", "apple-icon.png"]) {
  fileExists(rel);
}

// --- Nothing sensitive may leak into the upload ---
check("no .env in out/", !existsSync(join(out, ".env")) && !existsSync(join(out, ".env.local")));

// Scan every exported text file for forbidden markers.
const forbidden = ["SUPABASE_SERVICE_ROLE_KEY", "CRON_SECRET", "giallo-aria.netlify.app", "/api/"];
function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}
const textFiles = walk(out).filter((f) => /\.(html|js|css|json|txt|webmanifest)$/.test(f));
for (const marker of forbidden) {
  const hits = textFiles.filter((f) => readFileSync(f, "utf8").includes(marker));
  check(
    `no forbidden marker "${marker}" in export`,
    hits.length === 0,
  );
  if (hits.length > 0) {
    for (const h of hits) errors.push(`   ↳ found in ${h.replace(out + "/", "")}`);
  }
}

// --- Report ---
console.log(`✔ ${ok.length} checks passed.`);
if (errors.length > 0) {
  console.error(`\n✖ ${errors.length} problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log("✅ Static export verified — safe to upload the contents of out/.");

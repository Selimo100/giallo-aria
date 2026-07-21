import type { CategoriaPersonale, GameSlug } from "@/types/domain";

// Local, account-free store for user-created categories, kept on the device.
// Mirrors the reactive pattern of custom-content.ts. When signed in these map
// to the Supabase `personal_categories` table (see migration 0005), but the
// running app is device-local like the rest of the personal content.

const KEY = "giallo-aria:categorie";
const EMPTY: CategoriaPersonale[] = [];
const EVENT = "ga:categorie";

let cache: CategoriaPersonale[] | null = null;

function read(): CategoriaPersonale[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const s = window.localStorage.getItem(KEY);
    const parsed = s ? (JSON.parse(s) as CategoriaPersonale[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getCategorie(): CategoriaPersonale[] {
  if (cache === null) cache = read();
  return cache;
}

export function getServerCategorie(): CategoriaPersonale[] {
  return EMPTY;
}

function commit(list: CategoriaPersonale[]): void {
  cache = list;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage full/disabled */
  }
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeCategorie(onChange: () => void): () => void {
  const handler = () => {
    cache = null;
    onChange();
  };
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", handler);
  };
}

/** Categories the user created for a game (optionally including archived). */
export function categorieDi(
  list: CategoriaPersonale[],
  gameType: GameSlug,
  includiArchiviate = false,
): CategoriaPersonale[] {
  return list.filter(
    (c) => c.gameType === gameType && (includiArchiviate || !c.archiviata),
  );
}

export function aggiungiCategoria(gameType: GameSlug, nome: string): CategoriaPersonale | null {
  const n = nome.trim();
  if (!n) return null;
  const esistente = getCategorie().some(
    (c) => c.gameType === gameType && c.nome.toLowerCase() === n.toLowerCase(),
  );
  if (esistente) return null; // no duplicate names within a game
  const nuova: CategoriaPersonale = {
    id: `cat-${crypto.randomUUID()}`,
    gameType,
    nome: n,
    archiviata: false,
    creato: Date.now(),
  };
  commit([nuova, ...getCategorie()]);
  return nuova;
}

export function rinominaCategoria(id: string, nome: string): void {
  const n = nome.trim();
  if (!n) return;
  commit(getCategorie().map((c) => (c.id === id ? { ...c, nome: n } : c)));
}

export function archiviaCategoria(id: string, archiviata: boolean): void {
  commit(getCategorie().map((c) => (c.id === id ? { ...c, archiviata } : c)));
}

export function eliminaCategoria(id: string): void {
  commit(getCategorie().filter((c) => c.id !== id));
}

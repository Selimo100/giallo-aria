import type { CategoriaPersonale, GameSlug } from "@/types/domain";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

// Shared, account-free store for user-created categories. Source of truth is
// the Supabase `shared_categories` table (one global pool). Same optimistic
// cache pattern as custom-content.ts. See migration 0008_shared_content.sql.

const TABLE = "shared_categories";
const EMPTY: CategoriaPersonale[] = [];

let cache: CategoriaPersonale[] = EMPTY;
const listeners = new Set<() => void>();
let hydrated = false;

function emit(): void {
  for (const listener of listeners) listener();
}

type Row = {
  id: string;
  game_type: string;
  nome: string;
  archiviata: boolean;
  creato: number;
};

function rowToItem(r: Row): CategoriaPersonale {
  return {
    id: r.id,
    gameType: r.game_type as GameSlug,
    nome: r.nome,
    archiviata: r.archiviata,
    creato: r.creato,
  };
}

function itemToRow(c: CategoriaPersonale): Row {
  return {
    id: c.id,
    game_type: c.gameType,
    nome: c.nome,
    archiviata: c.archiviata,
    creato: c.creato,
  };
}

async function hydrate(): Promise<void> {
  const sb = getSupabaseBrowserClient();
  if (!sb) return;
  const { data, error } = await sb.from(TABLE).select("*").order("creato", { ascending: false });
  if (error) {
    console.warn("[categorie] impossibile caricare le categorie condivise:", error.message);
    return;
  }
  cache = (data as Row[] | null)?.map(rowToItem) ?? EMPTY;
  emit();
}

export function getCategorie(): CategoriaPersonale[] {
  return cache;
}

export function getServerCategorie(): CategoriaPersonale[] {
  return EMPTY;
}

export function subscribeCategorie(onChange: () => void): () => void {
  listeners.add(onChange);
  if (!hydrated) {
    hydrated = true;
    void hydrate();
  }
  return () => {
    listeners.delete(onChange);
  };
}

function setCache(list: CategoriaPersonale[]): void {
  cache = list;
  emit();
}

function pushRow(c: CategoriaPersonale): void {
  const sb = getSupabaseBrowserClient();
  if (!sb) return;
  void sb
    .from(TABLE)
    .upsert(itemToRow(c))
    .then(({ error }) => {
      if (error) {
        console.warn("[categorie] salvataggio non riuscito:", error.message);
        void hydrate();
      }
    });
}

function commit(list: CategoriaPersonale[]): void {
  cache = list;
  emit();
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
  commit([nuova, ...cache]);
  pushRow(nuova);
  return nuova;
}

export function rinominaCategoria(id: string, nome: string): void {
  const n = nome.trim();
  if (!n) return;
  const updated = cache.map((c) => (c.id === id ? { ...c, nome: n } : c));
  commit(updated);
  const item = updated.find((c) => c.id === id);
  if (item) pushRow(item);
}

export function archiviaCategoria(id: string, archiviata: boolean): void {
  const updated = cache.map((c) => (c.id === id ? { ...c, archiviata } : c));
  commit(updated);
  const item = updated.find((c) => c.id === id);
  if (item) pushRow(item);
}

export function eliminaCategoria(id: string): void {
  setCache(cache.filter((c) => c.id !== id));
  const sb = getSupabaseBrowserClient();
  if (sb) {
    void sb
      .from(TABLE)
      .delete()
      .eq("id", id)
      .then(({ error }) => {
        if (error) {
          console.warn("[categorie] eliminazione non riuscita:", error.message);
          void hydrate();
        }
      });
  }
}

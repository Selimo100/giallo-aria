import type {
  ContenutoGioco,
  ContenutoOV,
  ContenutoPersonale,
  GameSlug,
  ImpostorWord,
  ParolaIndovina,
  TipoContenutoOV,
} from "@/types/domain";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

// Shared, account-free store for user-created content. The single source of
// truth is the Supabase `shared_content` table (one global pool everyone reads
// and writes). We keep an in-memory cache so the reactive store API stays
// synchronous; writes are optimistic and mirrored to Supabase in the
// background. See migration 0008_shared_content.sql.

const TABLE = "shared_content";
const EMPTY: ContenutoPersonale[] = [];

let cache: ContenutoPersonale[] = EMPTY;
const listeners = new Set<() => void>();
let hydrated = false;

function emit(): void {
  for (const listener of listeners) listener();
}

type Row = {
  id: string;
  game_type: string;
  tipo: string | null;
  prompt: string;
  categoria: string | null;
  intensita: string;
  timer_consigliato: number | null;
  richiede_movimento: boolean | null;
  safe_alternative: string | null;
  suggerimento: string | null;
  attivo: boolean;
  creato: number;
};

function rowToItem(r: Row): ContenutoPersonale {
  return {
    id: r.id,
    gameType: r.game_type as GameSlug,
    tipo: (r.tipo as TipoContenutoOV | null) ?? undefined,
    prompt: r.prompt,
    categoria: r.categoria ?? "",
    intensita: r.intensita as ContenutoPersonale["intensita"],
    timerConsigliato: r.timer_consigliato ?? undefined,
    richiedeMovimento: r.richiede_movimento ?? undefined,
    safeAlternative: r.safe_alternative ?? undefined,
    suggerimento: r.suggerimento ?? undefined,
    attivo: r.attivo,
    creato: r.creato,
  };
}

function itemToRow(c: ContenutoPersonale): Row {
  return {
    id: c.id,
    game_type: c.gameType,
    tipo: c.tipo ?? null,
    prompt: c.prompt,
    categoria: c.categoria ?? "",
    intensita: c.intensita,
    timer_consigliato: c.timerConsigliato ?? null,
    richiede_movimento: c.richiedeMovimento ?? null,
    safe_alternative: c.safeAlternative ?? null,
    suggerimento: c.suggerimento ?? null,
    attivo: c.attivo,
    creato: c.creato,
  };
}

async function hydrate(): Promise<void> {
  const sb = getSupabaseBrowserClient();
  if (!sb) return;
  const { data, error } = await sb.from(TABLE).select("*").order("creato", { ascending: false });
  if (error) {
    console.warn("[contenuti] impossibile caricare i contenuti condivisi:", error.message);
    return;
  }
  cache = (data as Row[] | null)?.map(rowToItem) ?? EMPTY;
  emit();
}

/** Re-fetch the shared pool from Supabase (e.g. on focus / manual refresh). */
export function refreshContenuti(): void {
  void hydrate();
}

/** Stable snapshot for the current render (mutated only on hydrate/write). */
export function getContenuti(): ContenutoPersonale[] {
  return cache;
}

export function getServerContenuti(): ContenutoPersonale[] {
  return EMPTY;
}

export function subscribeContenuti(onChange: () => void): () => void {
  listeners.add(onChange);
  if (!hydrated) {
    hydrated = true;
    void hydrate();
  }
  return () => {
    listeners.delete(onChange);
  };
}

function setCache(list: ContenutoPersonale[]): void {
  cache = list;
  emit();
}

export function aggiungiContenuto(
  input: Omit<ContenutoPersonale, "id" | "creato" | "attivo"> & { attivo?: boolean },
): ContenutoPersonale {
  const nuovo: ContenutoPersonale = {
    ...input,
    id: `perso-${crypto.randomUUID()}`,
    attivo: input.attivo ?? true,
    creato: Date.now(),
  };
  setCache([nuovo, ...cache]); // optimistic
  const sb = getSupabaseBrowserClient();
  if (sb) {
    void sb
      .from(TABLE)
      .insert(itemToRow(nuovo))
      .then(({ error }) => {
        if (error) {
          console.warn("[contenuti] salvataggio non riuscito:", error.message);
          void hydrate(); // reconcile with the server
        }
      });
  }
  return nuovo;
}

export function aggiornaContenuto(id: string, patch: Partial<ContenutoPersonale>): void {
  const updated = cache.map((c) => (c.id === id ? { ...c, ...patch, id: c.id } : c));
  setCache(updated);
  const item = updated.find((c) => c.id === id);
  const sb = getSupabaseBrowserClient();
  if (sb && item) {
    void sb
      .from(TABLE)
      .update(itemToRow(item))
      .eq("id", id)
      .then(({ error }) => {
        if (error) {
          console.warn("[contenuti] aggiornamento non riuscito:", error.message);
          void hydrate();
        }
      });
  }
}

export function rimuoviContenuto(id: string): void {
  setCache(cache.filter((c) => c.id !== id));
  const sb = getSupabaseBrowserClient();
  if (sb) {
    void sb
      .from(TABLE)
      .delete()
      .eq("id", id)
      .then(({ error }) => {
        if (error) {
          console.warn("[contenuti] eliminazione non riuscita:", error.message);
          void hydrate();
        }
      });
  }
}

export function toggleContenuto(id: string): void {
  const item = cache.find((c) => c.id === id);
  if (!item) return;
  aggiornaContenuto(id, { attivo: !item.attivo });
}

// ---------- converters into per-game content shapes ----------

function base(c: ContenutoPersonale): ContenutoGioco {
  return {
    id: c.id,
    gameType: c.gameType,
    prompt: c.prompt,
    categoria: c.categoria,
    intensita: c.intensita,
  };
}

function attivi(list: ContenutoPersonale[], gameType: GameSlug, includi: boolean) {
  if (!includi) return [];
  return list.filter((c) => c.attivo && c.gameType === gameType);
}

export function personaliImpostore(
  list: ContenutoPersonale[],
  includi: boolean,
): ImpostorWord[] {
  return attivi(list, "impostore", includi).map((c) => ({
    ...base(c),
    categoria: c.categoria || "Personali",
  }));
}

export function personaliProbabile(
  list: ContenutoPersonale[],
  includi: boolean,
): ContenutoGioco[] {
  return attivi(list, "chi-e-piu-probabile", includi).map(base);
}

export function personaliIndovinaParola(
  list: ContenutoPersonale[],
  includi: boolean,
): ParolaIndovina[] {
  return attivi(list, "indovina-la-parola", includi).map((c) => ({
    ...base(c),
    categoria: c.categoria || "Personali",
    suggerimento: c.suggerimento,
  }));
}

export function personaliOV(
  list: ContenutoPersonale[],
  includi: boolean,
  tipo?: TipoContenutoOV,
): ContenutoOV[] {
  return attivi(list, "obbligo-o-verita", includi)
    .filter((c) => (tipo ? c.tipo === tipo : true))
    .map((c) => ({
      ...base(c),
      tipo: c.tipo ?? "truth",
      categoria: c.categoria || "Personali",
      timerConsigliato: c.timerConsigliato,
      richiedeMovimento: c.richiedeMovimento,
      richiedeContatto: false,
      safeAlternative: c.safeAlternative,
      minGiocatori: 2,
    }));
}

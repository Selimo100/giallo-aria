import type {
  ContenutoGioco,
  ContenutoOV,
  ContenutoPersonale,
  GameSlug,
  ImpostorWord,
  ParolaIndovina,
  TipoContenutoOV,
} from "@/types/domain";

// Local, account-free store for user-created content, kept on the device.
// Reactive: components subscribe via useContenutiPersonali (useSyncExternalStore).

const KEY = "giallo-aria:contenuti";
const EMPTY: ContenutoPersonale[] = [];
const EVENT = "ga:contenuti";

let cache: ContenutoPersonale[] | null = null;

function read(): ContenutoPersonale[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const s = window.localStorage.getItem(KEY);
    const parsed = s ? (JSON.parse(s) as ContenutoPersonale[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Stable snapshot for the current tab (cached until the next write). */
export function getContenuti(): ContenutoPersonale[] {
  if (cache === null) cache = read();
  return cache;
}

export function getServerContenuti(): ContenutoPersonale[] {
  return EMPTY;
}

function commit(list: ContenutoPersonale[]): void {
  cache = list;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage full/disabled */
  }
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeContenuti(onChange: () => void): () => void {
  const handler = () => {
    cache = null; // invalidate so the next getContenuti re-reads
    onChange();
  };
  window.addEventListener(EVENT, onChange); // same-tab writes keep cache fresh
  window.addEventListener("storage", handler); // other tabs
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", handler);
  };
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
  commit([nuovo, ...getContenuti()]);
  return nuovo;
}

export function aggiornaContenuto(id: string, patch: Partial<ContenutoPersonale>): void {
  commit(getContenuti().map((c) => (c.id === id ? { ...c, ...patch, id: c.id } : c)));
}

export function rimuoviContenuto(id: string): void {
  commit(getContenuti().filter((c) => c.id !== id));
}

export function toggleContenuto(id: string): void {
  commit(getContenuti().map((c) => (c.id === id ? { ...c, attivo: !c.attivo } : c)));
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

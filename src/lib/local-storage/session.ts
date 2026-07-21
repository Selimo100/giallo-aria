import type { ConfigPartita, GameSlug, RisultatoGTW } from "@/types/domain";

// Local session persistence. We persist ONLY public/safe game state.
// Private secrets (the word, who is the impostor) are NEVER written here:
// on restore we return to a neutral screen and re-derive/re-reveal secrets.

const KEY = "giallo-aria:sessione";

export interface SessionePubblica {
  sessionId: string;
  slug: GameSlug;
  config: ConfigPartita;
  round: number; // current round number (1-based)
  usedContentIds: string[]; // to avoid repeats within a game
  punteggi: Record<string, number>; // giocatoreId -> punti
  turnIndex?: number; // Obbligo o Verità: whose turn (index into order)
  ordineIds?: string[]; // Obbligo o Verità: resolved player order
  statsOV?: Record<string, { verita: number; obblighi: number; salti: number }>;
  // Indovina la parola: public progress only (never the active word — that is
  // re-revealed on an explicit action after the safe-restoration screen).
  risultatiGTW?: RisultatoGTW[];
  saltatiGTW?: string[]; // word ids skipped this game
  aggiornata: number; // timestamp
}

export function salvaSessione(s: SessionePubblica): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ ...s, aggiornata: Date.now() }));
  } catch {
    /* storage full / disabled — game continues in memory */
  }
}

export function caricaSessione(): SessionePubblica | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionePubblica;
    if (!parsed?.sessionId || !parsed?.slug) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function eliminaSessione(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

export function nuovoSessionId(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  ).toUpperCase();
}

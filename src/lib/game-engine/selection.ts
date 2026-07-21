import type {
  ContenutoGioco,
  ContentSourceMode,
  Giocatore,
  Intensita,
} from "@/types/domain";
import { INTENSITA } from "@/types/domain";

export interface FiltriContenuto {
  intensitaMax: Intensita;
  categorie?: string[]; // empty/undefined = all
  escludiIds?: Set<string>; // recently used
}

// Enforce intensity + category filters at selection time (not just UI).
export function filtraContenuti<T extends ContenutoGioco>(
  contenuti: T[],
  filtri: FiltriContenuto,
): T[] {
  const maxIntensita = INTENSITA.indexOf(filtri.intensitaMax);
  return contenuti.filter((c) => {
    if (INTENSITA.indexOf(c.intensita) > maxIntensita) return false;
    if (
      filtri.categorie &&
      filtri.categorie.length > 0 &&
      c.categoria &&
      !filtri.categorie.includes(c.categoria)
    ) {
      return false;
    }
    if (filtri.escludiIds?.has(c.id)) return false;
    return true;
  });
}

// Fisher–Yates shuffle (pure, returns a new array).
export function mescola<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function scegliCasuale<T>(arr: readonly T[]): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

// Pick `n` distinct impostor indices out of `count` players.
export function scegliImpostori(count: number, n: number): number[] {
  const indici = mescola(Array.from({ length: count }, (_, i) => i));
  return indici.slice(0, Math.max(1, Math.min(n, count - 1))).sort((a, b) => a - b);
}

export function ordinaCasuale(giocatori: Giocatore[]): Giocatore[] {
  return mescola(giocatori);
}

/**
 * Combine official and personal content pools according to the selected
 * ContentSourceMode. This drives the *actual* pool a game draws from — the
 * UI selector must feed its value here so the choice affects gameplay, not
 * just appearance.
 *
 * - "official_only": personal content is never included.
 * - "personal_only": official content is never included (no silent fallback).
 * - "mixed": both pools are included, interleaved so neither source dominates.
 *
 * Callers are responsible for pre-filtering each pool (categories, intensity,
 * active state, ownership) before passing them in.
 */
export function combinaFonti<T extends ContenutoGioco>(
  ufficiali: readonly T[],
  personali: readonly T[],
  modo: ContentSourceMode,
): T[] {
  if (modo === "official_only") return [...ufficiali];
  if (modo === "personal_only") return [...personali];
  // mixed: interleave shuffled pools so one source doesn't repeatedly win.
  const a = mescola(ufficiali);
  const b = mescola(personali);
  const out: T[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length) out.push(a[i++]);
    if (j < b.length) out.push(b[j++]);
  }
  return out;
}

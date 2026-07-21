import type { ContenutoOV, TipoContenutoOV } from "@/types/domain";
import { filtraContenuti, scegliCasuale, type FiltriContenuto } from "./selection";

export interface FiltriOV extends FiltriContenuto {
  numGiocatori: number;
  senzaMovimento?: boolean; // accessibility: exclude movement-only dares
}

/** Apply all OV filters to a pool, respecting the game type (truth/dare). */
export function filtraOV(
  contenuti: ContenutoOV[],
  tipo: TipoContenutoOV,
  filtri: FiltriOV,
): ContenutoOV[] {
  return filtraContenuti(
    contenuti.filter((c) => c.tipo === tipo),
    filtri,
  ).filter((c) => {
    if (c.minGiocatori && filtri.numGiocatori < c.minGiocatori) return false;
    if (tipo === "dare" && filtri.senzaMovimento && c.richiedeMovimento && !c.safeAlternative) {
      // movement dare without a non-movement alternative is excluded
      return false;
    }
    return true;
  });
}

/** Pick a single content item of the requested type, preferring unused ones. */
export function scegliOV(
  contenuti: ContenutoOV[],
  tipo: TipoContenutoOV,
  filtri: FiltriOV,
): ContenutoOV | undefined {
  const pool = filtraOV(contenuti, tipo, filtri);
  if (pool.length === 0) return undefined;
  const inediti = pool.filter((c) => !filtri.escludiIds?.has(c.id));
  return scegliCasuale(inediti.length > 0 ? inediti : pool);
}

/**
 * Choose a safe alternative for a dare:
 *  1. the explicit `safeAlternative` prompt if present, else
 *  2. another compatible dare with same/lower difficulty & intensity, no
 *     movement/contact, not already used.
 */
export function scegliAlternativaSicura(
  contenuti: ContenutoOV[],
  dare: ContenutoOV,
  filtri: FiltriOV,
): { prompt: string; id?: string } | undefined {
  if (dare.safeAlternative) return { prompt: dare.safeAlternative };
  const pool = filtraOV(contenuti, "dare", { ...filtri, senzaMovimento: true }).filter(
    (c) =>
      c.id !== dare.id &&
      !c.richiedeMovimento &&
      !c.richiedeContatto &&
      !filtri.escludiIds?.has(c.id),
  );
  const alt = scegliCasuale(pool);
  return alt ? { prompt: alt.prompt, id: alt.id } : undefined;
}

export interface StatOV {
  verita: number;
  obblighi: number;
  salti: number;
}

/** Default OV scoring. Never penalises unless explicitly configured. */
export function puntiOV(tipo: TipoContenutoOV, alternativa: boolean): number {
  if (tipo === "truth") return 1;
  const p = 2; // dare
  if (alternativa) return Math.max(1, p - 1); // reduced but never zero
  return p;
}

/** Whether the player may still use a normal (non-emergency) skip. */
export function puoSaltare(
  comportamento: "Illimitati" | "Limitati" | "Con penalità" | undefined,
  saltiUsati: number,
  maxSkip: number,
): boolean {
  if (comportamento === "Limitati") return saltiUsati < maxSkip;
  return true; // Illimitati / Con penalità always allow the action itself
}

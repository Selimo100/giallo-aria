import type {
  ConfigPartita,
  ContentSourceMode,
  EsitoGTW,
  ParolaIndovina,
} from "@/types/domain";
import { combinaFonti, filtraContenuti, mescola } from "./selection";

// ------------------------------------------------------------------ //
// Word pool
// ------------------------------------------------------------------ //

export interface FiltriParola {
  categorie?: string[]; // empty/undefined = all
  escludiIds?: Set<string>; // already used / skipped this game
}

/**
 * Build the concrete word pool for a game, honouring the content-source mode.
 * `personal_only` never falls back to official words (empty pool stays empty).
 * Callers pre-filter each pool for active/ownership; category filtering and
 * de-duplication happen here.
 */
export function costruisciPool(
  ufficiali: readonly ParolaIndovina[],
  personali: readonly ParolaIndovina[],
  modo: ContentSourceMode,
  filtri: FiltriParola,
): ParolaIndovina[] {
  const unite = combinaFonti(ufficiali, personali, modo);
  return filtraContenuti(unite, {
    intensitaMax: "Caotico", // words carry no intensity gating of their own
    categorie: filtri.categorie,
    escludiIds: filtri.escludiIds,
  });
}

/** Pick the next word, preferring unused ones, avoiding same-game duplicates. */
export function scegliParola(
  pool: readonly ParolaIndovina[],
  usati: Set<string>,
): ParolaIndovina | undefined {
  const inediti = pool.filter((p) => !usati.has(p.id));
  const scelta = mescola(inediti.length > 0 ? inediti : pool);
  return scelta[0];
}

// ------------------------------------------------------------------ //
// Required-word calculation (blocks start when not enough content)
// ------------------------------------------------------------------ //

/** How many turns will be played in total. */
export function turniTotali(numGiocatori: number, config: ConfigPartita): number {
  if (config.senzaFine) return numGiocatori; // guarantee at least one full round
  return numGiocatori * Math.max(1, config.turniPerGiocatore ?? 1);
}

/**
 * Minimum distinct words required so a game does not run dry, considering the
 * "no duplicate word in the same game" rule plus a skip allowance.
 */
export function paroleNecessarie(numGiocatori: number, config: ConfigPartita): number {
  const turni = turniTotali(numGiocatori, config);
  const saltiPerTurno = config.consentiSalto
    ? config.maxSalti && config.maxSalti > 0
      ? config.maxSalti
      : 3 // unlimited skips: assume a reasonable buffer
    : 0;
  return turni * (1 + saltiPerTurno);
}

// ------------------------------------------------------------------ //
// Timestamp-based countdown (no drift; survives re-renders)
// ------------------------------------------------------------------ //

export interface StatoTimer {
  startedAt: number; // epoch ms when the timer (re)started
  endsAt: number; // epoch ms when it will reach zero
  durataMs: number; // configured full duration
  pausedAt: number | null; // epoch ms when paused, else null
}

export function avviaTimer(durataMs: number, now: number): StatoTimer {
  return { startedAt: now, endsAt: now + durataMs, durataMs, pausedAt: null };
}

export function inPausa(t: StatoTimer): boolean {
  return t.pausedAt !== null;
}

/** Remaining milliseconds, computed from timestamps (never below zero). */
export function rimanenteMs(t: StatoTimer, now: number): number {
  const riferimento = t.pausedAt ?? now;
  return Math.max(0, t.endsAt - riferimento);
}

export function scaduto(t: StatoTimer, now: number): boolean {
  return rimanenteMs(t, now) === 0;
}

export function pausaTimer(t: StatoTimer, now: number): StatoTimer {
  if (t.pausedAt !== null) return t;
  return { ...t, pausedAt: now };
}

export function riprendiTimer(t: StatoTimer, now: number): StatoTimer {
  if (t.pausedAt === null) return t;
  const trascorsoInPausa = now - t.pausedAt;
  return { ...t, endsAt: t.endsAt + trascorsoInPausa, pausedAt: null };
}

/** Time already spent (from start), clamped to the full duration. */
export function tempoImpiegatoMs(t: StatoTimer, now: number): number {
  return Math.min(t.durataMs, t.durataMs - rimanenteMs(t, now));
}

// ------------------------------------------------------------------ //
// Scoring
// ------------------------------------------------------------------ //

export const PUNTI_BASE_GTW = 100;
export const PUNTI_BONUS_MAX_GTW = 100;

/**
 * Score a turn outcome. Simple mode: 1 point for a correct word, 0 otherwise.
 * Time-based mode: a base score plus a remaining-time bonus. Never negative.
 */
export function puntiGTW(
  esito: EsitoGTW,
  tempoRimastoMs: number,
  durataMs: number,
  aTempo: boolean | undefined,
): number {
  if (esito !== "indovinata") return 0;
  if (!aTempo) return 1;
  const frazione = durataMs > 0 ? Math.max(0, tempoRimastoMs) / durataMs : 0;
  const bonus = Math.round(PUNTI_BONUS_MAX_GTW * Math.min(1, frazione));
  return PUNTI_BASE_GTW + Math.max(0, bonus);
}

// ------------------------------------------------------------------ //
// Player rotation
// ------------------------------------------------------------------ //

export interface Avanzamento {
  turnIndex: number;
  round: number;
  finita: boolean;
}

/** Advance to the next guessing player, ending the game when configured. */
export function prossimoTurno(
  turnIndex: number,
  round: number,
  numGiocatori: number,
  config: ConfigPartita,
): Avanzamento {
  let nextTurn = turnIndex + 1;
  let nextRound = round;
  if (nextTurn >= numGiocatori) {
    nextTurn = 0;
    nextRound = round + 1;
  }
  const totali = config.senzaFine ? Infinity : Math.max(1, config.turniPerGiocatore ?? 1);
  const finita = !config.senzaFine && nextRound > totali;
  return { turnIndex: finita ? turnIndex : nextTurn, round: nextRound, finita };
}

// Core domain types for Giallo-Aria (shared local game platform).

export type Intensita = "Tranquillo" | "Divertente" | "Audace" | "Caotico";

export const INTENSITA: Intensita[] = ["Tranquillo", "Divertente", "Audace", "Caotico"];

// Where the content for a game comes from. Affects the actual selection query,
// not just the UI. See src/lib/game-engine/selection.ts.
export type ContentSourceMode = "official_only" | "personal_only" | "mixed";

export const CONTENT_SOURCE_MODES: ContentSourceMode[] = [
  "official_only",
  "personal_only",
  "mixed",
];

// Italian labels for the content-source selector (single source of truth).
export const CONTENT_SOURCE_LABEL: Record<ContentSourceMode, string> = {
  official_only: "Solo contenuti del gioco",
  personal_only: "Solo i miei contenuti",
  mixed: "Contenuti del gioco e personali",
};

export type GameSlug =
  | "impostore"
  | "chi-e-piu-probabile"
  | "obbligo-o-verita"
  | "preferiresti"
  | "non-ho-mai"
  | "sfide"
  | "categorie"
  | "indovina-chi"
  | "parola-proibita"
  | "indovina-la-parola";

export interface GameMode {
  slug: GameSlug;
  nome: string;
  tagline: string;
  descrizione: string;
  emoji: string;
  minGiocatori: number;
  maxGiocatori: number;
  colore: string; // css color token name
  giocabile: boolean; // fully implemented single-device flow?
}

export interface Giocatore {
  id: string;
  nome: string;
  colore: string;
}

// A generic content item, mirrors the Supabase `game_content` table subset
// that the client is allowed to see.
export interface ContenutoGioco {
  id: string;
  gameType: GameSlug;
  prompt: string;
  secondaryPrompt?: string;
  answer?: string;
  forbiddenWords?: string[];
  categoria?: string;
  intensita: Intensita;
}

export interface ImpostorWord extends ContenutoGioco {
  categoria: string;
}

// A word to be described/guessed in "Indovina la parola".
export interface ParolaIndovina extends ContenutoGioco {
  categoria: string;
  suggerimento?: string; // optional hint for the describing players
}

// Outcome of a single guessing turn (public state — safe to persist).
export type EsitoGTW = "indovinata" | "saltata" | "scaduta";

export interface RisultatoGTW {
  giocatoreId: string;
  parolaId: string;
  parola: string;
  categoria?: string;
  esito: EsitoGTW;
  tempoImpiegatoMs: number; // time from start to guess/skip/expiry
  tempoRimastoMs: number; // time left when the turn ended
  punti: number;
}

export type TipoContenutoOV = "truth" | "dare";

// Truth / dare content item with structured safety metadata (mirrors the
// `game_content` columns added for Obbligo o Verità).
export interface ContenutoOV extends ContenutoGioco {
  tipo: TipoContenutoOV;
  categoria: string;
  safeAlternative?: string; // explicit alternative prompt (mainly for dares)
  timerConsigliato?: number; // seconds, 0 = none
  richiedeMovimento?: boolean;
  richiedeContatto?: boolean;
  minGiocatori?: number;
  noteAccessibilita?: string;
}

// A user-created content item, stored locally on the device (no account needed).
export interface ContenutoPersonale {
  id: string; // "perso-<uuid>"
  gameType: GameSlug;
  tipo?: TipoContenutoOV; // Obbligo o Verità only
  prompt: string;
  categoria: string;
  intensita: Intensita;
  timerConsigliato?: number; // dare
  richiedeMovimento?: boolean; // dare
  safeAlternative?: string; // dare
  suggerimento?: string; // Indovina la parola: optional hint
  attivo: boolean; // included in games when true
  creato: number;
}

// A user-created personal category (device-local, per game). Mirrors the
// Supabase `personal_categories` table used when signed in.
export interface CategoriaPersonale {
  id: string; // "cat-<uuid>"
  gameType: GameSlug;
  nome: string;
  archiviata: boolean;
  creato: number;
}

export type OrdineGiocatori = "In ordine" | "Casuale";
export type ModalitaOV = "Obbligo e Verità" | "Solo Obbligo" | "Solo Verità";
export type ComportamentoSkip = "Illimitati" | "Limitati" | "Con penalità";

// Setup configuration built during the shared setup flow, stored locally.
export interface ConfigPartita {
  slug: GameSlug;
  giocatori: Giocatore[];
  intensita: Intensita;
  categorie: string[]; // empty = tutte
  round: number;
  // game-specific
  numImpostori?: number;
  timerDiscussione?: number; // seconds, 0 = off
  indovinelloFinale?: boolean;
  votoPrivato?: boolean;
  punteggi?: boolean;
  // Obbligo o Verità
  ordine?: OrdineGiocatori;
  modalita?: ModalitaOV;
  senzaFine?: boolean; // endless until stopped
  timerAttivo?: boolean;
  timerDurata?: number; // seconds
  comportamentoSkip?: ComportamentoSkip;
  maxSkip?: number; // when comportamentoSkip === "Limitati"
  alternativeSicure?: boolean;
  senzaMovimento?: boolean; // accessibility: avoid movement dares
  // Indovina la parola
  turniPerGiocatore?: number; // turns each player takes (ignored when senzaFine)
  conteggioIniziale?: boolean; // show a 3-2-1 countdown before the timer
  consentiSalto?: boolean; // allow skipping the current word
  maxSalti?: number; // max skips per turn (0 = unlimited when consentiSalto)
  punteggioATempo?: boolean; // time-based scoring instead of simple 1-point
  suono?: boolean; // audio cue at zero
  vibrazione?: boolean; // haptic cue at zero
  // Shared: which content pool feeds this game (official / personal / mixed).
  // Replaces the old boolean "include my content" toggle.
  contentSource?: ContentSourceMode;
}

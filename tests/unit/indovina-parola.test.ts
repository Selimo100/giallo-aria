import { describe, it, expect } from "vitest";
import {
  costruisciPool,
  scegliParola,
  turniTotali,
  paroleNecessarie,
  avviaTimer,
  rimanenteMs,
  scaduto,
  pausaTimer,
  riprendiTimer,
  tempoImpiegatoMs,
  inPausa,
  puntiGTW,
  prossimoTurno,
} from "@/lib/game-engine/indovina-parola";
import {
  PAROLE_INDOVINA,
  CATEGORIE_INDOVINA_PAROLA,
  TOTALE_PAROLE_INDOVINA,
} from "@/features/content/indovina-la-parola";
import type { ConfigPartita, ParolaIndovina } from "@/types/domain";

function w(id: string, categoria = "Animali", prompt = "P"): ParolaIndovina {
  return {
    id,
    gameType: "indovina-la-parola",
    prompt,
    categoria,
    intensita: "Tranquillo",
  };
}

const baseConfig: ConfigPartita = {
  slug: "indovina-la-parola",
  giocatori: [],
  intensita: "Tranquillo",
  categorie: [],
  round: 1,
};

describe("banca parole ufficiali", () => {
  it("include almeno 400 parole", () => {
    expect(TOTALE_PAROLE_INDOVINA).toBeGreaterThanOrEqual(400);
  });
  it("copre tutte le categorie ufficiali", () => {
    for (const c of CATEGORIE_INDOVINA_PAROLA) {
      expect(PAROLE_INDOVINA.some((p) => p.categoria === c)).toBe(true);
    }
  });
  it("non contiene id duplicati", () => {
    const ids = new Set(PAROLE_INDOVINA.map((p) => p.id));
    expect(ids.size).toBe(PAROLE_INDOVINA.length);
  });
});

describe("costruisciPool (fonti)", () => {
  const uff = [w("u1"), w("u2", "Cibo")];
  const per = [w("p1"), w("p2", "Cibo")];

  it("official_only ignora i contenuti personali", () => {
    const res = costruisciPool(uff, per, "official_only", {});
    expect(res.map((r) => r.id).sort()).toEqual(["u1", "u2"]);
  });
  it("personal_only non ricade sui contenuti ufficiali", () => {
    const res = costruisciPool(uff, per, "personal_only", {});
    expect(res.map((r) => r.id).sort()).toEqual(["p1", "p2"]);
  });
  it("personal_only senza personali resta vuoto", () => {
    expect(costruisciPool(uff, [], "personal_only", {})).toHaveLength(0);
  });
  it("mixed unisce entrambe le fonti", () => {
    const res = costruisciPool(uff, per, "mixed", {});
    expect(res.map((r) => r.id).sort()).toEqual(["p1", "p2", "u1", "u2"]);
  });
  it("filtra per categoria", () => {
    const res = costruisciPool(uff, per, "mixed", { categorie: ["Cibo"] });
    expect(res.map((r) => r.id).sort()).toEqual(["p2", "u2"]);
  });
  it("esclude gli id già usati", () => {
    const res = costruisciPool(uff, per, "mixed", { escludiIds: new Set(["u1", "p1"]) });
    expect(res.map((r) => r.id).sort()).toEqual(["p2", "u2"]);
  });
});

describe("scegliParola", () => {
  it("preferisce parole non ancora usate", () => {
    const pool = [w("a"), w("b"), w("c")];
    const scelta = scegliParola(pool, new Set(["a", "b"]));
    expect(scelta?.id).toBe("c");
  });
  it("torna a riusare quando tutte sono state usate", () => {
    const pool = [w("a")];
    expect(scegliParola(pool, new Set(["a"]))?.id).toBe("a");
  });
  it("restituisce undefined con pool vuoto", () => {
    expect(scegliParola([], new Set())).toBeUndefined();
  });
});

describe("conteggio parole necessarie", () => {
  it("conta un turno per giocatore per il numero di turni", () => {
    expect(turniTotali(4, { ...baseConfig, turniPerGiocatore: 2 })).toBe(8);
  });
  it("in modalità senza fine richiede almeno un giro", () => {
    expect(turniTotali(4, { ...baseConfig, senzaFine: true })).toBe(4);
  });
  it("aggiunge un margine per i salti quando abilitati", () => {
    const senza = paroleNecessarie(4, { ...baseConfig, turniPerGiocatore: 1 });
    const con = paroleNecessarie(4, {
      ...baseConfig,
      turniPerGiocatore: 1,
      consentiSalto: true,
      maxSalti: 2,
    });
    expect(senza).toBe(4);
    expect(con).toBe(12);
  });
});

describe("timer basato su timestamp", () => {
  it("calcola il rimanente dai timestamp, non dai tick", () => {
    const t = avviaTimer(60_000, 1_000);
    expect(rimanenteMs(t, 1_000)).toBe(60_000);
    expect(rimanenteMs(t, 21_000)).toBe(40_000);
    expect(rimanenteMs(t, 61_000)).toBe(0);
  });
  it("non scende mai sotto zero", () => {
    const t = avviaTimer(10_000, 0);
    expect(rimanenteMs(t, 999_999)).toBe(0);
    expect(scaduto(t, 999_999)).toBe(true);
  });
  it("congela il tempo in pausa e riprende senza regalare tempo", () => {
    let t = avviaTimer(60_000, 0);
    t = pausaTimer(t, 20_000); // 40s rimasti, in pausa
    expect(inPausa(t)).toBe(true);
    expect(rimanenteMs(t, 20_000)).toBe(40_000);
    // il tempo passa mentre è in pausa: il rimanente non cambia
    expect(rimanenteMs(t, 100_000)).toBe(40_000);
    t = riprendiTimer(t, 100_000);
    expect(inPausa(t)).toBe(false);
    expect(rimanenteMs(t, 100_000)).toBe(40_000);
    expect(rimanenteMs(t, 110_000)).toBe(30_000);
  });
  it("misura il tempo impiegato", () => {
    const t = avviaTimer(60_000, 0);
    expect(tempoImpiegatoMs(t, 15_000)).toBe(15_000);
    expect(tempoImpiegatoMs(t, 999_999)).toBe(60_000);
  });
});

describe("punteggio", () => {
  it("modalità semplice: 1 per indovinata, 0 altrimenti", () => {
    expect(puntiGTW("indovinata", 30_000, 60_000, false)).toBe(1);
    expect(puntiGTW("saltata", 30_000, 60_000, false)).toBe(0);
    expect(puntiGTW("scaduta", 0, 60_000, false)).toBe(0);
  });
  it("modalità a tempo: base più bonus proporzionale, mai negativo", () => {
    expect(puntiGTW("indovinata", 60_000, 60_000, true)).toBe(200);
    expect(puntiGTW("indovinata", 30_000, 60_000, true)).toBe(150);
    expect(puntiGTW("indovinata", 0, 60_000, true)).toBe(100);
    expect(puntiGTW("saltata", 60_000, 60_000, true)).toBe(0);
  });
});

describe("rotazione giocatori", () => {
  it("avanza al giocatore successivo nello stesso round", () => {
    const a = prossimoTurno(0, 1, 3, { ...baseConfig, turniPerGiocatore: 2 });
    expect(a).toMatchObject({ turnIndex: 1, round: 1, finita: false });
  });
  it("passa al round successivo dopo l'ultimo giocatore", () => {
    const a = prossimoTurno(2, 1, 3, { ...baseConfig, turniPerGiocatore: 2 });
    expect(a).toMatchObject({ turnIndex: 0, round: 2, finita: false });
  });
  it("termina quando i round configurati sono completati", () => {
    const a = prossimoTurno(2, 2, 3, { ...baseConfig, turniPerGiocatore: 2 });
    expect(a.finita).toBe(true);
  });
  it("in modalità senza fine non termina mai", () => {
    const a = prossimoTurno(2, 99, 3, { ...baseConfig, senzaFine: true });
    expect(a.finita).toBe(false);
  });
});

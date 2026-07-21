import { describe, it, expect } from "vitest";
import {
  filtraOV,
  scegliOV,
  scegliAlternativaSicura,
  puntiOV,
  puoSaltare,
  type FiltriOV,
} from "@/lib/game-engine/obbligo-verita";
import { CONTENUTI_OV } from "@/features/content/obbligo-verita";
import type { ContenutoOV } from "@/types/domain";

function d(p: Partial<ContenutoOV>): ContenutoOV {
  return {
    id: p.id ?? "x",
    gameType: "obbligo-o-verita",
    tipo: p.tipo ?? "dare",
    prompt: p.prompt ?? "prova",
    categoria: p.categoria ?? "Divertente",
    difficolta: p.difficolta ?? "Facile",
    intensita: p.intensita ?? "Tranquillo",
    timerConsigliato: p.timerConsigliato,
    richiedeMovimento: p.richiedeMovimento,
    richiedeContatto: p.richiedeContatto,
    safeAlternative: p.safeAlternative,
    minGiocatori: p.minGiocatori,
  };
}

const base: FiltriOV = {
  intensitaMax: "Caotico",
  difficoltaMax: "Estremo",
  numGiocatori: 4,
};

describe("filtraOV", () => {
  it("separa truth e dare per tipo", () => {
    const items = [d({ id: "t", tipo: "truth" }), d({ id: "d", tipo: "dare" })];
    expect(filtraOV(items, "truth", base).map((x) => x.id)).toEqual(["t"]);
    expect(filtraOV(items, "dare", base).map((x) => x.id)).toEqual(["d"]);
  });

  it("rispetta la difficoltà massima", () => {
    const items = [d({ id: "a", difficolta: "Facile" }), d({ id: "b", difficolta: "Estremo" })];
    const res = filtraOV(items, "dare", { ...base, difficoltaMax: "Medio" });
    expect(res.map((x) => x.id)).toEqual(["a"]);
  });

  it("rispetta l'intensità massima", () => {
    const items = [d({ id: "a", intensita: "Tranquillo" }), d({ id: "b", intensita: "Caotico" })];
    const res = filtraOV(items, "dare", { ...base, intensitaMax: "Divertente" });
    expect(res.map((x) => x.id)).toEqual(["a"]);
  });

  it("rispetta la categoria selezionata", () => {
    const items = [d({ id: "a", categoria: "Movimento" }), d({ id: "b", categoria: "Scuola" })];
    const res = filtraOV(items, "dare", { ...base, categorie: ["Scuola"] });
    expect(res.map((x) => x.id)).toEqual(["b"]);
  });

  it("richiede il numero minimo di giocatori", () => {
    const items = [d({ id: "a", minGiocatori: 6 }), d({ id: "b", minGiocatori: 2 })];
    const res = filtraOV(items, "dare", { ...base, numGiocatori: 3 });
    expect(res.map((x) => x.id)).toEqual(["b"]);
  });

  it("in modalità senza movimento esclude sfide di movimento senza alternativa", () => {
    const items = [
      d({ id: "a", richiedeMovimento: true }),
      d({ id: "b", richiedeMovimento: true, safeAlternative: "resta seduto" }),
      d({ id: "c", richiedeMovimento: false }),
    ];
    const res = filtraOV(items, "dare", { ...base, senzaMovimento: true });
    expect(res.map((x) => x.id).sort()).toEqual(["b", "c"]);
  });

  it("esclude i contenuti già usati tramite scegliOV", () => {
    const items = [d({ id: "a", tipo: "dare" }), d({ id: "b", tipo: "dare" })];
    const chosen = scegliOV(items, "dare", { ...base, escludiIds: new Set(["a"]) });
    expect(chosen?.id).toBe("b");
  });
});

describe("scegliAlternativaSicura", () => {
  it("usa l'alternativa esplicita se presente", () => {
    const dare = d({ id: "d", safeAlternative: "Descrivi a parole" });
    const alt = scegliAlternativaSicura([dare], dare, base);
    expect(alt?.prompt).toBe("Descrivi a parole");
  });

  it("sceglie un'altra sfida sicura senza movimento/contatto", () => {
    const dare = d({ id: "d", richiedeMovimento: true });
    const safe = d({ id: "s", richiedeMovimento: false, richiedeContatto: false });
    const alt = scegliAlternativaSicura([dare, safe], dare, base);
    expect(alt?.id).toBe("s");
  });
});

describe("puntiOV", () => {
  it("verità = 1 punto", () => expect(puntiOV("truth", "Facile", false)).toBe(1));
  it("obbligo = 2 punti", () => expect(puntiOV("dare", "Facile", false)).toBe(2));
  it("obbligo difficile ha bonus", () => expect(puntiOV("dare", "Difficile", false)).toBe(3));
  it("alternativa riduce ma non azzera", () => expect(puntiOV("dare", "Facile", true)).toBe(1));
});

describe("puoSaltare", () => {
  it("illimitati sempre consentito", () => expect(puoSaltare("Illimitati", 99, 3)).toBe(true));
  it("limitati blocca oltre il massimo", () => {
    expect(puoSaltare("Limitati", 2, 3)).toBe(true);
    expect(puoSaltare("Limitati", 3, 3)).toBe(false);
  });
  it("con penalità consente sempre l'azione", () => expect(puoSaltare("Con penalità", 5, 3)).toBe(true));
});

describe("contenuto reale", () => {
  it("contiene sia truth sia dare", () => {
    expect(CONTENUTI_OV.some((c) => c.tipo === "truth")).toBe(true);
    expect(CONTENUTI_OV.some((c) => c.tipo === "dare")).toBe(true);
  });
  it("ogni dare di movimento ha un'alternativa sicura", () => {
    const senzaAlt = CONTENUTI_OV.filter(
      (c) => c.tipo === "dare" && c.richiedeMovimento && !c.safeAlternative,
    );
    expect(senzaAlt).toHaveLength(0);
  });
  it("nessun contenuto richiede contatto fisico", () => {
    expect(CONTENUTI_OV.every((c) => !c.richiedeContatto)).toBe(true);
  });
  it("non ha id duplicati", () => {
    const ids = CONTENUTI_OV.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

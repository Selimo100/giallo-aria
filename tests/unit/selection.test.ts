import { describe, it, expect } from "vitest";
import {
  filtraContenuti,
  combinaFonti,
  scegliImpostori,
  mescola,
  difficoltaConsentite,
} from "@/lib/game-engine/selection";
import type { ContenutoGioco } from "@/types/domain";

function c(partial: Partial<ContenutoGioco>): ContenutoGioco {
  return {
    id: partial.id ?? "x",
    gameType: "impostore",
    prompt: "p",
    difficolta: partial.difficolta ?? "Facile",
    intensita: partial.intensita ?? "Tranquillo",
    categoria: partial.categoria,
  };
}

describe("filtraContenuti", () => {
  it("esclude i contenuti oltre l'intensità massima", () => {
    const items = [c({ id: "a", intensita: "Tranquillo" }), c({ id: "b", intensita: "Caotico" })];
    const res = filtraContenuti(items, { intensitaMax: "Divertente" });
    expect(res.map((r) => r.id)).toEqual(["a"]);
  });

  it("filtra per categoria quando specificata", () => {
    const items = [c({ id: "a", categoria: "Animali" }), c({ id: "b", categoria: "Cibo" })];
    const res = filtraContenuti(items, {
      intensitaMax: "Caotico",
      categorie: ["Cibo"],
    });
    expect(res.map((r) => r.id)).toEqual(["b"]);
  });

  it("esclude gli id già usati di recente", () => {
    const items = [c({ id: "a" }), c({ id: "b" })];
    const res = filtraContenuti(items, {
      intensitaMax: "Caotico",
      escludiIds: new Set(["a"]),
    });
    expect(res.map((r) => r.id)).toEqual(["b"]);
  });
});

describe("combinaFonti (fonti di contenuto)", () => {
  const uff = [c({ id: "u1" }), c({ id: "u2" })];
  const per = [c({ id: "p1" }), c({ id: "p2" })];

  it("official_only usa solo i contenuti del gioco", () => {
    const res = combinaFonti(uff, per, "official_only");
    expect(res.map((r) => r.id).sort()).toEqual(["u1", "u2"]);
  });

  it("personal_only usa solo i contenuti personali, senza fallback", () => {
    const res = combinaFonti(uff, per, "personal_only");
    expect(res.map((r) => r.id).sort()).toEqual(["p1", "p2"]);
  });

  it("personal_only senza contenuti personali resta vuoto", () => {
    expect(combinaFonti(uff, [], "personal_only")).toHaveLength(0);
  });

  it("mixed include entrambe le fonti", () => {
    const res = combinaFonti(uff, per, "mixed");
    expect(res.map((r) => r.id).sort()).toEqual(["p1", "p2", "u1", "u2"]);
  });
});

describe("scegliImpostori", () => {
  it("sceglie n impostori distinti, mai tutti i giocatori", () => {
    const imp = scegliImpostori(5, 2);
    expect(new Set(imp).size).toBe(2);
    expect(imp.every((i) => i >= 0 && i < 5)).toBe(true);
  });
  it("garantisce almeno un non-impostore", () => {
    const imp = scegliImpostori(3, 5);
    expect(imp.length).toBeLessThan(3);
  });
});

describe("mescola", () => {
  it("mantiene gli stessi elementi", () => {
    const a = [1, 2, 3, 4];
    expect(mescola(a).sort()).toEqual(a);
  });
  it("non muta l'array originale", () => {
    const a = [1, 2, 3];
    mescola(a);
    expect(a).toEqual([1, 2, 3]);
  });
});

describe("difficoltaConsentite", () => {
  it("include tutte le difficoltà fino al massimo", () => {
    expect(difficoltaConsentite("Difficile")).toEqual(["Facile", "Medio", "Difficile"]);
  });
});

import type { GameMode } from "@/types/domain";

// Registry of all game modes. Adding a new mode = add an entry here + its
// engine + its route component. Shared setup/engine avoids duplicating logic.
export const GIOCHI: GameMode[] = [
  {
    slug: "impostore",
    nome: "L'Impostore",
    tagline: "Scopri chi non conosce la parola segreta.",
    descrizione:
      "Tutti conoscono la parola segreta, tranne l'impostore. A turno date indizi: smascherate chi bluffa prima che sia troppo tardi.",
    emoji: "🕵️",
    minGiocatori: 3,
    maxGiocatori: 20,
    colore: "giallo",
    giocabile: true,
  },
  {
    slug: "chi-e-piu-probabile",
    nome: "Chi è più probabile?",
    tagline: "Votate chi corrisponde meglio alla domanda.",
    descrizione:
      "Una domanda, tutto il gruppo. Chi è più probabile che…? Votate insieme o uno alla volta e ridete dei risultati.",
    emoji: "🤔",
    minGiocatori: 2,
    maxGiocatori: 20,
    colore: "cielo",
    giocabile: true,
  },
  {
    slug: "obbligo-o-verita",
    nome: "Obbligo o Verità",
    tagline: "Rispondi sinceramente o accetta la sfida.",
    descrizione:
      "Il grande classico. Scegli obbligo o verità: puoi sempre saltare senza penalità.",
    emoji: "🎯",
    minGiocatori: 2,
    maxGiocatori: 20,
    colore: "corallo",
    giocabile: true,
  },
  {
    slug: "indovina-la-parola",
    nome: "Indovina la parola",
    tagline: "Descrivete la parola, chi tiene il telefono indovina.",
    descrizione:
      "Descrivete la parola senza dirla. Chi tiene il telefono deve indovinarla prima che finisca il tempo.",
    emoji: "💬",
    minGiocatori: 2,
    maxGiocatori: 20,
    colore: "cielo",
    giocabile: true,
  },
  {
    slug: "preferiresti",
    nome: "Preferiresti?",
    tagline: "Due scelte impossibili, una decisione.",
    descrizione: "Preferiresti volare o essere invisibile? Votate e confrontatevi.",
    emoji: "⚖️",
    minGiocatori: 2,
    maxGiocatori: 20,
    colore: "viola",
    giocabile: true,
  },
  {
    slug: "non-ho-mai",
    nome: "Non ho mai",
    tagline: "Confessioni di gruppo.",
    descrizione: "Chi ha già fatto la cosa detta? Scopritelo, con o senza punteggi.",
    emoji: "🙈",
    minGiocatori: 2,
    maxGiocatori: 20,
    colore: "menta",
    giocabile: true,
  },
  {
    slug: "sfide",
    nome: "Sfide",
    tagline: "Mini-sfide divertenti e sicure.",
    descrizione: "Sfide veloci per singoli, coppie o gruppi. Sempre sicure.",
    emoji: "🏆",
    minGiocatori: 2,
    maxGiocatori: 20,
    colore: "giallo",
    giocabile: true,
  },
  {
    slug: "categorie",
    nome: "Categorie",
    tagline: "Una lettera, una categoria, via!",
    descrizione: "Trovate parole valide a turno prima che scada il tempo.",
    emoji: "🔤",
    minGiocatori: 2,
    maxGiocatori: 20,
    colore: "cielo",
    giocabile: true,
  },
  {
    slug: "indovina-chi",
    nome: "Indovina chi",
    tagline: "Domande sì/no per scoprire l'identità.",
    descrizione: "Un giocatore riceve un'identità segreta e il gruppo risponde.",
    emoji: "❓",
    minGiocatori: 3,
    maxGiocatori: 20,
    colore: "corallo",
    giocabile: true,
  },
  {
    slug: "parola-proibita",
    nome: "Parola proibita",
    tagline: "Fai indovinare senza usare le parole vietate.",
    descrizione: "Descrivi la parola bersaglio evitando quelle proibite.",
    emoji: "🚫",
    minGiocatori: 3,
    maxGiocatori: 20,
    colore: "viola",
    giocabile: true,
  },
];

export function getGioco(slug: string): GameMode | undefined {
  return GIOCHI.find((g) => g.slug === slug);
}

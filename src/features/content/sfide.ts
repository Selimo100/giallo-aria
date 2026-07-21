import type { ContenutoGioco, Intensita } from "@/types/domain";

export type TipoSfida = "Individuale" | "Coppia" | "Gruppo";

export interface Sfida extends ContenutoGioco {
  tipoSfida: TipoSfida;
  timerConsigliato?: number;
}

// prompt, tipo, timer, intensita, etaMin
const raw: Array<[string, TipoSfida, number, Intensita, number]> = [
  ["Elenca 5 animali che iniziano con la lettera M in 15 secondi.", "Individuale", 15, "Divertente", 0],
  ["Fai il tuo miglior verso di un leone.", "Individuale", 0, "Divertente", 0],
  ["Racconta una storia di 20 secondi iniziando con 'C'era una volta'.", "Individuale", 20, "Divertente", 0],
  ["Descrivi la tua giornata usando solo mimo.", "Individuale", 30, "Divertente", 0],
  ["Dì l'alfabeto al contrario il più velocemente possibile.", "Individuale", 30, "Divertente", 13],
  ["Trova 3 oggetti gialli nella stanza in 20 secondi.", "Individuale", 20, "Divertente", 0],
  ["Fai un complimento sincero a ogni persona del gruppo.", "Individuale", 0, "Tranquillo", 0],
  ["Inventa uno slogan pubblicitario per i calzini.", "Individuale", 20, "Divertente", 0],
  ["Imita un personaggio famoso finché il gruppo non indovina.", "Individuale", 45, "Divertente", 13],
  ["Canta il ritornello di una canzone a tua scelta.", "Individuale", 20, "Divertente", 0],
  ["Mettetevi d'accordo su una posa e scattate una foto immaginaria.", "Coppia", 15, "Divertente", 0],
  ["Create insieme una breve scenetta su un litigio tra due verdure.", "Coppia", 45, "Divertente", 0],
  ["A turno dite una parola per costruire una frase sensata.", "Coppia", 30, "Divertente", 0],
  ["Imitate uno lo specchio dell'altro per 20 secondi.", "Coppia", 20, "Divertente", 0],
  ["Cantate un duetto improvvisato su cosa avete mangiato oggi.", "Coppia", 30, "Caotico", 0],
  ["Descrivete un film a gesti finché il gruppo non lo indovina.", "Coppia", 45, "Divertente", 13],
  ["Tutti insieme contate fino a 10 senza accordarvi su chi parla.", "Gruppo", 30, "Caotico", 0],
  ["Fate un'onda come allo stadio, tre volte di fila.", "Gruppo", 15, "Divertente", 0],
  ["Inventate un coro per il gruppo e cantatelo insieme.", "Gruppo", 30, "Caotico", 0],
  ["Create una statua di gruppo che rappresenti 'la felicità'.", "Gruppo", 20, "Divertente", 0],
  ["A turno aggiungete un suono per creare una canzone ritmata.", "Gruppo", 30, "Divertente", 0],
  ["Trovate una cosa che avete tutti in comune in 60 secondi.", "Gruppo", 60, "Tranquillo", 0],
  ["Mimate una squadra sportiva che festeggia una vittoria.", "Gruppo", 20, "Caotico", 0],
  ["Raccontate una storia a catena, una frase a testa.", "Gruppo", 60, "Divertente", 0],
  ["Fai una smorfia e mantienila per 15 secondi senza ridere.", "Individuale", 15, "Divertente", 0],
  ["Parla per 30 secondi senza usare la lettera 'A'.", "Individuale", 30, "Caotico", 16],
  ["Descrivi il tuo piatto preferito come un critico gastronomico.", "Individuale", 30, "Divertente", 0],
  ["Cammina attraverso la stanza come una modella su una passerella.", "Individuale", 15, "Divertente", 0],
  ["Fate un tris di battute e votate la più divertente.", "Gruppo", 45, "Divertente", 13],
  ["Recita una scena drammatica leggendo la lista della spesa.", "Individuale", 30, "Divertente", 13],
];

export const SFIDE: Sfida[] = raw.map(([prompt, tipoSfida, timer, intensita], i) => ({
  id: `sfida-${i}`,
  gameType: "sfide",
  prompt,
  tipoSfida,
  timerConsigliato: timer,
  intensita,
}));

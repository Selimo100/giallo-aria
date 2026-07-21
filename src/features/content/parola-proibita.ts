import type { ContenutoGioco } from "@/types/domain";

// "Parola proibita" (taboo): describe the target without saying the forbidden words.
export interface CartaProibita extends ContenutoGioco {
  forbiddenWords: string[];
  categoria: string;
}

// target, forbidden[], categoria, etaMin
const raw: Array<[string, string[], string, number]> = [
  ["Pizza", ["margherita", "forno", "pomodoro", "formaggio"], "Cibo", 0],
  ["Spiaggia", ["mare", "sabbia", "sole", "ombrellone"], "Luoghi", 0],
  ["Cane", ["abbaiare", "guinzaglio", "osso", "animale"], "Animali", 0],
  ["Telefono", ["chiamare", "messaggio", "schermo", "app"], "Oggetti", 0],
  ["Scuola", ["insegnante", "compiti", "classe", "studiare"], "Luoghi", 0],
  ["Natale", ["regali", "albero", "Babbo", "dicembre"], "Feste", 0],
  ["Calcio", ["pallone", "gol", "squadra", "campo"], "Sport", 0],
  ["Gelato", ["freddo", "cono", "cioccolato", "estate"], "Cibo", 0],
  ["Aereo", ["volare", "cielo", "pilota", "aeroporto"], "Viaggi", 0],
  ["Medico", ["ospedale", "malato", "cura", "camice"], "Professioni", 0],
  ["Pioggia", ["acqua", "ombrello", "nuvole", "bagnato"], "Natura", 0],
  ["Compleanno", ["torta", "candeline", "regali", "festa"], "Feste", 0],
  ["Biblioteca", ["libri", "silenzio", "leggere", "scaffali"], "Luoghi", 0],
  ["Chitarra", ["suonare", "corde", "musica", "strumento"], "Musica", 0],
  ["Montagna", ["neve", "sci", "alta", "cima"], "Natura", 0],
  ["Supermercato", ["spesa", "carrello", "cassa", "prodotti"], "Luoghi", 0],
  ["Robot", ["macchina", "metallo", "futuro", "intelligenza"], "Tecnologia", 13],
  ["Vulcano", ["lava", "eruzione", "montagna", "fuoco"], "Natura", 0],
  ["Fotografia", ["foto", "scattare", "macchina", "ricordo"], "Oggetti", 0],
  ["Orologio", ["tempo", "ore", "polso", "lancette"], "Oggetti", 0],
  ["Cameriere", ["ristorante", "ordine", "tavolo", "piatti"], "Professioni", 0],
  ["Cinema", ["film", "schermo", "popcorn", "sala"], "Luoghi", 0],
  ["Bicicletta", ["pedali", "ruote", "pedalare", "sella"], "Oggetti", 0],
  ["Estate", ["caldo", "vacanze", "sole", "mare"], "Stagioni", 0],
  ["Pinguino", ["ghiaccio", "nero", "bianco", "polo"], "Animali", 0],
  ["Chef", ["cucina", "cuoco", "ristorante", "piatti"], "Professioni", 13],
  ["Semaforo", ["rosso", "verde", "strada", "auto"], "Oggetti", 0],
  ["Zaino", ["spalle", "scuola", "portare", "tasche"], "Oggetti", 0],
  ["Arcobaleno", ["colori", "pioggia", "cielo", "sette"], "Natura", 0],
  ["Astronauta", ["spazio", "razzo", "luna", "tuta"], "Professioni", 13],
];

export const CARTE_PROIBITE: CartaProibita[] = raw.map(([target, forbidden, categoria], i) => ({
  id: `pp-${i}`,
  gameType: "parola-proibita",
  prompt: target,
  answer: target,
  forbiddenWords: forbidden,
  categoria,
  intensita: "Divertente",
}));

export const CATEGORIE_PROIBITE = Array.from(new Set(CARTE_PROIBITE.map((c) => c.categoria)));

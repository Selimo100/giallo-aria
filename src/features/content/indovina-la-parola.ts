import type { ParolaIndovina } from "@/types/domain";

// Official word bank for "Indovina la parola". All original, natural Italian,
// family-safe (intensity always "Tranquillo" so words are always available).
// Words are grouped by category; difficulty is derived from the position in
// each list (earlier = easier, more common; later = harder to describe).
//
// The describing players see the word and give spoken clues; the guessing
// player must not read it. Words are chosen to be guessable through description.

export const CATEGORIE_INDOVINA_PAROLA = [
  "Animali",
  "Cibo",
  "Luoghi",
  "Professioni",
  "Oggetti",
  "Sport",
  "Tecnologia",
  "Musica",
  "Film e serie",
  "Viaggi",
  "Scuola",
  "Natura",
  "Azioni",
  "Personaggi",
  "Casa",
  "Corpo umano",
] as const;

export type CategoriaIndovinaParola = (typeof CATEGORIE_INDOVINA_PAROLA)[number];

// Raw word lists per category. Kept as plain strings for readability; ids and
// difficulty are derived deterministically below.
const PAROLE: Record<CategoriaIndovinaParola, string[]> = {
  Animali: [
    "Cane", "Gatto", "Cavallo", "Mucca", "Pecora", "Coniglio", "Leone", "Tigre",
    "Elefante", "Giraffa", "Scimmia", "Delfino", "Squalo", "Balena", "Pinguino",
    "Aquila", "Gufo", "Ape", "Farfalla", "Ragno", "Coccodrillo", "Riccio",
    "Scoiattolo", "Fenicottero", "Ornitorinco",
  ],
  Cibo: [
    "Pizza", "Pane", "Formaggio", "Gelato", "Cioccolato", "Mela", "Banana",
    "Fragola", "Pasta", "Riso", "Uovo", "Insalata", "Zuppa", "Torta", "Biscotto",
    "Miele", "Caffè", "Spaghetti", "Lasagna", "Tiramisù", "Melanzana", "Carciofo",
    "Cannolo", "Bruschetta", "Zafferano",
  ],
  Luoghi: [
    "Casa", "Scuola", "Ospedale", "Mercato", "Parco", "Spiaggia", "Montagna",
    "Stazione", "Aeroporto", "Museo", "Teatro", "Stadio", "Biblioteca", "Castello",
    "Ponte", "Faro", "Deserto", "Isola", "Grotta", "Vulcano", "Cascata",
    "Piazza", "Porto", "Miniera", "Osservatorio",
  ],
  Professioni: [
    "Medico", "Maestro", "Cuoco", "Pompiere", "Poliziotto", "Contadino", "Pittore",
    "Cantante", "Attore", "Scienziato", "Idraulico", "Falegname", "Giardiniere",
    "Pescatore", "Astronauta", "Giudice", "Architetto", "Veterinario", "Fotografo",
    "Pilota", "Elettricista", "Bibliotecario", "Archeologo", "Sommelier", "Notaio",
  ],
  Oggetti: [
    "Sedia", "Tavolo", "Bottiglia", "Ombrello", "Chiave", "Orologio", "Occhiali",
    "Zaino", "Forbici", "Martello", "Candela", "Specchio", "Bussola", "Lanterna",
    "Valigia", "Scopa", "Pennello", "Tromba", "Aquilone", "Salvadanaio", "Clessidra",
    "Cannocchiale", "Megafono", "Metronomo", "Caleidoscopio",
  ],
  Sport: [
    "Calcio", "Tennis", "Nuoto", "Pallavolo", "Basket", "Ciclismo", "Sci",
    "Corsa", "Golf", "Boxe", "Scherma", "Judo", "Rugby", "Pattinaggio", "Surf",
    "Arrampicata", "Canottaggio", "Ginnastica", "Equitazione", "Tuffo", "Bowling",
    "Freccette", "Vela", "Curling", "Pentathlon",
  ],
  Tecnologia: [
    "Telefono", "Computer", "Tastiera", "Mouse", "Schermo", "Robot", "Batteria",
    "Cavo", "Antenna", "Microfono", "Altoparlante", "Fotocamera", "Stampante",
    "Router", "Drone", "Satellite", "Microchip", "Processore", "Sensore",
    "Visore", "Console", "Auricolari", "Scanner", "Termostato", "Server",
  ],
  Musica: [
    "Chitarra", "Pianoforte", "Batteria", "Violino", "Flauto", "Tromba", "Tamburo",
    "Sassofono", "Arpa", "Fisarmonica", "Coro", "Orchestra", "Concerto", "Melodia",
    "Ritornello", "Nota", "Spartito", "Direttore", "Ballerino", "Microfono",
    "Metronomo", "Clarinetto", "Contrabbasso", "Xilofono", "Ottava",
  ],
  "Film e serie": [
    "Cinema", "Attore", "Regista", "Popcorn", "Schermo", "Biglietto", "Trama",
    "Scena", "Colonna sonora", "Cartone animato", "Supereroe", "Fantascienza",
    "Commedia", "Documentario", "Thriller", "Sequel", "Protagonista", "Comparsa",
    "Provino", "Sceneggiatura", "Effetti speciali", "Titoli di coda", "Cascatore",
    "Doppiatore", "Anteprima",
  ],
  Viaggi: [
    "Valigia", "Passaporto", "Aereo", "Treno", "Nave", "Hotel", "Mappa", "Spiaggia",
    "Montagna", "Souvenir", "Zaino", "Biglietto", "Frontiera", "Bussola", "Guida",
    "Tenda", "Crociera", "Dogana", "Itinerario", "Pensione", "Ostello", "Sentiero",
    "Traghetto", "Coincidenza", "Fuso orario",
  ],
  Scuola: [
    "Lavagna", "Quaderno", "Penna", "Zaino", "Banco", "Maestra", "Compito", "Voto",
    "Ricreazione", "Gessetto", "Astuccio", "Diario", "Gomma", "Righello", "Cartella",
    "Pagella", "Interrogazione", "Ricerca", "Laboratorio", "Preside", "Mensa",
    "Campanella", "Verifica", "Cattedra", "Mappamondo",
  ],
  Natura: [
    "Albero", "Fiore", "Fiume", "Lago", "Sole", "Luna", "Stella", "Nuvola",
    "Pioggia", "Neve", "Vento", "Arcobaleno", "Foresta", "Prato", "Roccia",
    "Fulmine", "Tramonto", "Alba", "Nebbia", "Marea", "Ghiacciaio", "Scogliera",
    "Palude", "Rugiada", "Eclissi",
  ],
  Azioni: [
    "Correre", "Saltare", "Dormire", "Mangiare", "Ridere", "Piangere", "Ballare",
    "Cantare", "Nuotare", "Scrivere", "Disegnare", "Cucinare", "Leggere",
    "Sussurrare", "Applaudire", "Abbracciare", "Starnutire", "Russare", "Fischiare",
    "Sbadigliare", "Arrampicarsi", "Galleggiare", "Rimbalzare", "Mescolare",
    "Equilibrarsi",
  ],
  Personaggi: [
    "Re", "Regina", "Principe", "Cavaliere", "Pirata", "Strega", "Fata", "Drago",
    "Gigante", "Folletto", "Fantasma", "Vampiro", "Robot", "Alieno", "Detective",
    "Clown", "Ninja", "Astronauta", "Sirena", "Mago", "Cowboy", "Esploratore",
    "Giullare", "Naufrago", "Alchimista",
  ],
  Casa: [
    "Cucina", "Letto", "Divano", "Frigorifero", "Forno", "Doccia", "Finestra",
    "Porta", "Tappeto", "Lampada", "Armadio", "Cuscino", "Coperta", "Tenda",
    "Scala", "Camino", "Rubinetto", "Cassetto", "Mensola", "Balcone", "Cantina",
    "Soffitta", "Zerbino", "Grondaia", "Ringhiera",
  ],
  "Corpo umano": [
    "Mano", "Piede", "Testa", "Occhio", "Naso", "Bocca", "Orecchio", "Capelli",
    "Braccio", "Gamba", "Ginocchio", "Gomito", "Dito", "Spalla", "Cuore",
    "Cervello", "Polmone", "Lingua", "Sopracciglio", "Caviglia", "Polso",
    "Tallone", "Clavicola", "Palpebra", "Mignolo",
  ],
};

export const PAROLE_INDOVINA: ParolaIndovina[] = CATEGORIE_INDOVINA_PAROLA.flatMap(
  (categoria) => {
    const lista = PAROLE[categoria];
    return lista.map((prompt, i) => ({
      id: `gtw-${slugify(categoria)}-${i}`,
      gameType: "indovina-la-parola" as const,
      prompt,
      categoria,
      intensita: "Tranquillo" as const,
    }));
  },
);

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Total official words available (used by docs/tests to assert the minimum set).
export const TOTALE_PAROLE_INDOVINA = PAROLE_INDOVINA.length;

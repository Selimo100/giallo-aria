import type { ContenutoGioco } from "@/types/domain";

// "Indovina chi" (stile 'chi sono io'): an identity the guesser must find while
// holding the phone so the group can see it (the guesser does not look).
const raw: Array<[string, string, number]> = [
  ["Un gatto", "Animali", 0],
  ["Un elefante", "Animali", 0],
  ["Un pinguino", "Animali", 0],
  ["Un delfino", "Animali", 0],
  ["Un camaleonte", "Animali", 0],
  ["Un canguro", "Animali", 0],
  ["Un dottore", "Professioni", 0],
  ["Un astronauta", "Professioni", 0],
  ["Un cuoco", "Professioni", 0],
  ["Un pompiere", "Professioni", 0],
  ["Un archeologo", "Professioni", 13],
  ["Un giornalista", "Professioni", 13],
  ["Una chitarra", "Oggetti", 0],
  ["Un ombrello", "Oggetti", 0],
  ["Un frigorifero", "Oggetti", 0],
  ["Un telescopio", "Oggetti", 0],
  ["Una bicicletta", "Oggetti", 0],
  ["Un robot", "Oggetti", 0],
  ["Un supereroe che vola", "Personaggi", 0],
  ["Una principessa delle favole", "Personaggi", 0],
  ["Un pirata", "Personaggi", 0],
  ["Un mago", "Personaggi", 0],
  ["Un cavaliere", "Personaggi", 0],
  ["Un vampiro simpatico", "Personaggi", 13],
  ["Un calciatore famoso", "Personaggi", 13],
  ["Un cantante pop", "Personaggi", 13],
  ["Un dinosauro", "Animali", 0],
  ["Un gufo", "Animali", 0],
  ["Un giudice", "Professioni", 16],
  ["Un direttore d'orchestra", "Professioni", 16],
];

export const IDENTITA: ContenutoGioco[] = raw.map(([prompt, categoria], i) => ({
  id: `idc-${i}`,
  gameType: "indovina-chi",
  prompt,
  categoria,
  intensita: "Divertente",
}));

export const CATEGORIE_INDOVINA = Array.from(new Set(IDENTITA.map((i) => i.categoria!)));

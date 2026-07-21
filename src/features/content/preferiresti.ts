import type { ContenutoGioco, Intensita } from "@/types/domain";

// "Preferiresti?" — two options. optionA/optionB drive the vote.
export interface DomandaPreferiresti extends ContenutoGioco {
  optionA: string;
  optionB: string;
}

const raw: Array<[string, string, Intensita, number]> = [
  ["poter volare", "essere invisibile", "Tranquillo", 0],
  ["avere sempre caldo", "avere sempre freddo", "Tranquillo", 0],
  ["poter parlare con gli animali", "parlare tutte le lingue del mondo", "Tranquillo", 0],
  ["vivere al mare", "vivere in montagna", "Tranquillo", 0],
  ["non poter più usare internet", "non poter più guardare film e serie", "Divertente", 0],
  ["avere un drago come animale domestico", "avere un unicorno", "Divertente", 0],
  ["poter viaggiare nel passato", "poter viaggiare nel futuro", "Tranquillo", 0],
  ["mangiare solo pizza per un anno", "mangiare solo gelato per un anno", "Divertente", 0],
  ["essere famoso ma povero", "essere ricco ma sconosciuto", "Divertente", 13],
  ["avere il potere di fermare il tempo", "poter leggere nel pensiero", "Divertente", 13],
  ["dover cantare invece di parlare", "dover ballare ovunque tu vada", "Divertente", 0],
  ["avere braccia lunghissime", "gambe lunghissime", "Divertente", 0],
  ["non poter più mentire", "non poter più dire di no", "Audace", 13],
  ["vivere senza musica", "vivere senza dolci", "Tranquillo", 0],
  ["essere sempre in ritardo di 10 minuti", "sempre in anticipo di un'ora", "Divertente", 0],
  ["avere un pulsante per mettere in pausa la giornata", "un pulsante per riavvolgere di 10 minuti", "Tranquillo", 0],
  ["poter respirare sott'acqua", "poter camminare sui muri", "Divertente", 0],
  ["dover indossare lo stesso vestito per un anno", "cambiare pettinatura ogni giorno a caso", "Divertente", 0],
  ["avere sempre le scarpe bagnate", "avere sempre un sassolino nella scarpa", "Divertente", 0],
  ["saper suonare qualsiasi strumento", "saper parlare con chiunque senza timidezza", "Tranquillo", 13],
  ["essere il più forte del gruppo", "il più intelligente del gruppo", "Divertente", 13],
  ["poter teletrasportarti ovunque", "non dover mai più dormire senza stancarti", "Divertente", 13],
  ["avere un anno di vacanza pagata", "un lavoro dei sogni da subito", "Tranquillo", 16],
  ["dover dire sempre la verità", "poter dimenticare un ricordo imbarazzante", "Audace", 16],
  ["vivere in un mondo senza inverno", "in un mondo senza estate", "Tranquillo", 0],
  ["avere superpoteri ma nessuno ci crede", "essere normale ma tutti ti ammirano", "Divertente", 13],
  ["dover ridere in ogni momento serio", "dover starnutire ogni 5 minuti", "Caotico", 0],
  ["poter mangiare tutto senza ingrassare", "dormire quanto vuoi senza mai stancarti", "Tranquillo", 13],
  ["avere una memoria perfetta", "poter dimenticare ciò che vuoi", "Tranquillo", 13],
  ["essere protagonista di un film", "scrivere la storia di un film di successo", "Tranquillo", 0],
  ["poter cambiare colore dei capelli col pensiero", "cambiare altezza quando vuoi", "Divertente", 0],
  ["avere un robot che fa i compiti", "un robot che riordina la casa", "Divertente", 0],
  ["dover parlare sempre in rima", "dover cantare le risposte", "Caotico", 0],
  ["poter volare ma lentissimo", "correre velocissimo ma solo all'indietro", "Divertente", 0],
  ["avere sempre ragione ma nessuno ti ascolta", "avere spesso torto ma tutti ti seguono", "Audace", 16],
  ["passare un giorno da invisibile", "un giorno potendo volare", "Divertente", 0],
];

export const DOMANDE_PREFERIRESTI: DomandaPreferiresti[] = raw.map(
  ([optionA, optionB, intensita], i) => ({
    id: `pref-${i}`,
    gameType: "preferiresti",
    prompt: `Preferiresti ${optionA} o ${optionB}?`,
    optionA: optionA.charAt(0).toUpperCase() + optionA.slice(1),
    optionB: optionB.charAt(0).toUpperCase() + optionB.slice(1),
    intensita,
  }),
);

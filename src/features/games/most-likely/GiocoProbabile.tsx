"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Badge, Avatar } from "@/components/ui";
import { PassaTelefono } from "@/components/games/PassaTelefono";
import { it } from "@/messages/it";
import { DOMANDE_PROBABILE } from "@/features/content/chi-e-piu-probabile";
import { useContenutiPersonali } from "@/features/content/useContenutiPersonali";
import { personaliProbabile } from "@/lib/local-storage/custom-content";
import { filtraContenuti, combinaFonti, scegliCasuale } from "@/lib/game-engine/selection";
import { type ContenutoGioco } from "@/types/domain";
import {
  salvaSessione,
  eliminaSessione,
  type SessionePubblica,
} from "@/lib/local-storage/session";

type Fase = "domanda" | "voto_privato" | "risultato" | "finito";

export default function GiocoProbabile({
  sessione: iniziale,
}: {
  sessione: SessionePubblica;
}) {
  const router = useRouter();
  const config = iniziale.config;
  const giocatori = config.giocatori;

  const [fase, setFase] = useState<Fase>("domanda");
  const [round, setRound] = useState(iniziale.round);
  const [punteggi, setPunteggi] = useState<Record<string, number>>(iniziale.punteggi);
  const usedRef = useRef<Set<string>>(new Set(iniziale.usedContentIds));
  const [domanda, setDomanda] = useState<ContenutoGioco | null>(null);
  // votes: giocatoreId (target) -> count
  const [voti, setVoti] = useState<Record<string, number>>({});
  const [votanteIndex, setVotanteIndex] = useState(0);
  const [sceltaGruppo, setSceltaGruppo] = useState<string | null>(null);

  const personali = useContenutiPersonali();
  const domandePossibili = useMemo(
    () => filtraContenuti(
        combinaFonti(
          DOMANDE_PROBABILE,
          personaliProbabile(personali, true),
          config.contentSource ?? "official_only",
        ),
        {
          intensitaMax: config.intensita,
        },
      ),
    [config, personali],
  );

  const persist = useCallback(
    (patch: Partial<SessionePubblica>) => {
      salvaSessione({
        ...iniziale,
        round,
        usedContentIds: [...usedRef.current],
        punteggi,
        ...patch,
        aggiornata: Date.now(),
      });
    },
    [iniziale, round, punteggi],
  );

  function nuovaDomanda() {
    const disponibili = domandePossibili.filter((d) => !usedRef.current.has(d.id));
    const pool = disponibili.length > 0 ? disponibili : domandePossibili;
    const d = scegliCasuale(pool);
    if (!d) return;
    usedRef.current.add(d.id);
    setDomanda(d);
    setVoti({});
    setVotanteIndex(0);
    setSceltaGruppo(null);
    setFase(config.votoPrivato ? "voto_privato" : "domanda");
  }

  // called on first mount via round_intro-like: we lazily create a domanda
  if (!domanda && fase === "domanda") {
    // render intro until user starts
  }

  function registraVoto(targetId: string) {
    setVoti((v) => ({ ...v, [targetId]: (v[targetId] ?? 0) + 1 }));
    if (votanteIndex + 1 < giocatori.length) {
      setVotanteIndex((i) => i + 1);
    } else {
      finalizza();
    }
  }

  function finalizza(sceltaDiretta?: string) {
    // determine winner(s)
    const conteggio = sceltaDiretta ? { [sceltaDiretta]: 1 } : voti;
    const max = Math.max(0, ...Object.values(conteggio));
    if (config.punteggi && max > 0) {
      setPunteggi((p) => {
        const next = { ...p };
        Object.entries(conteggio).forEach(([id, n]) => {
          if (n === max) next[id] = (next[id] ?? 0) + 1;
        });
        return next;
      });
    }
    if (sceltaDiretta) setVoti({ [sceltaDiretta]: 1 });
    setFase("risultato");
  }

  function prossimo() {
    const nuovo = round + 1;
    if (nuovo > config.round) {
      persist({ round });
      setFase("finito");
      return;
    }
    setRound(nuovo);
    setDomanda(null);
    persist({ round: nuovo });
    setFase("domanda");
  }

  const wrap = "mx-auto max-w-2xl px-5 py-10 min-h-dvh flex flex-col justify-center";

  // Intro / question display for group voting
  if (fase === "domanda" && !domanda) {
    return (
      <main className={wrap}> <div className="anim-entra text-center"> <Badge colore="cielo">{it.comune.round} {round} / {config.round}</Badge>  <h1 className="font-titolo text-3xl font-extrabold">Chi è più probabile?</h1> <p className="mt-3 text-testo-morbido"> {config.votoPrivato
              ? "Ogni giocatore voterà in privato passando il telefono."
              : "Discutete e scegliete insieme la persona giusta."}
          </p> {domandePossibili.length === 0 ? (
            <p className="mt-6 text-corallo">{it.comune.nessunContenuto}</p> ) : (
            <Button className="mt-8" variant="secondario" onClick={nuovaDomanda}> {it.azioni.continua}
            </Button> )}
        </div> </main> );
  }

  // Group voting: show question + pick a player together
  if (fase === "domanda" && domanda) {
    return (
      <main className={wrap}> <div className="anim-entra"> <Card className="on-light text-black bg-[var(--color-superficie-2)] text-center"> <p className="font-titolo text-xl font-bold">{domanda.prompt}</p> </Card> <div className="mt-6 grid gap-2"> {giocatori.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setSceltaGruppo(g.id)}
                className={`flex items-center gap-3 rounded-[var(--radius-card)] border p-3 text-left transition ${
                  sceltaGruppo === g.id
                    ? "border-cielo ring-2 ring-cielo bg-cielo/10"
                    : "border-[var(--color-bordo)] on-light text-black bg-[var(--color-superficie)]"
                }`}
              > <Avatar nome={g.nome} colore={g.colore} /> <span className="font-semibold">{g.nome}</span> </button> ))}
          </div> <div className="mt-6 flex gap-3"> <Button variant="morbido" onClick={nuovaDomanda}>{it.azioni.salta}</Button> <Button
              variant="secondario"
              fullWidth
              disabled={!sceltaGruppo}
              onClick={() => finalizza(sceltaGruppo!)}
            > Conferma
            </Button> </div> </div> </main> );
  }

  // Private sequential voting on the shared phone
  if (fase === "voto_privato" && domanda) {
    const votante = giocatori[votanteIndex];
    return (
      <main className={wrap}> <p className="mb-6 text-center text-sm text-testo-morbido"> Voto {votanteIndex + 1} di {giocatori.length}
        </p> <PassaTelefono
          key={votante.id}
          giocatore={votante}
          onDone={() => {}}
          etichettaFine={it.azioni.hoCapito}
        > <Card className="w-full"> <p className="font-titolo text-lg font-bold">{domanda.prompt}</p> <p className="mt-2 text-sm text-testo-morbido">Tocca la tua risposta:</p> <div className="mt-3 grid gap-2"> {giocatori.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => registraVoto(g.id)}
                  className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-bordo)] on-light text-black bg-[var(--color-superficie-2)] p-2.5 text-left"
                > <Avatar nome={g.nome} colore={g.colore} /> <span className="font-semibold">{g.nome}</span> </button> ))}
            </div> </Card> </PassaTelefono> </main> );
  }

  if (fase === "risultato" && domanda) {
    const totale = Object.values(voti).reduce((a, b) => a + b, 0) || 1;
    const max = Math.max(0, ...Object.values(voti));
    const classifica = giocatori
      .map((g) => ({ g, n: voti[g.id] ?? 0 }))
      .sort((a, b) => b.n - a.n);
    return (
      <main className={wrap}> <div className="anim-entra"> <Card className="on-light text-black bg-[var(--color-superficie-2)] text-center"> <p className="font-titolo text-lg font-bold">{domanda.prompt}</p> </Card> <div className="mt-6 space-y-2"> {classifica.map(({ g, n }) => (
              <div key={g.id} className="flex items-center gap-3"> <Avatar nome={g.nome} colore={g.colore} /> <span className="w-24 font-semibold">{g.nome}</span> <div className="h-3 flex-1 overflow-hidden rounded-full on-light text-black bg-[var(--color-superficie-2)]"> <div
                    className={`h-full rounded-full ${n === max && n > 0 ? "bg-cielo" : "bg-[var(--color-bordo)]"}`}
                    style={{ width: `${(n / totale) * 100}%` }}
                  /> </div> <span className="w-16 text-right text-sm tabular-nums text-testo-morbido"> {n} ({Math.round((n / totale) * 100)}%)
                </span> </div> ))}
          </div> <Button className="mt-8" variant="secondario" fullWidth onClick={prossimo}> {round >= config.round ? "Risultati finali" : it.azioni.prossimoRound}
          </Button> </div> </main> );
  }

  // finito
  const vincitore = [...giocatori].sort((a, b) => (punteggi[b.id] ?? 0) - (punteggi[a.id] ?? 0))[0];
  return (
    <main className={wrap}> <div className="anim-entra text-center">  <h1 className="mt-4 font-titolo text-3xl font-extrabold">Partita finita!</h1> {config.punteggi && vincitore && (
          <p className="mt-3 text-lg"> {it.comune.vincitore}: <strong>{vincitore.nome}</strong> </p> )}
        <div className="mt-8 flex flex-col gap-3"> <Button
            variant="secondario"
            onClick={() => {
              setPunteggi(Object.fromEntries(giocatori.map((g) => [g.id, 0])));
              usedRef.current = new Set();
              setRound(1);
              setDomanda(null);
              persist({ round: 1, usedContentIds: [], punteggi: Object.fromEntries(giocatori.map((g) => [g.id, 0])) });
              setFase("domanda");
            }}
          > {it.azioni.rigioca}
          </Button> <Button
            variant="morbido"
            onClick={() => {
              eliminaSessione();
              router.push("/giochi");
            }}
          > {it.azioni.esci}
          </Button> </div> </div> </main> );
}

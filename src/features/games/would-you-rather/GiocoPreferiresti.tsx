"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Badge, Avatar, PlayingCard } from "@/components/ui";
import { PassaTelefono } from "@/components/games/PassaTelefono";
import { it } from "@/messages/it";
import { DOMANDE_PREFERIRESTI, type DomandaPreferiresti } from "@/features/content/preferiresti";
import { filtraContenuti, scegliCasuale } from "@/lib/game-engine/selection";
import { salvaSessione, eliminaSessione, type SessionePubblica } from "@/lib/local-storage/session";

type Fase = "intro" | "voto_privato" | "risultato" | "finito";

export default function GiocoPreferiresti({ sessione: iniziale }: { sessione: SessionePubblica }) {
  const router = useRouter();
  const config = iniziale.config;
  const giocatori = config.giocatori;

  const [fase, setFase] = useState<Fase>("intro");
  const [round, setRound] = useState(iniziale.round);
  const [domanda, setDomanda] = useState<DomandaPreferiresti | null>(null);
  const [voti, setVoti] = useState<{ A: number; B: number }>({ A: 0, B: 0 });
  const [votanteIndex, setVotanteIndex] = useState(0);
  const usedRef = useRef<Set<string>>(new Set(iniziale.usedContentIds));

  const possibili = useMemo(
    () => filtraContenuti(DOMANDE_PREFERIRESTI, {
        intensitaMax: config.intensita,
      }),
    [config],
  );

  const persist = useCallback(
    (patch: Partial<SessionePubblica>) => salvaSessione({ ...iniziale, round, usedContentIds: [...usedRef.current], punteggi: iniziale.punteggi, ...patch }),
    [iniziale, round],
  );

  function nuova() {
    const disp = possibili.filter((d) => !usedRef.current.has(d.id));
    const d = scegliCasuale(disp.length ? disp : possibili);
    if (!d) return;
    usedRef.current.add(d.id);
    setDomanda(d);
    setVoti({ A: 0, B: 0 });
    setVotanteIndex(0);
    setFase(config.votoPrivato ? "voto_privato" : "intro");
  }

  function votaGruppo(scelta: "A" | "B") {
    setVoti((v) => ({ ...v, [scelta]: giocatori.length }));
    setFase("risultato");
  }

  function votaPrivato(scelta: "A" | "B") {
    setVoti((v) => ({ ...v, [scelta]: v[scelta] + 1 }));
    if (votanteIndex + 1 < giocatori.length) setVotanteIndex((i) => i + 1);
    else setFase("risultato");
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
    setFase("intro");
  }

  const wrap = "mx-auto max-w-2xl px-5 py-10 min-h-dvh flex flex-col justify-center";

  if (fase === "intro" && !domanda) {
    return (
      <main className={wrap}> <div className="anim-entra text-center"> <Badge colore="viola">{it.comune.round} {round} / {config.round}</Badge>  <h1 className="font-titolo text-3xl font-extrabold">Preferiresti?</h1> <p className="mt-3 text-testo-morbido"> {config.votoPrivato ? "Ognuno vota in privato passando il telefono." : "Votate insieme la vostra scelta."}
          </p> {possibili.length === 0 ? (
            <p className="mt-6 text-corallo">{it.comune.nessunContenuto}</p> ) : (
            <Button className="mt-8" variant="primario" onClick={nuova}>{it.azioni.continua}</Button> )}
        </div> </main> );
  }

  if (fase === "intro" && domanda) {
    return (
      <main className={wrap}> <div className="anim-entra"> <p className="text-center font-titolo text-lg font-bold text-testo-morbido">Preferiresti…</p> <div className="mt-6 grid gap-4"> <button type="button" onClick={() => votaGruppo("A")} className="block w-full"> <PlayingCard variant="sky" interactive className="py-8 text-center"> <span className="font-titolo text-sm font-extrabold opacity-60">A</span> <p className="mt-2 font-titolo text-xl font-extrabold uppercase tracking-tight">{domanda.optionA}</p> </PlayingCard> </button> <p className="text-center font-titolo font-extrabold uppercase text-testo-morbido">oppure</p> <button type="button" onClick={() => votaGruppo("B")} className="block w-full"> <PlayingCard variant="bubblegum" interactive className="py-8 text-center"> <span className="font-titolo text-sm font-extrabold opacity-60">B</span> <p className="mt-2 font-titolo text-xl font-extrabold uppercase tracking-tight">{domanda.optionB}</p> </PlayingCard> </button> </div> <Button className="mt-6" variant="fantasma" fullWidth onClick={nuova}>{it.azioni.salta}</Button> </div> </main> );
  }

  if (fase === "voto_privato" && domanda) {
    const votante = giocatori[votanteIndex];
    return (
      <main className={wrap}> <p className="mb-6 text-center text-sm text-testo-morbido">Voto {votanteIndex + 1} di {giocatori.length}</p> <PassaTelefono key={votante.id} giocatore={votante} onDone={() => {}} etichettaFine={it.azioni.hoCapito}> <Card className="w-full"> <p className="text-center font-titolo font-bold text-testo-morbido">Preferiresti…</p> <div className="mt-3 grid gap-2"> <Button variant="secondario" onClick={() => votaPrivato("A")}>{domanda.optionA}</Button> <Button variant="pericolo" onClick={() => votaPrivato("B")}>{domanda.optionB}</Button> </div> </Card> </PassaTelefono> </main> );
  }

  if (fase === "risultato" && domanda) {
    const tot = voti.A + voti.B || 1;
    const pA = Math.round((voti.A / tot) * 100);
    const pB = 100 - pA;
    return (
      <main className={wrap}> <div className="anim-entra"> <div className="space-y-4"> <Barra nome={domanda.optionA} n={voti.A} perc={pA} vince={voti.A >= voti.B} barClass="bg-cielo" /> <Barra nome={domanda.optionB} n={voti.B} perc={pB} vince={voti.B > voti.A} barClass="bg-corallo" /> </div> <p className="mt-6 text-center text-testo-morbido"> {voti.A === voti.B ? "Parità! Il gruppo è diviso a metà." : "La maggioranza ha deciso!"}
          </p> <Button className="mt-8" variant="primario" fullWidth onClick={prossimo}> {round >= config.round ? "Risultati finali" : it.azioni.prossimoRound}
          </Button> </div> </main> );
  }

  return (
    <main className={wrap}> <div className="anim-entra text-center">  <h1 className="mt-4 font-titolo text-3xl font-extrabold">Partita finita!</h1> <p className="mt-3 text-testo-morbido">Grazie per aver giocato a Preferiresti?</p> <div className="mt-8 flex flex-col gap-3"> <Button variant="primario" onClick={() => { setRound(1); setDomanda(null); usedRef.current = new Set(); persist({ round: 1, usedContentIds: [] }); setFase("intro"); }}> {it.azioni.rigioca}
          </Button> <Button variant="morbido" onClick={() => { eliminaSessione(); router.push("/giochi"); }}>{it.azioni.esci}</Button> </div> </div> </main> );
}

function Barra({ nome, n, perc, vince, barClass }: { nome: string; n: number; perc: number; vince: boolean; barClass: string }) {
  return (
    <div> <div className="mb-1 flex items-center justify-between"> <span className="font-titolo font-bold">{nome}</span> <span className="text-sm text-testo-morbido">{n} · {perc}%</span> </div> <div className="h-4 overflow-hidden rounded-full on-light text-black bg-[var(--color-superficie-2)]"> <div className={`h-full rounded-full ${vince ? barClass : "bg-[var(--color-bordo)]"}`} style={{ width: `${perc}%` }} /> </div> </div> );
}

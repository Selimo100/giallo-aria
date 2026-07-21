"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Badge, Avatar } from "@/components/ui";
import { Timer } from "@/components/games/Timer";
import { it } from "@/messages/it";
import { SFIDE, type Sfida } from "@/features/content/sfide";
import { filtraContenuti, scegliCasuale, mescola } from "@/lib/game-engine/selection";
import { type Giocatore } from "@/types/domain";
import { salvaSessione, eliminaSessione, type SessionePubblica } from "@/lib/local-storage/session";

type Fase = "transizione" | "sfida" | "finito";


export default function GiocoSfide({ sessione: iniziale }: { sessione: SessionePubblica }) {
  const router = useRouter();
  const config = iniziale.config;

  const ordine = useMemo<Giocatore[]>(() => {
    if (iniziale.ordineIds?.length) {
      const byId = new Map(config.giocatori.map((g) => [g.id, g]));
      const r = iniziale.ordineIds.map((id) => byId.get(id)).filter(Boolean) as Giocatore[];
      if (r.length === config.giocatori.length) return r;
    }
    return config.ordine === "Casuale" ? mescola(config.giocatori) : config.giocatori;
  }, [config.giocatori, config.ordine, iniziale.ordineIds]);

  const [fase, setFase] = useState<Fase>("transizione");
  const [turnIndex, setTurnIndex] = useState(iniziale.turnIndex ?? 0);
  const [round, setRound] = useState(iniziale.round);
  const [sfida, setSfida] = useState<Sfida | null>(null);
  const [punteggi, setPunteggi] = useState<Record<string, number>>(iniziale.punteggi);
  const usedRef = useRef<Set<string>>(new Set(iniziale.usedContentIds));
  const attivo = ordine[turnIndex];

  const possibili = useMemo(() => {
    return filtraContenuti(SFIDE, {
      intensitaMax: config.intensita,
    });
  }, [config]);

  const persist = useCallback(
    (patch: Partial<SessionePubblica>) => salvaSessione({ ...iniziale, round, turnIndex, ordineIds: ordine.map((g) => g.id), usedContentIds: [...usedRef.current], punteggi, ...patch }),
    [iniziale, round, turnIndex, ordine, punteggi],
  );

  function pesca() {
    const disp = possibili.filter((s) => !usedRef.current.has(s.id));
    const s = scegliCasuale(disp.length ? disp : possibili);
    if (!s) return;
    usedRef.current.add(s.id);
    setSfida(s);
    setFase("sfida");
  }

  function risolvi(completata: boolean) {
    if (completata && config.punteggi && sfida) {
      setPunteggi((p) => ({ ...p, [attivo.id]: (p[attivo.id] ?? 0) + 1 }));
    }
    let nt = turnIndex + 1;
    let nr = round;
    if (nt >= ordine.length) { nt = 0; nr = round + 1; }
    if (nr > config.round) { persist({ round }); setFase("finito"); return; }
    setTurnIndex(nt);
    setRound(nr);
    setSfida(null);
    persist({ round: nr, turnIndex: nt });
    setFase("transizione");
  }

  const wrap = "mx-auto max-w-2xl px-5 py-10 min-h-dvh flex flex-col justify-center";

  if (fase === "transizione") {
    return (
      <main className={wrap}> <div className="anim-entra text-center" aria-live="polite"> <Badge colore="giallo">{it.comune.round} {round} / {config.round}</Badge> <div className="anim-galleggia my-6"><Avatar nome={attivo.nome} colore={attivo.colore} /></div> <h1 className="font-titolo text-2xl font-extrabold">{it.ov.turnoDi(attivo.nome)}</h1> <p className="mt-2 text-testo-morbido">Pronti per una nuova sfida?</p> {possibili.length === 0 ? (
            <p className="mt-6 text-corallo">{it.comune.nessunContenuto}</p> ) : (
            <Button className="mt-8" variant="primario" onClick={pesca}>Pesca una sfida</Button> )}
        </div> </main> );
  }

  if (fase === "sfida" && sfida) {
    return (
      <main className={wrap}> <div className="anim-entra"> <div className="mb-3 flex items-center justify-between"> <Badge colore="giallo">{sfida.tipoSfida}</Badge> <span className="text-sm text-testo-morbido">{attivo.nome}</span> </div> <Card className="border-giallo text-center"> <p className="font-titolo text-2xl font-bold leading-snug">{sfida.prompt}</p> </Card> {sfida.timerConsigliato ? (
            <div className="mt-6"><Timer key={sfida.id} durata={sfida.timerConsigliato} /></div> ) : null}
          <div className="mt-8 grid gap-3"> <Button variant="primario" onClick={() => risolvi(true)}> Sfida completata</Button> <Button variant="morbido" onClick={() => risolvi(false)}> {it.azioni.salta}</Button> </div> <p className="mt-4 text-center text-xs text-testo-morbido">{it.sicurezza.saltaSempre}</p> </div> </main> );
  }

  const classifica = [...ordine].sort((a, b) => (punteggi[b.id] ?? 0) - (punteggi[a.id] ?? 0));
  const vincitore = classifica[0];
  return (
    <main className={wrap}> <div className="anim-entra text-center">  <h1 className="mt-4 font-titolo text-3xl font-extrabold">Partita finita!</h1> {config.punteggi && vincitore && <p className="mt-3 text-lg">{it.comune.vincitore}: <strong>{vincitore.nome}</strong></p>}
        {config.punteggi && (
          <div className="mt-6 space-y-2 text-left"> {classifica.map((g) => (
              <div key={g.id} className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-bordo)] on-light text-black bg-[var(--color-superficie)] p-3"> <Avatar nome={g.nome} colore={g.colore} /> <span className="flex-1 font-semibold">{g.nome}</span> <span className="font-titolo text-lg font-bold">{punteggi[g.id] ?? 0}</span> </div> ))}
          </div> )}
        <div className="mt-8 flex flex-col gap-3"> <Button variant="primario" onClick={() => { setPunteggi(Object.fromEntries(ordine.map((g) => [g.id, 0]))); setRound(1); setTurnIndex(0); setSfida(null); usedRef.current = new Set(); persist({ round: 1, turnIndex: 0, usedContentIds: [], punteggi: Object.fromEntries(ordine.map((g) => [g.id, 0])) }); setFase("transizione"); }}> {it.azioni.rigioca}
          </Button> <Button variant="morbido" onClick={() => { eliminaSessione(); router.push("/giochi"); }}>{it.azioni.esci}</Button> </div> </div> </main> );
}

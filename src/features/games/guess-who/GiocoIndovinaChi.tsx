"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Badge, Avatar, PlayingCard } from "@/components/ui";
import { Timer } from "@/components/games/Timer";
import { it } from "@/messages/it";
import { IDENTITA } from "@/features/content/indovina-chi";
import { filtraContenuti, scegliCasuale, mescola } from "@/lib/game-engine/selection";
import { type ContenutoGioco, type Giocatore } from "@/types/domain";
import { salvaSessione, eliminaSessione, type SessionePubblica } from "@/lib/local-storage/session";

type Fase = "transizione" | "gioco" | "finito";

export default function GiocoIndovinaChi({ sessione: iniziale }: { sessione: SessionePubblica }) {
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
  const [identita, setIdentita] = useState<ContenutoGioco | null>(null);
  const [punteggi, setPunteggi] = useState<Record<string, number>>(iniziale.punteggi);
  const usedRef = useRef<Set<string>>(new Set(iniziale.usedContentIds));
  const attivo = ordine[turnIndex];

  const possibili = useMemo(() => {
    return filtraContenuti(IDENTITA, {
      intensitaMax: config.intensita,
      categorie: config.categorie,
    });
  }, [config]);

  const persist = useCallback(
    (patch: Partial<SessionePubblica>) => salvaSessione({ ...iniziale, round, turnIndex, ordineIds: ordine.map((g) => g.id), usedContentIds: [...usedRef.current], punteggi, ...patch }),
    [iniziale, round, turnIndex, ordine, punteggi],
  );

  function pesca() {
    const disp = possibili.filter((i) => !usedRef.current.has(i.id));
    const i = scegliCasuale(disp.length ? disp : possibili);
    if (!i) return;
    usedRef.current.add(i.id);
    setIdentita(i);
    setFase("gioco");
  }

  function risolvi(indovinato: boolean) {
    if (indovinato && config.punteggi) {
      setPunteggi((p) => ({ ...p, [attivo.id]: (p[attivo.id] ?? 0) + 1 }));
    }
    let nt = turnIndex + 1;
    let nr = round;
    if (nt >= ordine.length) { nt = 0; nr = round + 1; }
    if (nr > config.round) { persist({ round }); setFase("finito"); return; }
    setTurnIndex(nt);
    setRound(nr);
    setIdentita(null);
    persist({ round: nr, turnIndex: nt });
    setFase("transizione");
  }

  const wrap = "mx-auto max-w-2xl px-5 py-10 min-h-dvh flex flex-col justify-center";

  if (fase === "transizione") {
    return (
      <main className={wrap}> <div className="anim-entra text-center" aria-live="polite"> <Badge colore="corallo">{it.comune.round} {round} / {config.round}</Badge> <div className="anim-galleggia my-6"><Avatar nome={attivo.nome} colore={attivo.colore} /></div> <h1 className="font-titolo text-2xl font-extrabold">{it.ov.turnoDi(attivo.nome)}</h1> <p className="mt-3 text-testo-morbido"> {attivo.nome}, tieni il telefono sulla fronte rivolto verso il gruppo,
            <strong> senza guardare lo schermo</strong>. Fai domande sì/no: il gruppo risponde!
          </p> {possibili.length === 0 ? (
            <p className="mt-6 text-corallo">{it.comune.nessunContenuto}</p> ) : (
            <Button className="mt-8" variant="primario" onClick={pesca}>Sono pronto/a</Button> )}
        </div> </main> );
  }

  if (fase === "gioco" && identita) {
    return (
      <main className={wrap}> <div className="anim-entra text-center"> <p className="text-sm text-testo-morbido">Solo il gruppo può vedere — {attivo.nome} non guarda!</p> <PlayingCard variant="lavender" className="mt-4 py-8 text-center"> <p className="font-titolo text-sm font-extrabold uppercase tracking-wide opacity-60">{identita.categoria}</p> <p className="mt-2 font-titolo text-[clamp(2rem,9vw,3rem)] font-extrabold uppercase leading-[0.95]">{identita.prompt}</p> </PlayingCard> <div className="mt-6"><Timer key={identita.id} durata={60} /></div> <div className="mt-8 grid gap-3"> <Button variant="primario" onClick={() => risolvi(true)}> Indovinato!</Button> <Button variant="morbido" onClick={() => risolvi(false)}> Passa / tempo scaduto</Button> </div> </div> </main> );
  }

  const classifica = [...ordine].sort((a, b) => (punteggi[b.id] ?? 0) - (punteggi[a.id] ?? 0));
  const vincitore = classifica[0];
  return (
    <main className={wrap}> <div className="anim-entra text-center">  <h1 className="mt-4 font-titolo text-3xl font-extrabold">Partita finita!</h1> {config.punteggi && vincitore && <p className="mt-3 text-lg">{it.comune.vincitore}: <strong>{vincitore.nome}</strong></p>}
        {config.punteggi && (
          <div className="mt-6 space-y-2 text-left"> {classifica.map((g) => (
              <div key={g.id} className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-bordo)] on-light text-black bg-[var(--color-superficie)] p-3"> <Avatar nome={g.nome} colore={g.colore} /> <span className="flex-1 font-semibold">{g.nome}</span> <span className="font-titolo text-lg font-bold">{punteggi[g.id] ?? 0}</span> </div> ))}
          </div> )}
        <div className="mt-8 flex flex-col gap-3"> <Button variant="primario" onClick={() => { setPunteggi(Object.fromEntries(ordine.map((g) => [g.id, 0]))); setRound(1); setTurnIndex(0); setIdentita(null); usedRef.current = new Set(); persist({ round: 1, turnIndex: 0, usedContentIds: [], punteggi: Object.fromEntries(ordine.map((g) => [g.id, 0])) }); setFase("transizione"); }}> {it.azioni.rigioca}
          </Button> <Button variant="morbido" onClick={() => { eliminaSessione(); router.push("/giochi"); }}>{it.azioni.esci}</Button> </div> </div> </main> );
}

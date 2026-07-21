"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Badge, Avatar } from "@/components/ui";
import { PassaTelefono } from "@/components/games/PassaTelefono";
import { Timer } from "@/components/games/Timer";
import { it } from "@/messages/it";
import { CARTE_PROIBITE, type CartaProibita } from "@/features/content/parola-proibita";
import { filtraContenuti, scegliCasuale, mescola } from "@/lib/game-engine/selection";
import { type Giocatore } from "@/types/domain";
import { salvaSessione, eliminaSessione, type SessionePubblica } from "@/lib/local-storage/session";

type Fase = "transizione" | "descrivi" | "finito";

export default function GiocoParolaProibita({ sessione: iniziale }: { sessione: SessionePubblica }) {
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
  const [carta, setCarta] = useState<CartaProibita | null>(null);
  const [punteggi, setPunteggi] = useState<Record<string, number>>(iniziale.punteggi);
  const usedRef = useRef<Set<string>>(new Set(iniziale.usedContentIds));
  const descrittore = ordine[turnIndex];

  const possibili = useMemo(() => {
    return filtraContenuti(CARTE_PROIBITE, {
      intensitaMax: config.intensita,
      categorie: config.categorie,
    });
  }, [config]);

  const persist = useCallback(
    (patch: Partial<SessionePubblica>) => salvaSessione({ ...iniziale, round, turnIndex, ordineIds: ordine.map((g) => g.id), usedContentIds: [...usedRef.current], punteggi, ...patch }),
    [iniziale, round, turnIndex, ordine, punteggi],
  );

  // Draw a card at the start of each turn (secret, only shown during reveal).
  function pesca() {
    const disp = possibili.filter((c) => !usedRef.current.has(c.id));
    const c = scegliCasuale(disp.length ? disp : possibili) as CartaProibita | undefined;
    if (!c) return null;
    usedRef.current.add(c.id);
    setCarta(c);
    return c;
  }

  function risolvi(indovinata: boolean) {
    if (indovinata && config.punteggi) {
      setPunteggi((p) => ({ ...p, [descrittore.id]: (p[descrittore.id] ?? 0) + 1 }));
    }
    let nt = turnIndex + 1;
    let nr = round;
    if (nt >= ordine.length) { nt = 0; nr = round + 1; }
    setCarta(null);
    if (nr > config.round) { persist({ round }); setFase("finito"); return; }
    setTurnIndex(nt);
    setRound(nr);
    persist({ round: nr, turnIndex: nt });
    setFase("transizione");
  }

  const wrap = "mx-auto max-w-2xl px-5 py-10 min-h-dvh flex flex-col justify-center";

  if (fase === "transizione") {
    // Card is drawn lazily when the describer reveals, so nothing leaks earlier.
    if (!carta) {
      return (
        <main className={wrap}> <div className="anim-entra text-center" aria-live="polite"> <Badge colore="viola">{it.comune.round} {round} / {config.round}</Badge> <div className="anim-galleggia my-6"><Avatar nome={descrittore.nome} colore={descrittore.colore} /></div> <h1 className="font-titolo text-2xl font-extrabold">{it.ov.turnoDi(descrittore.nome)}</h1> <p className="mt-3 text-testo-morbido"> {descrittore.nome} descriverà la parola senza dire quelle proibite. Passagli il telefono!
            </p> {possibili.length === 0 ? (
              <p className="mt-6 text-corallo">{it.comune.nessunContenuto}</p> ) : (
              <Button className="mt-8" variant="primario" onClick={() => pesca()}>{it.reveal.toccaQuandoPronto}</Button> )}
          </div> </main> );
    }
    return (
      <main className={wrap}> <PassaTelefono
          key={descrittore.id}
          giocatore={descrittore}
          onDone={() => setFase("descrivi")}
          etichettaFine="Ho memorizzato la carta"
        > <Card className="w-full border-viola"> <p className="text-sm text-testo-morbido">Parola da far indovinare</p> <p className="mt-1 font-titolo text-3xl font-extrabold">{carta.prompt}</p> <p className="mt-4 text-sm font-semibold text-corallo">Parole proibite </p> <ul className="mt-1 flex flex-wrap gap-2"> {carta.forbiddenWords.map((w) => (
                <li key={w} className="rounded-full bg-corallo/15 px-3 py-1 text-sm text-corallo">{w}</li> ))}
            </ul> </Card> </PassaTelefono> </main> );
  }

  if (fase === "descrivi" && carta) {
    return (
      <main className={wrap}> <div className="anim-entra text-center"> <p className="text-testo-morbido">{descrittore.nome} descrive, gli altri indovinano!</p> <Card className="mt-4 on-light text-black bg-[var(--color-superficie-2)]"> <p className="font-titolo text-xl font-bold"> Carta nascosta</p> <p className="mt-1 text-sm text-testo-morbido">Niente parole proibite. Il gruppo prova a indovinare.</p> </Card> <div className="mt-6"><Timer key={carta.id} durata={60} /></div> <div className="mt-8 grid gap-3"> <Button variant="primario" onClick={() => risolvi(true)}> Indovinata!</Button> <Button variant="morbido" onClick={() => risolvi(false)}> Salta / tempo scaduto</Button> </div> </div> </main> );
  }

  const classifica = [...ordine].sort((a, b) => (punteggi[b.id] ?? 0) - (punteggi[a.id] ?? 0));
  const vincitore = classifica[0];
  return (
    <main className={wrap}> <div className="anim-entra text-center">  <h1 className="mt-4 font-titolo text-3xl font-extrabold">Partita finita!</h1> {config.punteggi && vincitore && <p className="mt-3 text-lg">{it.comune.vincitore}: <strong>{vincitore.nome}</strong></p>}
        {config.punteggi && (
          <div className="mt-6 space-y-2 text-left"> {classifica.map((g) => (
              <div key={g.id} className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-bordo)] on-light text-black bg-[var(--color-superficie)] p-3"> <Avatar nome={g.nome} colore={g.colore} /> <span className="flex-1 font-semibold">{g.nome}</span> <span className="font-titolo text-lg font-bold">{punteggi[g.id] ?? 0}</span> </div> ))}
          </div> )}
        <div className="mt-8 flex flex-col gap-3"> <Button variant="primario" onClick={() => { setPunteggi(Object.fromEntries(ordine.map((g) => [g.id, 0]))); setRound(1); setTurnIndex(0); setCarta(null); usedRef.current = new Set(); persist({ round: 1, turnIndex: 0, usedContentIds: [], punteggi: Object.fromEntries(ordine.map((g) => [g.id, 0])) }); setFase("transizione"); }}> {it.azioni.rigioca}
          </Button> <Button variant="morbido" onClick={() => { eliminaSessione(); router.push("/giochi"); }}>{it.azioni.esci}</Button> </div> </div> </main> );
}

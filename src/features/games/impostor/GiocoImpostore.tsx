"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Badge, Avatar, PlayingCard } from "@/components/ui";
import { PassaTelefono } from "@/components/games/PassaTelefono";
import { it } from "@/messages/it";
import { IMPOSTOR_WORDS } from "@/features/content/impostore";
import { useContenutiPersonali } from "@/features/content/useContenutiPersonali";
import { personaliImpostore } from "@/lib/local-storage/custom-content";
import {
  filtraContenuti,
  combinaFonti,
  scegliImpostori,
  scegliCasuale as pick,
} from "@/lib/game-engine/selection";
import {
  salvaSessione,
  eliminaSessione,
  type SessionePubblica,
} from "@/lib/local-storage/session";
import type { ImpostorWord } from "@/types/domain";

type Fase =
  | "round_intro"
  | "reveal"
  | "discussione"
  | "voto"
  | "risultato"
  | "scoreboard"
  | "finito";

/** Secret state for the CURRENT round — kept in memory only, never persisted. */
interface StatoRound {
  parola: ImpostorWord;
  impostori: number[]; // indices into giocatori
  starter: number;
}

export default function GiocoImpostore({
  sessione: iniziale,
}: {
  sessione: SessionePubblica;
}) {
  const router = useRouter();
  const config = iniziale.config;
  const giocatori = config.giocatori;

  const [fase, setFase] = useState<Fase>("round_intro");
  const [round, setRound] = useState(iniziale.round);
  const [rivelaIndex, setRivelaIndex] = useState(0);
  const [punteggi, setPunteggi] = useState<Record<string, number>>(iniziale.punteggi);
  const usedRef = useRef<Set<string>>(new Set(iniziale.usedContentIds));
  const [statoRound, setStatoRound] = useState<StatoRound | null>(null);
  const [sospettato, setSospettato] = useState<number | null>(null);

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

  const personali = useContenutiPersonali();
  const parolePossibili = useMemo(() => {
    const tutte = combinaFonti(
      IMPOSTOR_WORDS,
      personaliImpostore(personali, true),
      config.contentSource ?? "official_only",
    );
    return filtraContenuti(tutte, {
      intensitaMax: config.intensita,
      categorie: config.categorie,
    });
  }, [config, personali]);

  function distribuisci() {
    const disponibili = parolePossibili.filter((w) => !usedRef.current.has(w.id));
    const pool = disponibili.length > 0 ? disponibili : parolePossibili;
    const parola = pick(pool);
    if (!parola) return;
    usedRef.current.add(parola.id);
    const impostori = scegliImpostori(giocatori.length, config.numImpostori ?? 1);
    const starter = Math.floor(Math.random() * giocatori.length);
    setStatoRound({ parola, impostori, starter });
    setRivelaIndex(0);
    setSospettato(null);
    setFase("reveal");
  }

  function prossimaRivelazione() {
    if (rivelaIndex + 1 < giocatori.length) {
      setRivelaIndex((i) => i + 1);
    } else {
      setFase(config.timerDiscussione ? "discussione" : "voto");
    }
  }

  function assegnaPunti(indovinato: boolean, guessCorretto: boolean) {
    if (!config.punteggi || !statoRound) return;
    setPunteggi((p) => {
      const next = { ...p };
      if (indovinato) {
        // civilians win the round
        giocatori.forEach((g, i) => {
          if (!statoRound.impostori.includes(i)) next[g.id] = (next[g.id] ?? 0) + 1;
        });
      } else {
        // impostor escaped
        statoRound.impostori.forEach((i) => {
          next[giocatori[i].id] = (next[giocatori[i].id] ?? 0) + 2;
        });
      }
      if (guessCorretto) {
        statoRound.impostori.forEach((i) => {
          next[giocatori[i].id] = (next[giocatori[i].id] ?? 0) + 1;
        });
      }
      return next;
    });
  }

  const [guessCorretto, setGuessCorretto] = useState<boolean | null>(null);

  function confermaVoto() {
    if (sospettato === null || !statoRound) return;
    const indovinato = statoRound.impostori.includes(sospettato);
    assegnaPunti(indovinato, false);
    setFase("risultato");
  }

  function prossimoRound() {
    const nuovo = round + 1;
    if (nuovo > config.round) {
      persist({ round });
      setFase("finito");
      return;
    }
    setRound(nuovo);
    setStatoRound(null);
    setGuessCorretto(null);
    persist({ round: nuovo });
    setFase("round_intro");
  }

  // ---- RENDER ----
  const wrap = "mx-auto max-w-2xl px-5 py-10 min-h-dvh flex flex-col justify-center";

  if (fase === "round_intro") {
    return (
      <main className={wrap}> <div className="anim-entra text-center"> <Badge colore="giallo">{it.comune.round} {round} / {config.round}</Badge>  <h1 className="font-titolo text-3xl font-extrabold">Pronti a smascherare?</h1> <p className="mt-3 text-testo-morbido"> Ogni giocatore guarderà la propria carta in privato. Non mostrarla a
            nessuno e nascondila prima di passare il telefono.
          </p> {parolePossibili.length === 0 ? (
            <p className="mt-6 text-corallo">{it.comune.nessunContenuto}</p> ) : (
            <Button className="mt-8" variant="primario" onClick={distribuisci}> Distribuisci le carte
            </Button> )}
        </div> </main> );
  }

  if (fase === "reveal" && statoRound) {
    const g = giocatori[rivelaIndex];
    const isImpostore = statoRound.impostori.includes(rivelaIndex);
    return (
      <main className={wrap}> <p className="mb-6 text-center text-sm text-testo-morbido"> Carta {rivelaIndex + 1} di {giocatori.length}
        </p> <PassaTelefono
          key={g.id}
          giocatore={g}
          onDone={prossimaRivelazione}
          etichettaFine={it.azioni.nascondi}
        > {isImpostore ? (
            <PlayingCard variant="red-outline" className="w-full text-center">
              <p className="font-titolo text-sm font-extrabold uppercase tracking-wide text-signal-red">La tua identità</p>
              <p className="mt-3 font-titolo text-[clamp(2rem,10vw,3rem)] font-extrabold uppercase leading-[0.95]">Sei<br />l&apos;impostore</p>
              <p className="mt-4 text-sm font-medium text-testo-morbido">Non conosci la parola segreta. Ascolta gli indizi e mimetizzati!</p>
            </PlayingCard> ) : (
            <PlayingCard variant="lemon" className="w-full text-center">
              <p className="font-titolo text-sm font-extrabold uppercase tracking-wide opacity-70">La parola segreta</p>
              <p className="mt-3 font-titolo text-[clamp(2.25rem,11vw,3.25rem)] font-extrabold uppercase leading-[0.95]">{statoRound.parola.prompt}</p>
              <p className="mt-4 text-sm font-medium opacity-70">Categoria: {statoRound.parola.categoria}</p>
            </PlayingCard> )}
        </PassaTelefono> </main> );
  }

  if (fase === "discussione" && statoRound) {
    return (
      <main className={wrap}> <div className="anim-entra text-center"> <h1 className="font-titolo text-2xl font-extrabold">Mettete il telefono al centro</h1> <p className="mt-3 text-testo-morbido"> Inizia <strong>{giocatori[statoRound.starter].nome}</strong>. A turno date un
            indizio sulla parola, senza essere troppo ovvi.
          </p> <Timer secondi={config.timerDiscussione ?? 0} /> <Button className="mt-6" variant="primario" onClick={() => setFase("voto")}> Vai al voto
          </Button> </div> </main> );
  }

  if (fase === "voto" && statoRound) {
    return (
      <main className={wrap}> <div className="anim-entra"> <h1 className="text-center font-titolo text-2xl font-extrabold">Chi è l&apos;impostore?</h1> <p className="mt-2 text-center text-testo-morbido"> Decidete insieme e selezionate il sospettato.
          </p> <div className="mt-6 grid gap-2"> {giocatori.map((g, i) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setSospettato(i)}
                className={`flex items-center gap-3 rounded-[var(--radius-card)] border p-3 text-left transition ${
                  sospettato === i
                    ? "border-giallo ring-2 ring-giallo bg-giallo/10"
                    : "border-[var(--color-bordo)] on-light text-black bg-[var(--color-superficie)]"
                }`}
              > <Avatar nome={g.nome} colore={g.colore} /> <span className="font-semibold">{g.nome}</span> </button> ))}
          </div> <Button className="mt-6" variant="primario" fullWidth disabled={sospettato === null} onClick={confermaVoto}> Conferma il voto
          </Button> </div> </main> );
  }

  if (fase === "risultato" && statoRound) {
    const indovinato = sospettato !== null && statoRound.impostori.includes(sospettato);
    const nomiImpostori = statoRound.impostori.map((i) => giocatori[i].nome).join(", ");
    return (
      <main className={wrap}> <div className="anim-entra text-center">  <h1 className="mt-4 font-titolo text-3xl font-extrabold"> {indovinato ? "Impostore smascherato!" : "L'impostore è scappato!"}
          </h1> <p className="mt-3 text-testo-morbido"> L&apos;impostore era: <strong>{nomiImpostori}</strong> </p> <Card className="mt-4"> La parola segreta era <strong>{statoRound.parola.prompt}</strong> </Card> {config.indovinelloFinale && guessCorretto === null && (
            <div className="mt-6"> <p className="text-testo-morbido"> Ultima possibilità per l&apos;impostore: ha indovinato la parola?
              </p> <div className="mt-3 flex justify-center gap-3"> <Button
                  variant="secondario"
                  onClick={() => {
                    setGuessCorretto(true);
                    assegnaPunti(indovinato, true);
                  }}
                > Sì, indovinata
                </Button> <Button
                  variant="morbido"
                  onClick={() => setGuessCorretto(false)}
                > No
                </Button> </div> </div> )}

          <Button className="mt-8" variant="primario" onClick={() => setFase("scoreboard")}> {it.comune.punteggi}
          </Button> </div> </main> );
  }

  if (fase === "scoreboard") {
    const classifica = [...giocatori].sort(
      (a, b) => (punteggi[b.id] ?? 0) - (punteggi[a.id] ?? 0),
    );
    return (
      <main className={wrap}> <h1 className="text-center font-titolo text-2xl font-extrabold">{it.comune.punteggi}</h1> <div className="mt-6 space-y-2"> {classifica.map((g, i) => (
            <div
              key={g.id}
              className="flex items-center gap-3 rounded-[var(--radius-card)] on-light text-black bg-[var(--color-superficie)] border border-[var(--color-bordo)] p-3"
            > <span className="w-6 font-titolo font-bold text-testo-morbido">{i + 1}</span> <Avatar nome={g.nome} colore={g.colore} /> <span className="flex-1 font-semibold">{g.nome}</span> <span className="font-titolo text-lg font-bold">{punteggi[g.id] ?? 0}</span> </div> ))}
        </div> <Button className="mt-8" variant="primario" fullWidth onClick={prossimoRound}> {round >= config.round ? "Vedi i risultati finali" : it.azioni.prossimoRound}
        </Button> </main> );
  }

  // finito
  const vincitore = [...giocatori].sort((a, b) => (punteggi[b.id] ?? 0) - (punteggi[a.id] ?? 0))[0];
  return (
    <main className={wrap}> <div className="anim-entra text-center">  <h1 className="mt-4 font-titolo text-3xl font-extrabold">Partita finita!</h1> {config.punteggi && vincitore && (
          <p className="mt-3 text-lg"> {it.comune.vincitore}: <strong>{vincitore.nome}</strong> con{" "}
            {punteggi[vincitore.id] ?? 0} punti
          </p> )}
        <div className="mt-8 flex flex-col gap-3"> <Button
            variant="primario"
            onClick={() => {
              setPunteggi(Object.fromEntries(giocatori.map((g) => [g.id, 0])));
              usedRef.current = new Set();
              setRound(1);
              setStatoRound(null);
              setGuessCorretto(null);
              persist({ round: 1, usedContentIds: [], punteggi: Object.fromEntries(giocatori.map((g) => [g.id, 0])) });
              setFase("round_intro");
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

function Timer({ secondi }: { secondi: number }) {
  const [rimasti, setRimasti] = useState(secondi);
  const [attivo, setAttivo] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  function toggle() {
    if (attivo) {
      if (ref.current) clearInterval(ref.current);
      setAttivo(false);
    } else {
      setAttivo(true);
      ref.current = setInterval(() => {
        setRimasti((r) => {
          if (r <= 1) {
            if (ref.current) clearInterval(ref.current);
            setAttivo(false);
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    }
  }

  if (!secondi) return null;
  const min = Math.floor(rimasti / 60);
  const sec = (rimasti % 60).toString().padStart(2, "0");
  return (
    <div className="mt-6"> <p className="font-titolo text-4xl font-extrabold tabular-nums">{min}:{sec}</p> <Button className="mt-3" variant="morbido" onClick={toggle}> {attivo ? "Pausa" : rimasti === 0 ? "Tempo scaduto" : "Avvia timer"}
      </Button> </div> );
}

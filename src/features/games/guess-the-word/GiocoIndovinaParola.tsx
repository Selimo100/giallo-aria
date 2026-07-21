"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Badge, Avatar, PlayingCard } from "@/components/ui";
import { it } from "@/messages/it";
import { PAROLE_INDOVINA } from "@/features/content/indovina-la-parola";
import { useContenutiPersonali } from "@/features/content/useContenutiPersonali";
import { personaliIndovinaParola } from "@/lib/local-storage/custom-content";
import { mescola } from "@/lib/game-engine/selection";
import {
  costruisciPool,
  scegliParola,
  avviaTimer,
  rimanenteMs,
  pausaTimer,
  riprendiTimer,
  inPausa,
  tempoImpiegatoMs,
  puntiGTW,
  prossimoTurno,
  type StatoTimer,
} from "@/lib/game-engine/indovina-parola";
import type {
  EsitoGTW,
  Giocatore,
  ParolaIndovina,
  RisultatoGTW,
} from "@/types/domain";
import {
  salvaSessione,
  eliminaSessione,
  type SessionePubblica,
} from "@/lib/local-storage/session";

// Explicit state machine — no scattered booleans. Invalid transitions are
// impossible because each phase only renders its own controls.
type Fase =
  | "player_transition"
  | "word_reveal"
  | "countdown"
  | "timer_running"
  | "turn_result"
  | "finished";

function formatMs(ms: number): string {
  const totSec = Math.ceil(ms / 1000);
  const m = Math.floor(totSec / 60);
  const s = (totSec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function GiocoIndovinaParola({
  sessione: iniziale,
}: {
  sessione: SessionePubblica;
}) {
  const router = useRouter();
  const config = iniziale.config;
  const durataMs = Math.max(5, config.timerDurata ?? 60) * 1000;

  // Player order resolved once and persisted (restore keeps the same order).
  const ordine = useMemo<Giocatore[]>(() => {
    if (iniziale.ordineIds?.length) {
      const byId = new Map(config.giocatori.map((g) => [g.id, g]));
      const restored = iniziale.ordineIds
        .map((id) => byId.get(id))
        .filter(Boolean) as Giocatore[];
      if (restored.length === config.giocatori.length) return restored;
    }
    return config.giocatori;
  }, [config.giocatori, iniziale.ordineIds]);

  const [fase, setFase] = useState<Fase>("player_transition");
  const [turnIndex, setTurnIndex] = useState(iniziale.turnIndex ?? 0);
  const [round, setRound] = useState(iniziale.round);
  const [punteggi, setPunteggi] = useState<Record<string, number>>(iniziale.punteggi);
  const [risultati, setRisultati] = useState<RisultatoGTW[]>(iniziale.risultatiGTW ?? []);
  const usedRef = useRef<Set<string>>(new Set(iniziale.usedContentIds));
  const saltatiRef = useRef<Set<string>>(new Set(iniziale.saltatiGTW ?? []));

  // Current-turn secret state — NEVER persisted; re-derived on reveal.
  const [parola, setParola] = useState<ParolaIndovina | null>(null);
  const [timer, setTimer] = useState<StatoTimer | null>(null);
  const [ultimoRisultato, setUltimoRisultato] = useState<RisultatoGTW | null>(null);
  const [conto, setConto] = useState(3);
  const [now, setNow] = useState(() => Date.now());

  const attivo = ordine[turnIndex];

  // Personal words honour the source mode; personal_only never falls back.
  const personali = useContenutiPersonali();
  const pool = useMemo(
    () =>
      costruisciPool(
        PAROLE_INDOVINA,
        personaliIndovinaParola(personali, true),
        config.contentSource ?? "official_only",
        { categorie: config.categorie },
      ),
    [personali, config.contentSource, config.categorie],
  );

  const saltiUsati = useMemo(
    () => risultati.filter((r) => r.giocatoreId === attivo?.id && r.esito === "saltata").length,
    [risultati, attivo?.id],
  );
  const saltoConsentito =
    config.consentiSalto !== false &&
    (!config.maxSalti || config.maxSalti <= 0 || saltiUsati < config.maxSalti);

  const persist = useCallback(
    (patch: Partial<SessionePubblica>) => {
      salvaSessione({
        ...iniziale,
        round,
        turnIndex,
        ordineIds: ordine.map((g) => g.id),
        usedContentIds: [...usedRef.current],
        saltatiGTW: [...saltatiRef.current],
        punteggi,
        risultatiGTW: risultati,
        aggiornata: Date.now(),
        ...patch,
      });
    },
    [iniziale, round, turnIndex, ordine, punteggi, risultati],
  );

  // Tick only while the timer is actually running (not paused) — remaining is
  // always derived from timestamps so ticks can be coarse without drift.
  useEffect(() => {
    if (fase !== "timer_running" || !timer || inPausa(timer)) return;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [fase, timer]);

  const rimasti = timer ? rimanenteMs(timer, now) : durataMs;

  // Expiry: handled in an effect so it fires once when the clock hits zero.
  useEffect(() => {
    if (fase === "timer_running" && timer && !inPausa(timer) && rimasti <= 0) {
      concludiTurno("scaduta");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rimasti, fase]);

  // Optional 3-2-1-VIA countdown before the timer starts.
  useEffect(() => {
    if (fase !== "countdown") return;
    setConto(3);
    let n = 3;
    const id = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        clearInterval(id);
        avviaGiro();
      } else {
        setConto(n);
      }
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase]);

  function pescaParola() {
    const p = scegliParola(pool, usedRef.current);
    if (p) usedRef.current.add(p.id);
    setParola(p ?? null);
  }

  function iniziaTurno() {
    pescaParola();
    setFase("word_reveal");
  }

  function premiAvvia() {
    if (config.conteggioIniziale) {
      setFase("countdown");
    } else {
      avviaGiro();
    }
  }

  function avviaGiro() {
    const t = avviaTimer(durataMs, Date.now());
    setTimer(t);
    setNow(Date.now());
    setFase("timer_running");
  }

  function togglePausa() {
    if (!timer) return;
    setTimer(inPausa(timer) ? riprendiTimer(timer, Date.now()) : pausaTimer(timer, Date.now()));
    setNow(Date.now());
  }

  const concludiTurno = useCallback(
    (esito: EsitoGTW) => {
      if (fase !== "timer_running" || !parola || !timer) return;
      const impiegato = tempoImpiegatoMs(timer, Date.now());
      const rimasto = Math.max(0, durataMs - impiegato);
      const punti = puntiGTW(esito, rimasto, durataMs, config.punteggioATempo);

      const ris: RisultatoGTW = {
        giocatoreId: attivo.id,
        parolaId: parola.id,
        parola: parola.prompt,
        categoria: parola.categoria,
        esito,
        tempoImpiegatoMs: impiegato,
        tempoRimastoMs: rimasto,
        punti,
      };
      if (esito === "saltata") saltatiRef.current.add(parola.id);

      const nuoviRisultati = [...risultati, ris];
      const nuoviPunteggi = config.punteggi
        ? { ...punteggi, [attivo.id]: (punteggi[attivo.id] ?? 0) + punti }
        : punteggi;

      setRisultati(nuoviRisultati);
      setPunteggi(nuoviPunteggi);
      setUltimoRisultato(ris);
      setTimer(null);
      setFase("turn_result");

      salvaSessione({
        ...iniziale,
        round,
        turnIndex,
        ordineIds: ordine.map((g) => g.id),
        usedContentIds: [...usedRef.current],
        saltatiGTW: [...saltatiRef.current],
        punteggi: nuoviPunteggi,
        risultatiGTW: nuoviRisultati,
        aggiornata: Date.now(),
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fase, parola, timer, attivo, risultati, punteggi, round, turnIndex, ordine, config, durataMs, iniziale],
  );

  function vaiAlProssimo() {
    setParola(null);
    setUltimoRisultato(null);
    const avanti = prossimoTurno(turnIndex, round, ordine.length, config);
    if (avanti.finita) {
      persist({ round });
      setFase("finished");
      return;
    }
    setTurnIndex(avanti.turnIndex);
    setRound(avanti.round);
    persist({ round: avanti.round, turnIndex: avanti.turnIndex });
    setFase("player_transition");
  }

  function ricomincia() {
    usedRef.current = new Set();
    saltatiRef.current = new Set();
    const azzerati = Object.fromEntries(ordine.map((g) => [g.id, 0]));
    setPunteggi(azzerati);
    setRisultati([]);
    setRound(1);
    setTurnIndex(0);
    setParola(null);
    setUltimoRisultato(null);
    persist({ round: 1, turnIndex: 0, usedContentIds: [], saltatiGTW: [], punteggi: azzerati, risultatiGTW: [] });
    setFase("player_transition");
  }

  const wrap = "mx-auto max-w-2xl px-5 py-10 min-h-dvh flex flex-col justify-center";

  // ---------- player_transition + ready ----------
  if (fase === "player_transition") {
    return (
      <main className={wrap}>
        <div className="anim-entra flex flex-col items-center text-center" aria-live="polite">
          <Badge colore="cielo">
            {config.senzaFine
              ? "Senza fine"
              : `${it.comune.round} ${round} / ${Math.max(1, config.turniPerGiocatore ?? 1)}`}
          </Badge>
          <div className="anim-galleggia my-6">
            <Avatar nome={attivo.nome} colore={attivo.colore} />
          </div>
          <h1 className="font-titolo text-2xl font-extrabold">{it.gtw.passaA(attivo.nome)}</h1>
          <p className="mt-2 text-testo-morbido">{it.gtw.deveIndovinare(attivo.nome)}</p>
          <p className="mt-4 font-titolo text-lg font-extrabold uppercase tracking-tight text-lemon-card">
            {it.gtw.nonGuardare}
          </p>
          <p className="mt-1 text-sm text-testo-morbido">{it.gtw.tieniRivolto}</p>
          <Button className="mt-8" variant="primario" onClick={iniziaTurno}>
            {it.gtw.sonoPronta}
          </Button>
        </div>
      </main>
    );
  }

  // ---------- word_reveal (describing players see the word) ----------
  if (fase === "word_reveal") {
    return (
      <main className={wrap}>
        <div className="anim-entra text-center">
          <p className="font-titolo text-sm font-bold uppercase tracking-wide text-testo-morbido">
            {it.gtw.indovina(attivo.nome)} · {it.gtw.mostraAgliAltri}
          </p>
          <div className="mx-auto mt-4 max-w-md">
            {parola ? (
              <PlayingCard variant="lemon" rotate={4} className="py-10">
                <p className="font-titolo text-xs font-extrabold uppercase tracking-[0.2em] text-black/60">
                  {it.gtw.laParolaE}
                </p>
                <p className="mt-3 font-titolo text-4xl font-extrabold uppercase leading-none tracking-tight text-black break-words">
                  {parola.prompt}
                </p>
                {parola.categoria && (
                  <p className="mt-4 font-titolo text-xs font-bold uppercase tracking-wide text-black/60">
                    {parola.categoria}
                  </p>
                )}
                {parola.suggerimento && (
                  <p className="mt-2 text-sm text-black/70">{parola.suggerimento}</p>
                )}
              </PlayingCard>
            ) : (
              <Card className="text-center text-testo-morbido">{it.gtw.nessunaParola}</Card>
            )}
          </div>
          <p className="mt-6 text-sm text-testo-morbido">{it.gtw.regole}</p>
          {parola && (
            <Button className="mt-8" variant="secondario" onClick={premiAvvia}>
              {it.gtw.avvia}
            </Button>
          )}
        </div>
      </main>
    );
  }

  // ---------- countdown ----------
  if (fase === "countdown") {
    return (
      <main className={wrap}>
        <div className="anim-entra flex flex-col items-center text-center" aria-live="assertive">
          <div className="font-titolo text-[8rem] font-extrabold leading-none tabular-nums">
            {conto}
          </div>
        </div>
      </main>
    );
  }

  // ---------- timer_running ----------
  if (fase === "timer_running") {
    const pausa = timer ? inPausa(timer) : false;
    return (
      <main className={wrap}>
        <div className="anim-entra text-center">
          <p className="font-titolo text-sm font-bold uppercase tracking-wide text-testo-morbido">
            {it.gtw.indovina(attivo.nome)}
          </p>
          <div
            role="timer"
            aria-label={`Tempo rimanente ${Math.ceil(rimasti / 1000)} secondi`}
            className={`mt-2 font-titolo text-6xl font-extrabold tabular-nums ${
              rimasti <= 10_000 ? "text-corallo" : ""
            }`}
          >
            {formatMs(rimasti)}
          </div>
          <div className="mx-auto mt-6 max-w-md">
            {parola && (
              <PlayingCard variant="lemon" className="py-10">
                <p className="font-titolo text-xs font-extrabold uppercase tracking-[0.2em] text-black/60">
                  {it.gtw.laParolaE}
                </p>
                <p className="mt-3 font-titolo text-4xl font-extrabold uppercase leading-none tracking-tight text-black break-words">
                  {parola.prompt}
                </p>
              </PlayingCard>
            )}
          </div>

          <div className="mt-8 grid gap-3">
            <Button variant="primario" onClick={() => concludiTurno("indovinata")}>
              {it.gtw.indovinata}
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="morbido" onClick={togglePausa}>
                {pausa ? it.gtw.riprendi : it.gtw.pausa}
              </Button>
              <Button
                variant="morbido"
                onClick={() => concludiTurno("saltata")}
                disabled={!saltoConsentito}
              >
                {it.gtw.salta}
              </Button>
            </div>
            {config.consentiSalto !== false && config.maxSalti && config.maxSalti > 0 && (
              <p className="text-xs text-testo-morbido">
                {it.gtw.saltiRimasti(Math.max(0, config.maxSalti - saltiUsati))}
              </p>
            )}
          </div>
        </div>
      </main>
    );
  }

  // ---------- turn_result ----------
  if (fase === "turn_result" && ultimoRisultato) {
    const r = ultimoRisultato;
    const titolo =
      r.esito === "indovinata"
        ? it.gtw.parolaIndovinata
        : r.esito === "saltata"
          ? it.gtw.parolaSaltata
          : it.gtw.tempoScaduto;
    return (
      <main className={wrap}>
        <div className="anim-entra text-center">
          <h1 className="font-titolo text-3xl font-extrabold">{titolo}</h1>
          <div className="mx-auto mt-6 max-w-md">
            <PlayingCard variant={r.esito === "indovinata" ? "mint" : "white"} className="py-8">
              <p className="font-titolo text-3xl font-extrabold uppercase tracking-tight text-black break-words">
                {r.parola}
              </p>
              {r.categoria && (
                <p className="mt-2 font-titolo text-xs font-bold uppercase tracking-wide text-black/60">
                  {r.categoria}
                </p>
              )}
            </PlayingCard>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Badge colore="cielo">
              {it.gtw.tempoImpiegato}: {formatMs(r.tempoImpiegatoMs)}
            </Badge>
            {r.esito === "indovinata" && (
              <Badge colore="menta">
                {it.gtw.tempoRimasto}: {formatMs(r.tempoRimastoMs)}
              </Badge>
            )}
            {config.punteggi && <Badge colore="giallo">+{r.punti}</Badge>}
          </div>
          <Button className="mt-8" variant="primario" onClick={vaiAlProssimo}>
            {it.gtw.prossimoGiocatore}
          </Button>
        </div>
      </main>
    );
  }

  // ---------- finished ----------
  const perGiocatore = ordine.map((g) => {
    const suoi = risultati.filter((r) => r.giocatoreId === g.id);
    const indovinate = suoi.filter((r) => r.esito === "indovinata");
    const saltate = suoi.filter((r) => r.esito === "saltata").length;
    const scaduti = suoi.filter((r) => r.esito === "scaduta").length;
    const tempoMedio =
      indovinate.length > 0
        ? indovinate.reduce((s, r) => s + r.tempoImpiegatoMs, 0) / indovinate.length
        : 0;
    return {
      g,
      indovinate: indovinate.length,
      saltate,
      scaduti,
      tempoMedio,
      punti: punteggi[g.id] ?? 0,
    };
  });
  const classifica = [...perGiocatore].sort((a, b) =>
    config.punteggi ? b.punti - a.punti : b.indovinate - a.indovinate,
  );
  const vincitore = classifica[0]?.g;

  return (
    <main className={wrap}>
      <div className="anim-entra text-center">
        <h1 className="mt-4 font-titolo text-3xl font-extrabold">{it.gtw.partitaFinita}</h1>
        {vincitore && (
          <p className="mt-3 text-lg">
            {it.comune.vincitore}: <strong>{vincitore.nome}</strong>
          </p>
        )}
        <div className="mt-6 space-y-2 text-left">
          {classifica.map((r) => (
            <div
              key={r.g.id}
              className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-bordo)] on-light text-black bg-[var(--color-superficie)] p-3"
            >
              <Avatar nome={r.g.nome} colore={r.g.colore} />
              <div className="min-w-0 flex-1">
                <span className="font-semibold">{r.g.nome}</span>
                <span className="block text-xs text-testo-morbido">
                  {it.gtw.paroleIndovinate}: {r.indovinate} · {it.gtw.paroleSaltate}: {r.saltate} ·{" "}
                  {it.gtw.tempiScaduti}: {r.scaduti}
                  {r.indovinate > 0 && ` · ${it.gtw.tempoMedio}: ${formatMs(r.tempoMedio)}`}
                </span>
              </div>
              {config.punteggi && (
                <span className="font-titolo text-lg font-bold">{r.punti}</span>
              )}
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-col gap-3">
          <Button variant="primario" onClick={ricomincia}>
            {it.gtw.giocaAncora}
          </Button>
          <Button
            variant="morbido"
            onClick={() => router.push(`/partita/nuova?gioco=${config.slug}`)}
          >
            {it.gtw.cambiaCategorie}
          </Button>
          <Button
            variant="fantasma"
            onClick={() => {
              eliminaSessione();
              router.push("/giochi");
            }}
          >
            {it.gtw.tornaInizio}
          </Button>
        </div>
      </div>
    </main>
  );
}

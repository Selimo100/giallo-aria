"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Badge, Avatar, PlayingCard } from "@/components/ui";
import { it } from "@/messages/it";
import { CONTENUTI_OV } from "@/features/content/obbligo-verita";
import { useContenutiPersonali } from "@/features/content/useContenutiPersonali";
import { personaliOV } from "@/lib/local-storage/custom-content";
import {
  scegliOV,
  scegliAlternativaSicura,
  puntiOV,
  puoSaltare,
  type FiltriOV,
} from "@/lib/game-engine/obbligo-verita";
import { mescola, combinaFonti } from "@/lib/game-engine/selection";
import { type ContenutoOV, type Giocatore, type TipoContenutoOV } from "@/types/domain";
import {
  salvaSessione,
  eliminaSessione,
  type SessionePubblica,
} from "@/lib/local-storage/session";

type Fase = "player_transition" | "choice" | "content" | "finished";

interface StatOV {
  verita: number;
  obblighi: number;
  salti: number;
}

const ZERO: StatOV = { verita: 0, obblighi: 0, salti: 0 };

export default function GiocoObbligoVerita({
  sessione: iniziale,
}: {
  sessione: SessionePubblica;
}) {
  const router = useRouter();
  const config = iniziale.config;

  // Resolve player order once (persisted so restore keeps the same order).
  const ordine = useMemo<Giocatore[]>(() => {
    if (iniziale.ordineIds?.length) {
      const byId = new Map(config.giocatori.map((g) => [g.id, g]));
      const restored = iniziale.ordineIds.map((id) => byId.get(id)).filter(Boolean) as Giocatore[];
      if (restored.length === config.giocatori.length) return restored;
    }
    return config.ordine === "Casuale" ? mescola(config.giocatori) : config.giocatori;
  }, [config.giocatori, config.ordine, iniziale.ordineIds]);

  const [fase, setFase] = useState<Fase>("player_transition");
  const [turnIndex, setTurnIndex] = useState(iniziale.turnIndex ?? 0);
  const [round, setRound] = useState(iniziale.round);
  const [punteggi, setPunteggi] = useState<Record<string, number>>(iniziale.punteggi);
  const [stats, setStats] = useState<Record<string, StatOV>>(
    iniziale.statsOV ?? Object.fromEntries(ordine.map((g) => [g.id, { ...ZERO }])),
  );
  const usedRef = useRef<Set<string>>(new Set(iniziale.usedContentIds));

  // Current-turn secret state — NEVER persisted; re-derived on reveal.
  const [contenuto, setContenuto] = useState<ContenutoOV | null>(null);
  const [tipoScelto, setTipoScelto] = useState<TipoContenutoOV | null>(null);
  const [alternativa, setAlternativa] = useState(false);
  const [pronto, setPronto] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  const attivo = ordine[turnIndex];

  // Base official content + the user's own active items.
  const personali = useContenutiPersonali();
  const contenutiTutti = useMemo(
    () =>
      combinaFonti(
        CONTENUTI_OV,
        personaliOV(personali, true),
        config.contentSource ?? "official_only",
      ),
    [personali, config.contentSource],
  );

  const filtri = useMemo<FiltriOV>(
    () => ({
      intensitaMax: config.intensita,
      categorie: config.categorie,
      numGiocatori: ordine.length,
      senzaMovimento: config.senzaMovimento,
    }),
    [config, ordine.length],
  );

  // filtri + the recently-used set, evaluated only inside event handlers.
  const filtriConEsclusi = (): FiltriOV => ({ ...filtri, escludiIds: usedRef.current });

  const persist = useCallback(
    (patch: Partial<SessionePubblica>) => {
      salvaSessione({
        ...iniziale,
        round,
        turnIndex,
        ordineIds: ordine.map((g) => g.id),
        usedContentIds: [...usedRef.current],
        punteggi,
        statsOV: stats,
        ...patch,
      });
    },
    [iniziale, round, turnIndex, ordine, punteggi, stats],
  );

  const modalita = config.modalita ?? "Obbligo e Verità";

  function iniziaTurno() {
    setPronto(true);
    // In solo modes we skip the choice screen.
    if (modalita === "Solo Obbligo") rivela("dare");
    else if (modalita === "Solo Verità") rivela("truth");
    else setFase("choice");
  }

  function rivela(tipo: TipoContenutoOV) {
    const c = scegliOV(contenutiTutti, tipo, filtriConEsclusi());
    setTipoScelto(tipo);
    setAlternativa(false);
    if (!c) {
      setContenuto(null);
      setFase("content");
      return;
    }
    usedRef.current.add(c.id);
    setContenuto(c);
    setFase("content");
  }

  function mostraAlternativa() {
    if (!contenuto) return;
    const alt = scegliAlternativaSicura(contenutiTutti, contenuto, filtriConEsclusi());
    if (!alt) return;
    if (alt.id) usedRef.current.add(alt.id);
    setContenuto({ ...contenuto, prompt: alt.prompt, richiedeMovimento: false, richiedeContatto: false, timerConsigliato: 0, safeAlternative: undefined });
    setAlternativa(true);
  }

  function aggiornaStat(id: string, patch: Partial<StatOV>) {
    setStats((s) => ({ ...s, [id]: { ...(s[id] ?? ZERO), ...merge(s[id] ?? ZERO, patch) } }));
  }
  function merge(base: StatOV, patch: Partial<StatOV>): StatOV {
    return {
      verita: base.verita + (patch.verita ?? 0),
      obblighi: base.obblighi + (patch.obblighi ?? 0),
      salti: base.salti + (patch.salti ?? 0),
    };
  }

  function completa() {
    if (!contenuto || !tipoScelto) return prossimo();
    if (config.punteggi) {
      const p = puntiOV(tipoScelto, alternativa);
      setPunteggi((prev) => ({ ...prev, [attivo.id]: (prev[attivo.id] ?? 0) + p }));
    }
    aggiornaStat(attivo.id, tipoScelto === "truth" ? { verita: 1 } : { obblighi: 1 });
    prossimo();
  }

  function salta(emergenza: boolean) {
    aggiornaStat(attivo.id, { salti: 1 });
    if (!emergenza && config.comportamentoSkip === "Con penalità" && config.punteggi) {
      setPunteggi((prev) => ({ ...prev, [attivo.id]: Math.max(0, (prev[attivo.id] ?? 0) - 1) }));
    }
    prossimo();
  }

  function segnala(_reason: string) {
    void _reason; // reason would be sent to the backend when authenticated
    setReportOpen(false);
    setToast(it.ov.segnalato);
    // Reporting must not destroy the game: continue with another item.
    if (tipoScelto) rivela(tipoScelto);
  }

  function prossimo() {
    // Reset current-turn secret state so nothing lingers on the transition.
    setContenuto(null);
    setTipoScelto(null);
    setAlternativa(false);
    setPronto(false);
    setReportOpen(false);

    let nextTurn = turnIndex + 1;
    let nextRound = round;
    if (nextTurn >= ordine.length) {
      nextTurn = 0;
      nextRound = round + 1;
    }

    if (!config.senzaFine && nextRound > config.round) {
      persist({ round });
      setFase("finished");
      return;
    }
    setTurnIndex(nextTurn);
    setRound(nextRound);
    persist({ round: nextRound, turnIndex: nextTurn });
    setFase("player_transition");
  }

  const skipsUsati = stats[attivo?.id ?? ""]?.salti ?? 0;
  const skipNormaleOk = puoSaltare(config.comportamentoSkip, skipsUsati, config.maxSkip ?? 0);

  const wrap = "mx-auto max-w-2xl px-5 py-10 min-h-dvh flex flex-col justify-center";

  // ---------- player_transition ----------
  if (fase === "player_transition") {
    return (
      <main className={wrap}> <div className="anim-entra flex flex-col items-center text-center" aria-live="polite"> <Badge colore="corallo"> {config.senzaFine ? "Senza fine" : `${it.comune.round} ${round} / ${config.round}`}
          </Badge> <div className="anim-galleggia my-6"> <Avatar nome={attivo.nome} colore={attivo.colore} /> </div> <h1 className="font-titolo text-2xl font-extrabold">{it.ov.turnoDi(attivo.nome)}</h1> <p className="mt-2 text-testo-morbido">{it.reveal.passaA(attivo.nome)}</p> <p className="mt-1 text-sm text-testo-morbido">{it.reveal.nessunoGuardi}</p> <Button className="mt-8" variant="primario" onClick={iniziaTurno}> {it.reveal.toccaQuandoPronto}
          </Button> </div> </main> );
  }

  // ---------- choice ----------
  if (fase === "choice") {
    return (
      <main className={wrap}> <div className="anim-entra text-center"> <h1 className="font-titolo text-2xl font-extrabold">{it.ov.scegli(attivo.nome)}</h1> <div className="mt-8 grid grid-cols-2 gap-4"> <button type="button" onClick={() => rivela("truth")} className="rotate-[-2deg]"> <PlayingCard variant="sky" interactive className="h-full py-8 text-center"> <p className="font-titolo text-2xl font-extrabold uppercase tracking-tight">{it.ov.verita}</p> <p className="mt-1 text-xs font-medium opacity-70">{it.ov.scegliVerita}</p> </PlayingCard> </button> <button type="button" onClick={() => rivela("dare")} className="rotate-[2deg]"> <PlayingCard variant="tangerine" interactive className="h-full py-8 text-center"> <p className="font-titolo text-2xl font-extrabold uppercase tracking-tight">{it.ov.obbligo}</p> <p className="mt-1 text-xs font-medium opacity-70">{it.ov.scegliObbligo}</p> </PlayingCard> </button> </div> <p className="mt-6 text-xs text-testo-morbido">{it.sicurezza.saltaSempre}</p> </div> </main> );
  }

  // ---------- content ----------
  if (fase === "content") {
    const isDare = tipoScelto === "dare";
    return (
      <main className={wrap}> <div className="anim-entra" aria-live="polite"> <div className="mb-3 flex items-center justify-between"> <Badge colore={isDare ? "corallo" : "cielo"}> {isDare ? it.ov.obbligoLabel : it.ov.veritaLabel}
            </Badge> <span className="text-sm text-testo-morbido">{attivo.nome}</span> </div> {!contenuto ? (
            <Card className="text-center text-testo-morbido">{it.ov.noContenuto}</Card> ) : (
            <Card className={isDare ? "border-corallo" : "border-cielo"}> <p className="font-titolo text-2xl font-bold leading-snug">{contenuto.prompt}</p> <div className="mt-3 flex flex-wrap gap-2"> {alternativa && <Badge colore="menta">{it.ov.alternativaSicura}</Badge>}
                {contenuto.richiedeMovimento && <Badge colore="viola">{it.ov.movimento}</Badge>}
                {contenuto.categoria && <Badge colore="giallo">{contenuto.categoria}</Badge>}
              </div> {isDare && config.timerAttivo && (
                <TimerInline durata={contenuto.timerConsigliato || config.timerDurata || 30} /> )}
              {contenuto.noteAccessibilita && (
                <p className="mt-3 text-sm text-testo-morbido">{contenuto.noteAccessibilita}</p> )}
            </Card> )}

          <div className="mt-6 grid gap-3"> {contenuto && (
              <Button variant="primario" onClick={completa}> {isDare ? it.ov.sfidaCompletata : it.ov.domandaRisposta}
              </Button> )}
            {isDare && contenuto && config.alternativeSicure !== false && !alternativa && (
              <Button variant="morbido" onClick={mostraAlternativa}> {it.ov.mostraAlternativa}
              </Button> )}
            <Button variant="morbido" onClick={() => salta(false)} disabled={!skipNormaleOk}> {it.azioni.salta}
              {config.comportamentoSkip === "Limitati" &&
                ` (${Math.max(0, (config.maxSkip ?? 0) - skipsUsati)})`}
            </Button> {/* Emergency safety skip — always available, no explanation. */}
            <button
              type="button"
              onClick={() => salta(true)}
              className="text-sm font-semibold text-testo-morbido underline underline-offset-4 hover:text-testo"
            > {it.sicurezza.saltaEmergenza}
            </button> <button
              type="button"
              onClick={() => setReportOpen((o) => !o)}
              className="text-xs text-testo-morbido hover:text-corallo"
            > {it.ov.segnala}
            </button> </div> {reportOpen && (
            <Card className="mt-4"> <p className="mb-2 text-sm font-semibold">Motivo della segnalazione</p> <div className="flex flex-wrap gap-2"> {it.ov.reportReasons.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => segnala(r)}
                    className="rounded-[var(--radius-pill)] on-light text-black bg-[var(--color-superficie-2)] px-3 py-1.5 text-sm"
                  > {r}
                  </button> ))}
              </div> </Card> )}

          {toast && (
            <p className="mt-4 rounded-[var(--radius-card)] bg-menta/15 p-3 text-center text-sm text-menta" role="status"> {toast}
            </p> )}
        </div> </main> );
  }

  // ---------- finished ----------
  const classifica = [...ordine].sort((a, b) => (punteggi[b.id] ?? 0) - (punteggi[a.id] ?? 0));
  const vincitore = classifica[0];
  return (
    <main className={wrap}> <div className="anim-entra text-center">  <h1 className="mt-4 font-titolo text-3xl font-extrabold">Partita finita!</h1> {config.punteggi && vincitore && (
          <p className="mt-3 text-lg"> {it.comune.vincitore}: <strong>{vincitore.nome}</strong> </p> )}
        <div className="mt-6 space-y-2 text-left"> {classifica.map((g) => (
            <div
              key={g.id}
              className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-bordo)] on-light text-black bg-[var(--color-superficie)] p-3"
            > <Avatar nome={g.nome} colore={g.colore} /> <span className="flex-1 font-semibold">{g.nome}</span> <span className="text-sm text-testo-morbido"> {stats[g.id]?.verita ?? 0} ·  {stats[g.id]?.obblighi ?? 0} ·  {stats[g.id]?.salti ?? 0}
              </span> {config.punteggi && (
                <span className="font-titolo text-lg font-bold">{punteggi[g.id] ?? 0}</span> )}
            </div> ))}
        </div> <div className="mt-8 flex flex-col gap-3"> <Button
            variant="primario"
            onClick={() => {
              setPunteggi(Object.fromEntries(ordine.map((g) => [g.id, 0])));
              setStats(Object.fromEntries(ordine.map((g) => [g.id, { ...ZERO }])));
              usedRef.current = new Set();
              setRound(1);
              setTurnIndex(0);
              persist({
                round: 1,
                turnIndex: 0,
                usedContentIds: [],
                punteggi: Object.fromEntries(ordine.map((g) => [g.id, 0])),
                statsOV: Object.fromEntries(ordine.map((g) => [g.id, { ...ZERO }])),
              });
              setFase("player_transition");
            }}
          > {it.azioni.rigioca}
          </Button> <Button
            variant="morbido"
            onClick={() => {
              eliminaSessione();
              router.push("/giochi");
            }}
          > {it.ov.terminaPartita}
          </Button> </div> </div> </main> );
}

function TimerInline({ durata }: { durata: number }) {
  const [rimasti, setRimasti] = useState(durata);
  const [attivo, setAttivo] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  function toggle() {
    if (attivo) {
      if (ref.current) clearInterval(ref.current);
      setAttivo(false);
    } else {
      if (rimasti === 0) setRimasti(durata);
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

  const finito = rimasti === 0;
  return (
    <div className="mt-4 flex items-center gap-4"> <div
        className={`font-titolo text-3xl font-extrabold tabular-nums ${finito ? "text-corallo" : ""}`}
        role="timer"
        aria-live="off"
      > 0:{rimasti.toString().padStart(2, "0")}
      </div> <Button variant="morbido" onClick={toggle}> {attivo ? it.ov.fermaTimer : finito ? "Tempo scaduto" : it.ov.avviaTimer}
      </Button> </div> );
}

"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Badge, Avatar } from "@/components/ui";
import { it } from "@/messages/it";
import { STATEMENTS_NON_HO_MAI } from "@/features/content/non-ho-mai";
import { filtraContenuti, scegliCasuale } from "@/lib/game-engine/selection";
import { type ContenutoGioco } from "@/types/domain";
import { salvaSessione, eliminaSessione, type SessionePubblica } from "@/lib/local-storage/session";

type Fase = "intro" | "statement" | "finito";

export default function GiocoNonHoMai({ sessione: iniziale }: { sessione: SessionePubblica }) {
  const router = useRouter();
  const config = iniziale.config;
  const giocatori = config.giocatori;

  const [fase, setFase] = useState<Fase>("intro");
  const [round, setRound] = useState(iniziale.round);
  const [tracciamento, setTracciamento] = useState(config.punteggi !== false);
  const [statement, setStatement] = useState<ContenutoGioco | null>(null);
  const [fatto, setFatto] = useState<Set<string>>(new Set());
  const [punteggi, setPunteggi] = useState<Record<string, number>>(iniziale.punteggi);
  const usedRef = useRef<Set<string>>(new Set(iniziale.usedContentIds));

  const possibili = useMemo(
    () => filtraContenuti(STATEMENTS_NON_HO_MAI, {
        intensitaMax: config.intensita,
      }),
    [config],
  );

  const persist = useCallback(
    (patch: Partial<SessionePubblica>) => salvaSessione({ ...iniziale, round, usedContentIds: [...usedRef.current], punteggi, ...patch }),
    [iniziale, round, punteggi],
  );

  function nuovo() {
    const disp = possibili.filter((s) => !usedRef.current.has(s.id));
    const s = scegliCasuale(disp.length ? disp : possibili);
    if (!s) return;
    usedRef.current.add(s.id);
    setStatement(s);
    setFatto(new Set());
    setFase("statement");
  }

  function toggleFatto(id: string) {
    setFatto((f) => {
      const n = new Set(f);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function prossimo() {
    if (tracciamento) {
      setPunteggi((p) => {
        const next = { ...p };
        fatto.forEach((id) => (next[id] = (next[id] ?? 0) + 1));
        return next;
      });
    }
    const nuovoR = round + 1;
    if (nuovoR > config.round) {
      persist({ round });
      setFase("finito");
      return;
    }
    setRound(nuovoR);
    setStatement(null);
    persist({ round: nuovoR });
    setFase("intro");
  }

  const wrap = "mx-auto max-w-2xl px-5 py-10 min-h-dvh flex flex-col justify-center";

  if (fase === "intro") {
    return (
      <main className={wrap}> <div className="anim-entra text-center"> <Badge colore="menta">{it.comune.round} {round} / {config.round}</Badge>  <h1 className="font-titolo text-3xl font-extrabold">Non ho mai…</h1> <p className="mt-3 text-testo-morbido"> Leggete la frase ad alta voce. Chi l&apos;ha fatto lo ammette!
          </p> <label className="mt-6 inline-flex items-center gap-3"> <input
              type="checkbox"
              checked={tracciamento}
              onChange={(e) => setTracciamento(e.target.checked)}
              className="h-5 w-5 accent-[var(--color-giallo)]"
            /> <span>Tieni il conteggio su questo telefono</span> </label> <br /> {possibili.length === 0 ? (
            <p className="mt-6 text-corallo">{it.comune.nessunContenuto}</p> ) : (
            <Button className="mt-6" variant="primario" onClick={nuovo}>{it.azioni.continua}</Button> )}
        </div> </main> );
  }

  if (fase === "statement" && statement) {
    return (
      <main className={wrap}> <div className="anim-entra"> <Card className="on-light text-black bg-[var(--color-superficie-2)] text-center"> <p className="font-titolo text-2xl font-bold leading-snug">{statement.prompt}</p> </Card> {tracciamento && (
            <> <p className="mt-6 text-center text-sm text-testo-morbido"> Tocca chi l&apos;ha già fatto ({fatto.size})
              </p> <div className="mt-3 grid grid-cols-2 gap-2"> {giocatori.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggleFatto(g.id)}
                    aria-pressed={fatto.has(g.id)}
                    className={`flex items-center gap-2 rounded-[var(--radius-card)] border p-2.5 text-left transition ${
                      fatto.has(g.id)
                        ? "border-menta bg-menta/15"
                        : "border-[var(--color-bordo)] on-light text-black bg-[var(--color-superficie)]"
                    }`}
                  > <Avatar nome={g.nome} colore={g.colore} /> <span className="truncate font-semibold">{g.nome}</span> </button> ))}
              </div> </> )}
          <div className="mt-8 flex gap-3"> <Button variant="morbido" onClick={nuovo}>{it.azioni.salta}</Button> <Button variant="primario" fullWidth onClick={prossimo}> {round >= config.round ? "Risultati finali" : it.azioni.prossimoRound}
            </Button> </div> </div> </main> );
  }

  const classifica = [...giocatori].sort((a, b) => (punteggi[b.id] ?? 0) - (punteggi[a.id] ?? 0));
  return (
    <main className={wrap}> <div className="anim-entra text-center">  <h1 className="mt-4 font-titolo text-3xl font-extrabold">Partita finita!</h1> {tracciamento && (
          <div className="mt-6 space-y-2 text-left"> {classifica.map((g) => (
              <div key={g.id} className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-bordo)] on-light text-black bg-[var(--color-superficie)] p-3"> <Avatar nome={g.nome} colore={g.colore} /> <span className="flex-1 font-semibold">{g.nome}</span> <span className="text-sm text-testo-morbido">l&apos;ha fatto {punteggi[g.id] ?? 0} volte</span> </div> ))}
          </div> )}
        <div className="mt-8 flex flex-col gap-3"> <Button variant="primario" onClick={() => { setPunteggi(Object.fromEntries(giocatori.map((g) => [g.id, 0]))); setRound(1); setStatement(null); usedRef.current = new Set(); persist({ round: 1, usedContentIds: [], punteggi: Object.fromEntries(giocatori.map((g) => [g.id, 0])) }); setFase("intro"); }}> {it.azioni.rigioca}
          </Button> <Button variant="morbido" onClick={() => { eliminaSessione(); router.push("/giochi"); }}>{it.azioni.esci}</Button> </div> </div> </main> );
}

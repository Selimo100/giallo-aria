"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Badge, Avatar } from "@/components/ui";
import { Timer } from "@/components/games/Timer";
import { it } from "@/messages/it";
import { CATEGORIE_GIOCO, LETTERE } from "@/features/content/categorie";
import { scegliCasuale, mescola } from "@/lib/game-engine/selection";
import { eliminaSessione, type SessionePubblica } from "@/lib/local-storage/session";

type Fase = "config" | "gioco" | "risultato" | "finito";

export default function GiocoCategorie({ sessione: iniziale }: { sessione: SessionePubblica }) {
  const router = useRouter();
  const giocatori = iniziale.config.giocatori;

  const [fase, setFase] = useState<Fase>("config");
  const [categoria, setCategoria] = useState<string>(() => scegliCasuale(CATEGORIE_GIOCO)!);
  const [lettera, setLettera] = useState<string>(() => scegliCasuale(LETTERE)!);
  const [durata, setDurata] = useState(60);
  const [eliminazione, setEliminazione] = useState(true);
  const [vite, setVite] = useState<Record<string, number>>(() => Object.fromEntries(giocatori.map((g) => [g.id, 3])));
  const [starter, setStarter] = useState(0);
  const [eliminatiRound, setEliminatiRound] = useState<Set<string>>(new Set());
  const [numRound, setNumRound] = useState(1);

  const vivi = giocatori.filter((g) => (vite[g.id] ?? 0) > 0);

  function avvia() {
    setStarter(Math.floor(Math.random() * giocatori.length));
    setEliminatiRound(new Set());
    setFase("gioco");
  }

  function random() {
    setCategoria(scegliCasuale(CATEGORIE_GIOCO)!);
    setLettera(scegliCasuale(LETTERE)!);
  }

  function fineRound() {
    if (!eliminazione) {
      prossimo();
      return;
    }
    setFase("risultato");
  }

  function prossimo() {
    let finito = false;
    if (eliminazione) {
      const next = { ...vite };
      eliminatiRound.forEach((id) => (next[id] = Math.max(0, (next[id] ?? 0) - 1)));
      setVite(next);
      finito = giocatori.filter((g) => (next[g.id] ?? 0) > 0).length <= 1;
    }
    setNumRound((n) => n + 1);
    random();
    setEliminatiRound(new Set());
    setStarter(Math.floor(Math.random() * giocatori.length));
    setFase(finito ? "finito" : "config");
  }

  const wrap = "mx-auto max-w-2xl px-5 py-10 min-h-dvh flex flex-col justify-center";

  if (fase === "config") {
    return (
      <main className={wrap}> <div className="anim-entra"> <div className="text-center"> <Badge colore="cielo">Round {numRound}</Badge>  <h1 className="font-titolo text-2xl font-extrabold">Categorie</h1> </div> <Card className="mt-6 text-center"> <p className="text-sm text-testo-morbido">Categoria</p> <p className="font-titolo text-2xl font-bold">{categoria}</p> <p className="mt-4 text-sm text-testo-morbido">Lettera</p> <p className="font-titolo text-5xl font-extrabold text-giallo-scuro">{lettera}</p> <Button className="mt-4" variant="fantasma" onClick={random}> Cambia a caso</Button> </Card> <div className="mt-6"> <p className="font-semibold">Durata timer</p> <div className="mt-2 flex flex-wrap gap-2"> {[30, 45, 60, 90].map((t) => (
                <button key={t} type="button" onClick={() => setDurata(t)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${durata === t ? "on-light bg-giallo text-testo" : "on-light text-black bg-[var(--color-superficie-2)] text-testo-morbido"}`}> {t}s
                </button> ))}
            </div> </div> <label className="mt-4 flex items-center gap-3"> <input type="checkbox" checked={eliminazione} onChange={(e) => setEliminazione(e.target.checked)} className="h-5 w-5 accent-[var(--color-giallo)]" /> <span>Modalità a eliminazione (3 vite a testa)</span> </label> <Button className="mt-6" variant="primario" fullWidth onClick={avvia}>Inizia il round</Button> </div> </main> );
  }

  if (fase === "gioco") {
    return (
      <main className={wrap}> <div className="anim-entra text-center"> <Card className="on-light text-black bg-[var(--color-superficie-2)]"> <p className="text-sm text-testo-morbido">{categoria}</p> <p className="font-titolo text-6xl font-extrabold text-giallo-scuro">{lettera}</p> </Card> <p className="mt-4 text-testo-morbido">Inizia <strong>{giocatori[starter].nome}</strong>, poi si prosegue a turno.</p> <div className="mt-6"><Timer key={`${categoria}-${lettera}-${numRound}`} durata={durata} /></div> <Button className="mt-8" variant="primario" onClick={fineRound}>Fine del round</Button> </div> </main> );
  }

  if (fase === "risultato") {
    return (
      <main className={wrap}> <div className="anim-entra"> <h1 className="text-center font-titolo text-2xl font-extrabold">Chi ha sbagliato o si è fermato?</h1> <p className="mt-2 text-center text-testo-morbido">Tocca chi perde una vita in questo round.</p> <div className="mt-6 grid grid-cols-2 gap-2"> {vivi.map((g) => (
              <button key={g.id} type="button"
                onClick={() => setEliminatiRound((s) => { const n = new Set(s); n.has(g.id) ? n.delete(g.id) : n.add(g.id); return n; })}
                aria-pressed={eliminatiRound.has(g.id)}
                className={`flex items-center gap-2 rounded-[var(--radius-card)] border p-2.5 text-left transition ${eliminatiRound.has(g.id) ? "border-corallo bg-corallo/15" : "border-[var(--color-bordo)] on-light text-black bg-[var(--color-superficie)]"}`}> <Avatar nome={g.nome} colore={g.colore} /> <span className="min-w-0 flex-1"> <span className="block truncate font-semibold">{g.nome}</span> <span className="text-xs text-testo-morbido">{"●".repeat(vite[g.id] ?? 0) || "—"}</span> </span> </button> ))}
          </div> <Button className="mt-8" variant="primario" fullWidth onClick={prossimo}>Prossimo round</Button> </div> </main> );
  }

  const vincitore = vivi[0] ?? [...giocatori].sort((a, b) => (vite[b.id] ?? 0) - (vite[a.id] ?? 0))[0];
  return (
    <main className={wrap}> <div className="anim-entra text-center">  <h1 className="mt-4 font-titolo text-3xl font-extrabold">Abbiamo un vincitore!</h1> {vincitore && <p className="mt-3 text-lg">{it.comune.vincitore}: <strong>{vincitore.nome}</strong></p>}
        <div className="mt-8 flex flex-col gap-3"> <Button variant="primario" onClick={() => { setVite(Object.fromEntries(giocatori.map((g) => [g.id, 3]))); setNumRound(1); random(); setFase("config"); }}> {it.azioni.rigioca}
          </Button> <Button variant="morbido" onClick={() => { eliminaSessione(); router.push("/giochi"); }}>{it.azioni.esci}</Button> </div> </div> </main> );
}

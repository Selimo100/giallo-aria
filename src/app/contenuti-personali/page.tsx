"use client";

import { useMemo, useState } from "react";
import { Button, Card, Badge, Logo } from "@/components/ui";
import { GIOCHI } from "@/features/games/registry";
import { CATEGORIE_IMPOSTORE } from "@/features/content/impostore";
import { CATEGORIE_OV } from "@/features/content/obbligo-verita";
import { CATEGORIE_INDOVINA_PAROLA } from "@/features/content/indovina-la-parola";
import { useContenutiPersonali } from "@/features/content/useContenutiPersonali";
import { useCategoriePersonali } from "@/features/content/useCategoriePersonali";
import {
  aggiungiContenuto,
  rimuoviContenuto,
  toggleContenuto,
} from "@/lib/local-storage/custom-content";
import {
  categorieDi,
  aggiungiCategoria,
  rinominaCategoria,
  archiviaCategoria,
  eliminaCategoria,
} from "@/lib/local-storage/personal-categories";
import {
  INTENSITA,
  type Intensita,
  type GameSlug,
  type TipoContenutoOV,
} from "@/types/domain";

const GIOCHI_CONTENUTO: { slug: GameSlug; nome: string }[] = GIOCHI.filter(
  (g) =>
    g.slug === "impostore" ||
    g.slug === "chi-e-piu-probabile" ||
    g.slug === "obbligo-o-verita" ||
    g.slug === "indovina-la-parola",
).map((g) => ({ slug: g.slug, nome: g.nome }));

function Chip({
  attivo,
  onClick,
  children,
}: {
  attivo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={attivo}
      className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
        attivo ? "on-light bg-giallo text-testo" : "on-light text-black bg-[var(--color-superficie-2)] text-testo-morbido"
      }`}
    > {children}
    </button> );
}

function labelPrompt(game: GameSlug, tipo: TipoContenutoOV): string {
  if (game === "impostore") return "Parola segreta";
  if (game === "indovina-la-parola") return "Parola";
  if (game === "chi-e-piu-probabile") return "Domanda (Chi è più probabile che…?)";
  return tipo === "dare" ? "Obbligo (la sfida)" : "Verità (la domanda)";
}

export default function ContenutiPersonaliPage() {
  const contenuti = useContenutiPersonali();
  const categoriePersonali = useCategoriePersonali();

  const [game, setGame] = useState<GameSlug>("impostore");
  const [tipo, setTipo] = useState<TipoContenutoOV>("truth");
  const [prompt, setPrompt] = useState("");
  const [categoria, setCategoria] = useState("");
  const [suggerimento, setSuggerimento] = useState("");
  const [intensita, setIntensita] = useState<Intensita>("Divertente");
  const [timer, setTimer] = useState(30);
  const [movimento, setMovimento] = useState(false);
  const [safeAlt, setSafeAlt] = useState("");
  const [errore, setErrore] = useState<string | null>(null);
  const [filtroLista, setFiltroLista] = useState<GameSlug | "tutti">("tutti");
  const [nuovaCategoria, setNuovaCategoria] = useState("");

  const isOV = game === "obbligo-o-verita";
  const isDare = isOV && tipo === "dare";
  const isGTW = game === "indovina-la-parola";

  const mieCategorieGTW = useMemo(
    () => categorieDi(categoriePersonali, "indovina-la-parola", true),
    [categoriePersonali],
  );
  const categorieSuggerite = isGTW
    ? [...CATEGORIE_INDOVINA_PAROLA, ...mieCategorieGTW.filter((c) => !c.archiviata).map((c) => c.nome)]
    : game === "impostore"
      ? CATEGORIE_IMPOSTORE
      : isOV
        ? CATEGORIE_OV
        : [];

  function salva() {
    const p = prompt.trim();
    if (p.length < 2) {
      setErrore("Scrivi almeno una parola valida.");
      return;
    }
    if (!/[\p{L}\p{N}]/u.test(p)) {
      setErrore("La parola non può contenere solo punteggiatura.");
      return;
    }
    const cat = categoria.trim() || (isGTW ? "Personali" : game === "chi-e-piu-probabile" ? "Personali" : categorieSuggerite[0] ?? "Personali");
    // Prevent exact duplicates for the same game + category.
    const duplicato = contenuti.some(
      (c) =>
        c.gameType === game &&
        (c.categoria || "").toLowerCase() === cat.toLowerCase() &&
        c.prompt.trim().toLowerCase() === p.toLowerCase(),
    );
    if (duplicato) {
      setErrore("Hai già creato questo contenuto in questa categoria.");
      return;
    }
    aggiungiContenuto({
      gameType: game,
      tipo: isOV ? tipo : undefined,
      prompt: p,
      categoria: cat,
      intensita,
      suggerimento: isGTW && suggerimento.trim() ? suggerimento.trim() : undefined,
      timerConsigliato: isDare ? timer : undefined,
      richiedeMovimento: isDare ? movimento : undefined,
      safeAlternative: isDare && safeAlt.trim() ? safeAlt.trim() : undefined,
    });
    setPrompt("");
    setSuggerimento("");
    setSafeAlt("");
    setErrore(null);
  }

  function creaCategoria() {
    const creata = aggiungiCategoria("indovina-la-parola", nuovaCategoria);
    if (creata) {
      setCategoria(creata.nome);
      setNuovaCategoria("");
    }
  }

  const contaParole = (nome: string) =>
    contenuti.filter(
      (c) => c.gameType === "indovina-la-parola" && (c.categoria || "") === nome,
    ).length;

  const lista = useMemo(
    () => (filtroLista === "tutti" ? contenuti : contenuti.filter((c) => c.gameType === filtroLista)),
    [contenuti, filtroLista],
  );

  const nomeGioco = (slug: GameSlug) => GIOCHI.find((g) => g.slug === slug)?.nome ?? slug;

  return (
    <main className="mx-auto max-w-2xl px-5 pb-24"> <header className="flex items-center justify-between py-6"> <Logo size="text-2xl" /> </header> <h1 className="font-titolo text-3xl font-extrabold">I miei contenuti</h1> <p className="mt-2 text-testo-morbido"> Crea le tue parole, domande e sfide. Sono condivise con tutti e vengono
        aggiunte automaticamente alle partite (puoi disattivarle quando vuoi).
      </p> {/* --- Creazione --- */}
      <Card className="mt-6 space-y-5"> <div> <p className="mb-2 font-semibold">Per quale gioco?</p> <div className="flex flex-wrap gap-2"> {GIOCHI_CONTENUTO.map((g) => (
              <Chip key={g.slug} attivo={game === g.slug} onClick={() => setGame(g.slug)}> {g.nome}
              </Chip> ))}
          </div> </div> {isOV && (
          <div> <p className="mb-2 font-semibold">Tipo</p> <div className="flex gap-2"> <Chip attivo={tipo === "truth"} onClick={() => setTipo("truth")}>Verità</Chip> <Chip attivo={tipo === "dare"} onClick={() => setTipo("dare")}>Obbligo</Chip> </div> </div> )}

        <div> <label htmlFor="prompt" className="mb-2 block font-semibold"> {labelPrompt(game, tipo)}
          </label> <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={game === "impostore" ? 1 : 2}
            maxLength={240}
            placeholder={
              game === "impostore"
                ? "es. Cactus"
                : game === "chi-e-piu-probabile"
                  ? "es. Chi è più probabile che perda le chiavi?"
                  : isDare
                    ? "es. Imita il tuo cantante preferito per 15 secondi."
                    : "es. Qual è la cosa più buffa che ti è successa oggi?"
            }
            className="w-full rounded-[var(--radius-card)] border border-[var(--color-bordo)] on-light text-black bg-[var(--color-superficie)] p-3 text-testo"
          /> </div> {categorieSuggerite.length > 0 && (
          <div> <p className="mb-2 font-semibold">Categoria</p> <div className="flex flex-wrap gap-2"> {categorieSuggerite.map((c) => (
                <Chip key={c} attivo={categoria === c} onClick={() => setCategoria(c)}> {c}
                </Chip> ))}
            </div> </div> )}

        {isGTW && (
          <>
            <div>
              <label htmlFor="hint" className="mb-2 block font-semibold">Suggerimento facoltativo</label>
              <input
                id="hint"
                value={suggerimento}
                onChange={(e) => setSuggerimento(e.target.value)}
                maxLength={120}
                placeholder="es. È un animale che vive al Polo Sud."
                className="w-full rounded-full border border-[var(--color-bordo)] on-light text-black bg-[var(--color-superficie)] px-3 py-2"
              />
            </div>
            <div className="rounded-[var(--radius-card)] on-light text-black bg-[var(--color-superficie-2)] p-4">
              <p className="mb-2 font-semibold">Le mie categorie</p>
              <div className="flex gap-2">
                <input
                  value={nuovaCategoria}
                  onChange={(e) => setNuovaCategoria(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && creaCategoria()}
                  maxLength={40}
                  placeholder="es. Parole della nostra classe"
                  className="min-h-[44px] flex-1 rounded-full border border-[var(--color-bordo)] bg-white px-3 text-black"
                />
                <Button variant="secondario" onClick={creaCategoria}>Crea</Button>
              </div>
              <div className="mt-3 space-y-2">
                {mieCategorieGTW.length === 0 ? (
                  <p className="text-sm text-testo-morbido">Non hai ancora categorie personali.</p>
                ) : (
                  mieCategorieGTW.map((c) => (
                    <div key={c.id} className={`flex items-center gap-2 ${c.archiviata ? "opacity-50" : ""}`}>
                      <span className="flex-1 text-sm font-semibold">{c.nome}</span>
                      <span className="text-xs text-testo-morbido">{contaParole(c.nome)} parole</span>
                      <button type="button" onClick={() => { const n = window.prompt("Nuovo nome", c.nome); if (n) rinominaCategoria(c.id, n); }} className="text-xs underline">Rinomina</button>
                      <button type="button" onClick={() => archiviaCategoria(c.id, !c.archiviata)} className="text-xs underline">{c.archiviata ? "Ripristina" : "Archivia"}</button>
                      <button type="button" onClick={() => { if (contaParole(c.nome) === 0) eliminaCategoria(c.id); }} disabled={contaParole(c.nome) > 0} className="text-xs underline disabled:opacity-40" title={contaParole(c.nome) > 0 ? "Contiene parole" : "Elimina"}>Elimina</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        <div className="grid gap-4"> <div> <p className="mb-2 font-semibold">Intensità</p> <select
              value={intensita}
              onChange={(e) => setIntensita(e.target.value as Intensita)}
              className="w-full rounded-full border border-[var(--color-bordo)] on-light text-black bg-[var(--color-superficie)] px-3 py-2"
            > {INTENSITA.map((i) => <option key={i} value={i}>{i}</option>)}
            </select> </div> </div> {isDare && (
          <div className="space-y-4 rounded-[var(--radius-card)] on-light text-black bg-[var(--color-superficie-2)] p-4"> <div> <p className="mb-2 font-semibold">Timer consigliato</p> <div className="flex flex-wrap gap-2"> {[0, 10, 15, 30, 45, 60].map((t) => (
                  <Chip key={t} attivo={timer === t} onClick={() => setTimer(t)}> {t === 0 ? "Nessuno" : `${t}s`}
                  </Chip> ))}
              </div> </div> <label className="flex items-center gap-3"> <input
                type="checkbox"
                checked={movimento}
                onChange={(e) => setMovimento(e.target.checked)}
                className="h-5 w-5 accent-[var(--color-giallo)]"
              /> <span>Richiede movimento</span> </label> <div> <label htmlFor="safe" className="mb-2 block font-semibold"> Alternativa sicura (facoltativa)
              </label> <input
                id="safe"
                value={safeAlt}
                onChange={(e) => setSafeAlt(e.target.value)}
                maxLength={200}
                placeholder="es. Descrivi la sfida a parole invece di eseguirla."
                className="w-full rounded-full border border-[var(--color-bordo)] on-light text-black bg-[var(--color-superficie)] px-3 py-2"
              /> </div> </div> )}

        {/* Anteprima */}
        {prompt.trim().length > 0 && (
          <div> <p className="mb-2 text-sm font-semibold text-testo-morbido">Anteprima</p> <div className="rounded-[var(--radius-card)] border border-[var(--color-bordo)] on-light text-black bg-[var(--color-superficie-2)] p-4"> <p className="font-titolo text-lg font-bold">{prompt}</p> <div className="mt-2 flex flex-wrap gap-2"> <Badge colore="cielo">{nomeGioco(game)}</Badge> {isOV && <Badge colore="corallo">{tipo === "dare" ? "Obbligo" : "Verità"}</Badge>}
                <Badge colore="viola">{intensita}</Badge> </div> </div> </div> )}

        {errore && <p className="text-sm text-corallo">{errore}</p>}
        <Button variant="primario" fullWidth onClick={salva}> Aggiungi ai miei contenuti
        </Button> </Card> {/* --- Lista --- */}
      <div className="mt-10 flex items-center justify-between"> <h2 className="font-titolo text-2xl font-bold">La mia raccolta</h2> <span className="text-sm text-testo-morbido">{contenuti.length} elementi</span> </div> <div className="mt-3 flex flex-wrap gap-2"> <Chip attivo={filtroLista === "tutti"} onClick={() => setFiltroLista("tutti")}>Tutti</Chip> {GIOCHI_CONTENUTO.map((g) => (
          <Chip key={g.slug} attivo={filtroLista === g.slug} onClick={() => setFiltroLista(g.slug)}> {g.nome}
          </Chip> ))}
      </div> <div className="mt-4 space-y-2"> {lista.length === 0 ? (
          <Card className="text-center text-testo-morbido"> Non hai ancora contenuti qui. Creane uno qui sopra: comparirà nelle partite.
          </Card> ) : (
          lista.map((c) => (
            <div
              key={c.id}
              className={`flex items-start gap-3 rounded-[var(--radius-card)] border border-[var(--color-bordo)] on-light text-black bg-[var(--color-superficie)] p-3 ${
                c.attivo ? "" : "opacity-50"
              }`}
            > <div className="min-w-0 flex-1"> <p className="font-semibold">{c.prompt}</p> <div className="mt-1 flex flex-wrap gap-1.5 text-xs"> <Badge colore="cielo">{nomeGioco(c.gameType)}</Badge> {c.tipo && <Badge colore="corallo">{c.tipo === "dare" ? "Obbligo" : "Verità"}</Badge>}
                  <Badge colore="giallo">{c.intensita}</Badge> </div> </div> <button
                type="button"
                onClick={() => toggleContenuto(c.id)}
                className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
                style={{ background: c.attivo ? "var(--color-menta)" : "var(--color-superficie-2)", color: c.attivo ? "#fff" : "inherit" }}
                aria-pressed={c.attivo}
              > {c.attivo ? "Attivo" : "Inattivo"}
              </button> <button
                type="button"
                onClick={() => rimuoviContenuto(c.id)}
                aria-label="Elimina"
                className="shrink-0 text-testo-morbido hover:text-corallo"
              > </button> </div> ))
        )}
      </div> </main> );
}

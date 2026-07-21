"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, Badge, Avatar, Logo } from "@/components/ui";
import { GIOCHI, getGioco } from "@/features/games/registry";
import { CATEGORIE_IMPOSTORE } from "@/features/content/impostore";
import { CATEGORIE_OV } from "@/features/content/obbligo-verita";
import { CATEGORIE_INDOVINA } from "@/features/content/indovina-chi";
import { CATEGORIE_PROIBITE } from "@/features/content/parola-proibita";
import { CATEGORIE_INDOVINA_PAROLA } from "@/features/content/indovina-la-parola";
import { useCategoriePersonali } from "@/features/content/useCategoriePersonali";
import { categorieDi } from "@/lib/local-storage/personal-categories";
import { paroleNecessarie, costruisciPool } from "@/lib/game-engine/indovina-parola";
import { PAROLE_INDOVINA } from "@/features/content/indovina-la-parola";
import { personaliIndovinaParola } from "@/lib/local-storage/custom-content";
import { it } from "@/messages/it";
import {
  INTENSITA,
  CONTENT_SOURCE_MODES,
  CONTENT_SOURCE_LABEL,
  type ConfigPartita,
  type ContentSourceMode,
  type Intensita,
  type GameSlug,
  type Giocatore,
  type OrdineGiocatori,
  type ModalitaOV,
  type ComportamentoSkip,
} from "@/types/domain";
import { mescola } from "@/lib/game-engine/selection";
import { useContenutiPersonali } from "@/features/content/useContenutiPersonali";
import { nuovoSessionId, salvaSessione } from "@/lib/local-storage/session";

const COLORI = ["#ffc21f", "#4cc0ff", "#ff7a66", "#52d1a4", "#9b7bff", "#e5a300"];

/**
 * Large, tappable option tile used across the setup steps. Renders a title,
 * optional subtitle and a check indicator. Works for single- and multi-select.
 */
function OptionTile({
  attivo,
  onClick,
  titolo,
  sub,
  compatto,
}: {
  attivo: boolean;
  onClick: () => void;
  titolo: React.ReactNode;
  sub?: string;
  compatto?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={attivo}
      className={`flex w-full items-center gap-3 rounded-[var(--radius-card)] text-left text-black transition active:translate-y-[2px] ${
        compatto ? "px-4 py-3.5" : "px-5 py-4"
      } ${
        attivo
          ? "bg-lemon-card shadow-[inset_0_0_0_3px_#000]"
          : "bg-white shadow-[inset_0_0_0_2px_#000]"
      }`}
    >
      <span
        aria-hidden
        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-extrabold ${
          attivo ? "bg-black text-lemon-card" : "bg-black/10 text-transparent"
        }`}
      >
        ✓
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-titolo text-base font-extrabold uppercase leading-tight tracking-tight">
          {titolo}
        </span>
        {sub && (
          <span className="mt-0.5 block text-[0.72rem] font-semibold leading-tight text-black/55">
            {sub}
          </span>
        )}
      </span>
    </button>
  );
}

// Short helper descriptions to make the option steps feel richer.
const DESC_SOURCE: Record<ContentSourceMode, string> = {
  official_only: "Le carte ufficiali di Giallo-Aria",
  personal_only: "Solo i contenuti che hai creato tu",
  mixed: "Ufficiali e personali insieme",
};
const DESC_INT: Record<string, string> = {
  Tranquillo: "Serata soft",
  Divertente: "Il classico intramontabile",
  Audace: "Si alza un po' il tono",
  Caotico: "Senza freni",
};

export default function SetupWizard() {
  const router = useRouter();
  const params = useSearchParams();
  const preslug = (params.get("gioco") as GameSlug) || "impostore";

  const [slug, setSlug] = useState<GameSlug>(getGioco(preslug)?.giocabile ? preslug : "impostore");
  const [step, setStep] = useState(0);
  const [giocatori, setGiocatori] = useState<Giocatore[]>([]);
  const [nome, setNome] = useState("");
  const [errore, setErrore] = useState<string | null>(null);
  const [contentSource, setContentSource] = useState<ContentSourceMode>("official_only");
  const [intensita, setIntensita] = useState<Intensita>("Divertente");
  const [categorie, setCategorie] = useState<string[]>([]);
  const [round, setRound] = useState(5);
  const [numImpostori, setNumImpostori] = useState(1);
  const [timerDiscussione, setTimerDiscussione] = useState(0);
  const [indovinelloFinale, setIndovinelloFinale] = useState(true);
  const [votoPrivato, setVotoPrivato] = useState(false);
  const [punteggi, setPunteggi] = useState(true);
  const tuttiPersonali = useContenutiPersonali();
  // Obbligo o Verità
  const [ordine, setOrdine] = useState<OrdineGiocatori>("In ordine");
  const [modalita, setModalita] = useState<ModalitaOV>("Obbligo e Verità");
  const [senzaFine, setSenzaFine] = useState(false);
  const [timerAttivo, setTimerAttivo] = useState(true);
  const [timerDurata, setTimerDurata] = useState(30);
  const [comportamentoSkip, setComportamentoSkip] = useState<ComportamentoSkip>("Illimitati");
  const [maxSkip, setMaxSkip] = useState(3);
  const [alternativeSicure, setAlternativeSicure] = useState(true);
  const [senzaMovimento, setSenzaMovimento] = useState(false);
  // Indovina la parola
  const [gtwTimer, setGtwTimer] = useState(60);
  const [turniPerGiocatore, setTurniPerGiocatore] = useState(1);
  const [gtwSenzaFine, setGtwSenzaFine] = useState(false);
  const [conteggioIniziale, setConteggioIniziale] = useState(true);
  const [consentiSalto, setConsentiSalto] = useState(true);
  const [maxSalti, setMaxSalti] = useState(0);
  const [punteggioATempo, setPunteggioATempo] = useState(false);
  const categoriePersonaliTutte = useCategoriePersonali();

  const gioco = getGioco(slug)!;
  const isImpostore = slug === "impostore";
  const isOV = slug === "obbligo-o-verita";
  const isGTW = slug === "indovina-la-parola";

  // How many personal items exist for the selected game (drives the source step).
  const numPersonali = useMemo(
    () => tuttiPersonali.filter((c) => c.attivo && c.gameType === slug).length,
    [tuttiPersonali, slug],
  );

  // Keep the source mode valid if the user switches to a game without personal
  // content while "personal_only" was selected.
  if (numPersonali === 0 && contentSource === "personal_only") {
    setContentSource("official_only");
  }

  const passi = useMemo(
    () => ["Gioco", "Giocatori", "Contenuti", "Intensità", "Categorie", "Opzioni", "Riepilogo"],
    [],
  );

  function aggiungiGiocatore() {
    const n = nome.trim();
    if (!n) {
      setErrore(it.setup.nomeVuoto);
      return;
    }
    if (giocatori.some((g) => g.nome.toLowerCase() === n.toLowerCase())) {
      setErrore(it.setup.nomeDuplicato);
      return;
    }
    setGiocatori((g) => [
      ...g,
      { id: crypto.randomUUID(), nome: n, colore: COLORI[g.length % COLORI.length] },
    ]);
    setNome("");
    setErrore(null);
  }

  function avvia() {
    const config: ConfigPartita = {
      slug,
      giocatori,
      intensita,
      categorie,
      round,
      numImpostori: isImpostore ? numImpostori : undefined,
      timerDiscussione: isImpostore ? timerDiscussione : undefined,
      indovinelloFinale: isImpostore ? indovinelloFinale : undefined,
      votoPrivato: isOV ? undefined : votoPrivato,
      punteggi,
      contentSource,
      ...(isOV
        ? {
            ordine,
            modalita,
            senzaFine,
            timerAttivo,
            timerDurata,
            comportamentoSkip,
            maxSkip: comportamentoSkip === "Limitati" ? maxSkip : undefined,
            alternativeSicure,
            senzaMovimento,
          }
        : {}),
      ...(isGTW
        ? {
            timerAttivo: true,
            timerDurata: gtwTimer,
            turniPerGiocatore,
            senzaFine: gtwSenzaFine,
            conteggioIniziale,
            consentiSalto,
            maxSalti: consentiSalto ? maxSalti : 0,
            punteggioATempo,
          }
        : {}),
    };
    const sessionId = nuovoSessionId();
    salvaSessione({
      sessionId,
      slug,
      config,
      round: 1,
      usedContentIds: [],
      punteggi: Object.fromEntries(giocatori.map((g) => [g.id, 0])),
      aggiornata: Date.now(),
    });
    router.push(`/partita?sessionId=${sessionId}`);
  }

  const abbastanzaGiocatori = giocatori.length >= gioco.minGiocatori;
  const categoriePersonaliGTW = useMemo(
    () => categorieDi(categoriePersonaliTutte, "indovina-la-parola").map((c) => c.nome),
    [categoriePersonaliTutte],
  );
  const categorieDisponibili = isImpostore
    ? CATEGORIE_IMPOSTORE
    : isOV
      ? CATEGORIE_OV
      : isGTW
        ? [...CATEGORIE_INDOVINA_PAROLA, ...categoriePersonaliGTW]
        : slug === "indovina-chi"
          ? CATEGORIE_INDOVINA
          : slug === "parola-proibita"
            ? CATEGORIE_PROIBITE
            : [];

  // Indovina la parola: how many words are available with the chosen source +
  // categories, and how many the configured game needs. personal_only never
  // falls back to official words, so the pool can genuinely be too small.
  const gtwConfig: ConfigPartita = {
    slug,
    giocatori,
    intensita,
    categorie,
    round,
    turniPerGiocatore,
    senzaFine: gtwSenzaFine,
    consentiSalto,
    maxSalti: consentiSalto ? maxSalti : 0,
  };
  const gtwDisponibili = useMemo(() => {
    if (!isGTW) return 0;
    return costruisciPool(
      PAROLE_INDOVINA,
      personaliIndovinaParola(tuttiPersonali, true),
      contentSource,
      { categorie },
    ).length;
  }, [isGTW, tuttiPersonali, contentSource, categorie]);
  const gtwNecessarie = isGTW
    ? paroleNecessarie(Math.max(gioco.minGiocatori, giocatori.length), gtwConfig)
    : 0;
  const gtwParoleSufficienti = !isGTW || gtwDisponibili >= gtwNecessarie;

  const puoAvanzare =
    step !== 1 || abbastanzaGiocatori; // player step requires min players

  return (
    <main className="mx-auto max-w-2xl px-5 pb-28"> <header className="flex items-center justify-between py-6"> <Logo size="text-2xl" /> <span className="text-sm text-testo-morbido"> {it.setup.passo} {step + 1} {it.setup.di} {passi.length}
        </span> </header> {/* Progress */}
      <div className="mb-6 flex gap-1" aria-hidden> {passi.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i <= step ? "bg-giallo" : "on-light text-black bg-[var(--color-superficie-2)]"
            }`}
          /> ))}
      </div> <h1 className="mb-4 font-titolo text-2xl font-extrabold">{passi[step]}</h1> {step === 0 && (
        <div className="grid grid-cols-2 gap-3"> {GIOCHI.filter((g) => g.giocabile).map((g) => (
            <button key={g.slug} type="button" onClick={() => setSlug(g.slug)}> <Card
                className={`h-full text-left ${
                  slug === g.slug ? "ring-2 ring-giallo" : ""
                }`}
              > <h2 className="font-titolo text-lg font-extrabold uppercase leading-tight tracking-tight">{g.nome}</h2> <p className="mt-1 text-xs text-testo-morbido">{g.tagline}</p> </Card> </button> ))}
        </div> )}

      {step === 1 && (
        <div> <div className="flex gap-2"> <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && aggiungiGiocatore()}
              placeholder={it.setup.nomeGiocatore}
              aria-label={it.setup.nomeGiocatore}
              maxLength={20}
              className="min-h-[48px] flex-1 rounded-[var(--radius-pill)] bg-white px-4 font-semibold text-black shadow-[inset_0_0_0_2px_#000] placeholder:text-black/40"
            /> <Button variant="secondario" onClick={aggiungiGiocatore}> {it.azioni.aggiungi}
            </Button> </div> {errore && <p className="mt-2 text-sm text-corallo">{errore}</p>}
          <div className="mt-4 space-y-2"> {giocatori.map((g) => (
              <div
                key={g.id}
                className="on-light flex items-center gap-3 rounded-[var(--radius-card)] bg-white p-3 text-black shadow-[inset_0_0_0_2px_#000]"
              > <Avatar nome={g.nome} colore={g.colore} /> <span className="flex-1 font-semibold">{g.nome}</span> <button
                  type="button"
                  onClick={() => setGiocatori((arr) => arr.filter((x) => x.id !== g.id))}
                  aria-label={`Rimuovi ${g.nome}`}
                  className="text-testo-morbido hover:text-corallo"
                > ✕
                </button> </div> ))}
          </div> {giocatori.length > 1 && (
            <Button
              variant="fantasma"
              className="mt-3"
              onClick={() => setGiocatori((g) => mescola(g))}
            > {it.setup.mescola}
            </Button> )}
          {!abbastanzaGiocatori && (
            <p className="mt-3 text-sm text-testo-morbido"> {it.setup.minGiocatori(gioco.minGiocatori)}
            </p> )}
        </div> )}

      {step === 2 && (
        <div>
          <p className="mb-4 text-sm text-testo-morbido">
            Quali contenuti vuoi usare?
          </p>
          <div className="grid grid-cols-1 gap-3">
            {CONTENT_SOURCE_MODES.map((m) => {
              const disabilitato = m === "personal_only" && numPersonali === 0;
              return (
                <OptionTile
                  key={m}
                  attivo={contentSource === m}
                  onClick={() => !disabilitato && setContentSource(m)}
                  titolo={CONTENT_SOURCE_LABEL[m]}
                  sub={
                    disabilitato
                      ? "Non hai ancora creato contenuti per questo gioco."
                      : m === "official_only"
                        ? DESC_SOURCE[m]
                        : `${DESC_SOURCE[m]} · ${numPersonali} contenuti personali`
                  }
                />
              );
            })}
          </div>
          {numPersonali === 0 && (
            <Link
              href={`/contenuti-personali?gioco=${slug}`}
              className="mt-4 inline-block font-titolo text-sm font-extrabold uppercase tracking-wide text-lemon-card underline underline-offset-4"
            >
              Crea il primo contenuto
            </Link>
          )}
        </div> )}

      {step === 3 && (
        <div>
          <p className="mb-4 text-sm text-testo-morbido">Che atmosfera volete alla serata?</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {INTENSITA.map((i) => (
              <OptionTile key={i} attivo={intensita === i} onClick={() => setIntensita(i)} titolo={i} sub={DESC_INT[i]} />
            ))}
          </div>
        </div> )}

      {step === 4 && (
        <div>
          {categorieDisponibili.length === 0 ? (
            <p className="text-testo-morbido">Questa modalità non usa categorie.</p>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm text-testo-morbido">
                  {categorie.length === 0 ? it.setup.tutteCategorie : `${categorie.length} selezionate`}
                </p>
                <button
                  type="button"
                  onClick={() => setCategorie(categorie.length === 0 ? [...categorieDisponibili] : [])}
                  className="shrink-0 font-titolo text-xs font-extrabold uppercase tracking-wide text-lemon-card underline underline-offset-4"
                >
                  {categorie.length === 0 ? "Seleziona tutte" : "Azzera"}
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {categorieDisponibili.map((c) => (
                  <OptionTile
                    key={c}
                    compatto
                    attivo={categorie.includes(c)}
                    onClick={() =>
                      setCategorie((arr) => (arr.includes(c) ? arr.filter((x) => x !== c) : [...arr, c]))
                    }
                    titolo={c}
                  />
                ))}
              </div>
            </>
          )}
        </div> )}

      {step === 5 && (
        <div className="space-y-6"> {!(isOV && senzaFine) && !isGTW && (
            <div> <label className="font-semibold">{it.setup.round}: {round}</label> <input
                type="range"
                min={1}
                max={isOV ? 30 : 15}
                value={round}
                onChange={(e) => setRound(Number(e.target.value))}
                className="mt-2 w-full accent-[var(--color-giallo)]"
              /> </div> )}

          {isOV && (
            <> <div> <p className="mb-2 font-semibold">Ordine dei giocatori</p> <div className="grid grid-cols-2 gap-2.5"> {(["In ordine", "Casuale"] as OrdineGiocatori[]).map((o) => (
                    <OptionTile key={o} compatto attivo={ordine === o} onClick={() => setOrdine(o)} titolo={o} />
                  ))}
                </div> </div> <div> <p className="mb-2 font-semibold">Modalità</p> <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3"> {(["Obbligo e Verità", "Solo Obbligo", "Solo Verità"] as ModalitaOV[]).map((m) => (
                    <OptionTile key={m} compatto attivo={modalita === m} onClick={() => setModalita(m)} titolo={m} />
                  ))}
                </div> </div> <label className="flex items-center gap-3"> <input
                  type="checkbox"
                  checked={senzaFine}
                  onChange={(e) => setSenzaFine(e.target.checked)}
                  className="h-5 w-5 accent-[var(--color-giallo)]"
                /> <span>Modalità senza fine (fino allo stop manuale)</span> </label> <label className="flex items-center gap-3"> <input
                  type="checkbox"
                  checked={timerAttivo}
                  onChange={(e) => setTimerAttivo(e.target.checked)}
                  className="h-5 w-5 accent-[var(--color-giallo)]"
                /> <span>Abilita il timer per gli obblighi</span> </label> {timerAttivo && (
                <div> <p className="mb-2 font-semibold">Durata del timer</p> <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5"> {[10, 15, 30, 45, 60].map((t) => (
                      <OptionTile key={t} compatto attivo={timerDurata === t} onClick={() => setTimerDurata(t)} titolo={`${t}s`} />
                    ))}
                  </div> </div> )}
              <div> <p className="mb-2 font-semibold">Salti</p> <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3"> {(["Illimitati", "Limitati", "Con penalità"] as ComportamentoSkip[]).map((c) => (
                    <OptionTile key={c} compatto attivo={comportamentoSkip === c} onClick={() => setComportamentoSkip(c)} titolo={c} />
                  ))}
                </div> {comportamentoSkip === "Limitati" && (
                  <div className="mt-3"> <label className="text-sm text-testo-morbido"> Salti massimi per giocatore: {maxSkip}
                    </label> <input
                      type="range"
                      min={1}
                      max={10}
                      value={maxSkip}
                      onChange={(e) => setMaxSkip(Number(e.target.value))}
                      className="mt-1 w-full accent-[var(--color-giallo)]"
                    /> </div> )}
                <p className="mt-2 text-xs text-testo-morbido">{it.sicurezza.saltaSempre}</p> </div> <label className="flex items-center gap-3"> <input
                  type="checkbox"
                  checked={alternativeSicure}
                  onChange={(e) => setAlternativeSicure(e.target.checked)}
                  className="h-5 w-5 accent-[var(--color-giallo)]"
                /> <span>Consenti alternative sicure alle sfide</span> </label> <label className="flex items-center gap-3"> <input
                  type="checkbox"
                  checked={senzaMovimento}
                  onChange={(e) => setSenzaMovimento(e.target.checked)}
                  className="h-5 w-5 accent-[var(--color-giallo)]"
                /> <span>Mostra solo sfide senza movimento (accessibilità)</span> </label> </> )}

          {isImpostore && (
            <> <div> <p className="mb-2 font-semibold">Numero di impostori</p> <div className="grid grid-cols-2 gap-2.5"> {[1, 2].map((n) => (
                    <OptionTile key={n} compatto attivo={numImpostori === n} onClick={() => setNumImpostori(n)} titolo={`${n} ${n > 1 ? "impostori" : "impostore"}`} />
                  ))}
                </div> </div> <div> <p className="mb-2 font-semibold">Timer di discussione</p> <div className="grid grid-cols-2 gap-2.5"> {[0, 60, 120, 180].map((t) => (
                    <OptionTile key={t} compatto attivo={timerDiscussione === t} onClick={() => setTimerDiscussione(t)} titolo={t === 0 ? "Nessuno" : `${t / 60} min`} />
                  ))}
                </div> </div> <label className="flex items-center gap-3"> <input
                  type="checkbox"
                  checked={indovinelloFinale}
                  onChange={(e) => setIndovinelloFinale(e.target.checked)}
                  className="h-5 w-5 accent-[var(--color-giallo)]"
                /> <span>Ultima possibilità per l&apos;impostore di indovinare</span> </label> </> )}

          {isGTW && (
            <>
              <div>
                <p className="mb-2 font-semibold">{it.gtw.quantoTempo}</p>
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
                  {[30, 45, 60, 90, 120].map((t) => (
                    <OptionTile key={t} compatto attivo={gtwTimer === t} onClick={() => setGtwTimer(t)} titolo={`${t}s`} />
                  ))}
                </div>
              </div>
              {!gtwSenzaFine && (
                <div>
                  <p className="mb-2 font-semibold">{it.gtw.quantiTurni}</p>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[1, 2, 3].map((n) => (
                      <OptionTile key={n} compatto attivo={turniPerGiocatore === n} onClick={() => setTurniPerGiocatore(n)} titolo={`${n} ${n > 1 ? "turni" : "turno"}`} />
                    ))}
                  </div>
                </div>
              )}
              <label className="flex items-center gap-3"> <input type="checkbox" checked={gtwSenzaFine} onChange={(e) => setGtwSenzaFine(e.target.checked)} className="h-5 w-5 accent-[var(--color-giallo)]" /> <span>Modalità senza fine (fino allo stop manuale)</span> </label>
              <label className="flex items-center gap-3"> <input type="checkbox" checked={conteggioIniziale} onChange={(e) => setConteggioIniziale(e.target.checked)} className="h-5 w-5 accent-[var(--color-giallo)]" /> <span>Conto alla rovescia prima di iniziare (3-2-1)</span> </label>
              <label className="flex items-center gap-3"> <input type="checkbox" checked={consentiSalto} onChange={(e) => setConsentiSalto(e.target.checked)} className="h-5 w-5 accent-[var(--color-giallo)]" /> <span>Consenti di saltare la parola</span> </label>
              {consentiSalto && (
                <div>
                  <label className="text-sm text-testo-morbido">Salti massimi per giocatore: {maxSalti === 0 ? "illimitati" : maxSalti}</label>
                  <input type="range" min={0} max={10} value={maxSalti} onChange={(e) => setMaxSalti(Number(e.target.value))} className="mt-1 w-full accent-[var(--color-giallo)]" />
                </div>
              )}
              <label className="flex items-center gap-3"> <input type="checkbox" checked={punteggioATempo} onChange={(e) => setPunteggioATempo(e.target.checked)} className="h-5 w-5 accent-[var(--color-giallo)]" /> <span>Punteggio in base al tempo rimasto</span> </label>
            </>
          )}

          {!isOV && !isGTW && (
            <label className="flex items-center gap-3"> <input
                type="checkbox"
                checked={votoPrivato}
                onChange={(e) => setVotoPrivato(e.target.checked)}
                className="h-5 w-5 accent-[var(--color-giallo)]"
              /> <span>Voto privato (uno alla volta) invece che di gruppo</span> </label> )}
          <label className="flex items-center gap-3"> <input
              type="checkbox"
              checked={punteggi}
              onChange={(e) => setPunteggi(e.target.checked)}
              className="h-5 w-5 accent-[var(--color-giallo)]"
            /> <span>Tieni i punteggi</span> </label> <Link
            href="/contenuti-personali"
            className="inline-block font-titolo text-sm font-extrabold uppercase tracking-wide text-lemon-card underline underline-offset-4"
          > Gestisci i miei contenuti
          </Link> </div> )}

      {step === 6 && (
        <Card className="space-y-3"> <span className="font-titolo text-2xl font-extrabold uppercase tracking-tight">{gioco.nome}</span> <div className="flex flex-wrap gap-2"> <Badge colore="cielo">{giocatori.length} giocatori</Badge> <Badge colore="menta">{CONTENT_SOURCE_LABEL[contentSource]}</Badge> <Badge colore="corallo">{intensita}</Badge> <Badge colore="viola">{round} round</Badge> </div> <div className="flex flex-wrap gap-2 pt-1"> {giocatori.map((g) => (
              <span key={g.id} className="flex items-center gap-1.5 text-sm"> <Avatar nome={g.nome} colore={g.colore} /> {g.nome}
              </span> ))}
          </div> <p className="pt-2 text-xs text-testo-morbido">{it.sicurezza.saltaSempre}</p> </Card> )}

      {step === 6 && isGTW && !gtwParoleSufficienti && (
        <Card className="mt-4 border-corallo">
          <p className="font-semibold text-corallo">
            {it.gtw.servonoParole(gtwNecessarie, gtwDisponibili)}
          </p>
          <ul className="mt-3 space-y-1 text-sm text-testo-morbido">
            <li>• {it.gtw.aggiungiParole}</li>
            <li>• {it.gtw.riduciTurni}</li>
            {contentSource === "personal_only" && <li>• {it.gtw.usaAncheUfficiali}</li>}
          </ul>
          <Link
            href={`/contenuti-personali?gioco=${slug}`}
            className="mt-4 inline-block font-titolo text-sm font-extrabold uppercase tracking-wide text-lemon-card underline underline-offset-4"
          >
            {it.gtw.aggiungiParole}
          </Link>
        </Card>
      )}

      {/* Footer nav */}
      <div className="fixed inset-x-0 bottom-0 border-t-2 border-white/20 bg-black px-5 py-4" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}> <div className="mx-auto flex max-w-2xl gap-3"> <Button
            variant="morbido"
            onClick={() => (step === 0 ? router.push("/giochi") : setStep((s) => s - 1))}
          > {it.azioni.indietro}
          </Button> {step < passi.length - 1 ? (
            <Button
              variant="primario"
              fullWidth
              disabled={!puoAvanzare}
              onClick={() => setStep((s) => s + 1)}
            > {it.azioni.avanti}
            </Button> ) : (
            <Button variant="primario" fullWidth disabled={!abbastanzaGiocatori || !gtwParoleSufficienti} onClick={avvia}> {it.azioni.inizia}
            </Button> )}
        </div> </div> </main> );
}

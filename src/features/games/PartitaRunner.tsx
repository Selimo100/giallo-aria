"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Logo } from "@/components/ui";
import { it } from "@/messages/it";
import { caricaSessione, eliminaSessione, type SessionePubblica } from "@/lib/local-storage/session";
import GiocoImpostore from "@/features/games/impostor/GiocoImpostore";
import GiocoProbabile from "@/features/games/most-likely/GiocoProbabile";
import GiocoObbligoVerita from "@/features/games/truth-or-dare/GiocoObbligoVerita";
import GiocoPreferiresti from "@/features/games/would-you-rather/GiocoPreferiresti";
import GiocoNonHoMai from "@/features/games/never-have-i-ever/GiocoNonHoMai";
import GiocoSfide from "@/features/games/challenges/GiocoSfide";
import GiocoCategorie from "@/features/games/categories/GiocoCategorie";
import GiocoIndovinaChi from "@/features/games/guess-who/GiocoIndovinaChi";
import GiocoParolaProibita from "@/features/games/forbidden-word/GiocoParolaProibita";
import GiocoIndovinaParola from "@/features/games/guess-the-word/GiocoIndovinaParola";

// Empty subscribe: the session in localStorage does not change under us while
// this screen is mounted; we only need the one-time client-side read (and a
// stable server snapshot of `undefined` to avoid hydration mismatch).
const subscribe = () => () => {};

// getSnapshot must be referentially stable across calls, so cache the one-time
// read per sessionId (useSyncExternalStore throws if the snapshot keeps changing).
let snapCache: { id: string; value: SessionePubblica | null } | null = null;
function readSnapshot(sessionId: string): SessionePubblica | null {
  if (snapCache?.id !== sessionId) {
    const s = caricaSessione();
    snapCache = { id: sessionId, value: s && s.sessionId === sessionId ? s : null };
  }
  return snapCache.value;
}

export default function PartitaRunner({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [avviata, setAvviata] = useState(false);

  // undefined = not yet read on the client (SSR/first paint) -> "restoring".
  const sessione = useSyncExternalStore<SessionePubblica | null | undefined>(
    subscribe,
    () => readSnapshot(sessionId),
    () => undefined,
  );

  if (sessione === undefined) {
    return <div className="p-10 text-center text-testo-morbido">{it.comune.caricamento}</div>;
  }

  if (!sessione) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center px-5 text-center"> <Logo /> <Card className="mt-6"> <h1 className="font-titolo text-xl font-bold">{it.ripristino.errore}</h1> <p className="mt-2 text-testo-morbido"> Questa partita non è disponibile su questo dispositivo.
          </p> <Button className="mt-6" variant="primario" onClick={() => router.push("/partita/nuova")}> Nuova partita
          </Button> </Card> </main> );
  }

  // Safe restoration: never show the previous private card. Require an explicit
  // "Riprendi" before entering the game, which always starts on a neutral screen.
  if (!avviata) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center px-5 text-center"> <div className="anim-entra">  <h1 className="mt-4 font-titolo text-2xl font-extrabold">{it.ripristino.titolo}</h1> <p className="mt-3 text-testo-morbido">{it.ripristino.messaggio}</p> <p className="mt-1 text-sm text-testo-morbido"> {it.comune.round} {sessione.round} · {sessione.config.giocatori.length} giocatori
          </p> <div className="mt-8 flex flex-col gap-3"> <Button variant="primario" onClick={() => setAvviata(true)}> {it.ripristino.riprendi}
            </Button> <Button
              variant="fantasma"
              onClick={() => {
                eliminaSessione();
                router.push("/giochi");
              }}
            > {it.ripristino.elimina}
            </Button> </div> </div> </main> );
  }

  switch (sessione.slug) {
    case "impostore":
      return <GiocoImpostore sessione={sessione} />;
    case "chi-e-piu-probabile":
      return <GiocoProbabile sessione={sessione} />;
    case "obbligo-o-verita":
      return <GiocoObbligoVerita sessione={sessione} />;
    case "indovina-la-parola":
      return <GiocoIndovinaParola sessione={sessione} />;
    case "preferiresti":
      return <GiocoPreferiresti sessione={sessione} />;
    case "non-ho-mai":
      return <GiocoNonHoMai sessione={sessione} />;
    case "sfide":
      return <GiocoSfide sessione={sessione} />;
    case "categorie":
      return <GiocoCategorie sessione={sessione} />;
    case "indovina-chi":
      return <GiocoIndovinaChi sessione={sessione} />;
    case "parola-proibita":
      return <GiocoParolaProibita sessione={sessione} />;
    default:
      return (
        <div className="p-10 text-center text-testo-morbido"> Questa modalità non è ancora giocabile.
        </div> );
  }
}

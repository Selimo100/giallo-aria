"use client";

import { useState } from "react";
import { Button, Avatar } from "@/components/ui";
import { it } from "@/messages/it";
import type { Giocatore } from "@/types/domain";

type Fase = "transizione" | "rivelato";

/**
 * Reusable private-reveal flow for the shared device.
 * Flow: transition ("pass to X") -> reveal (secret shown) -> hide -> onDone.
 * The secret content lives only in the render children while `rivelato`;
 * once hidden it is removed from the DOM entirely (no lingering, no a11y leak).
 */
export function PassaTelefono({
  giocatore,
  children,
  onDone,
  etichettaFine = it.azioni.hoCapito,
}: {
  giocatore: Giocatore;
  children: React.ReactNode;
  onDone: () => void;
  etichettaFine?: string;
}) {
  const [fase, setFase] = useState<Fase>("transizione");

  if (fase === "transizione") {
    return (
      <div className="anim-entra flex flex-col items-center text-center"> <div className="anim-galleggia mb-6"> <Avatar nome={giocatore.nome} colore={giocatore.colore} /> </div> <h2 className="font-titolo text-2xl font-extrabold"> {it.reveal.passaA(giocatore.nome)}
        </h2> <p className="mt-3 text-testo-morbido">{it.reveal.nessunoGuardi}</p> <p className="mt-1 text-sm text-testo-morbido"> {it.reveal.soloPuo(giocatore.nome)}
        </p> <Button className="mt-8" variant="primario" onClick={() => setFase("rivelato")}> {it.reveal.mostraCarta}
        </Button> <p className="mt-3 text-xs text-testo-morbido">{it.reveal.toccaQuandoPronto}</p> </div> );
  }

  // rivelato — secret is visible only here
  return (
    <div className="anim-entra flex flex-col items-center text-center"> {children}
      <Button className="mt-8" variant="secondario" onClick={onDone}> {etichettaFine}
      </Button> </div> );
}

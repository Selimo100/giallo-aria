"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { it } from "@/messages/it";

/**
 * Manual-start countdown. Never starts automatically. Provides a visual (non
 * audio) completion signal. To reset it for a new prompt, give it a fresh
 * `key` from the caller so it remounts (no derived-state effects needed).
 */
export function Timer({ durata }: { durata: number }) {
  const [rimasti, setRimasti] = useState(durata);
  const [attivo, setAttivo] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (ref.current) clearInterval(ref.current); }, []);

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
  const min = Math.floor(rimasti / 60);
  const sec = (rimasti % 60).toString().padStart(2, "0");

  return (
    <div className="flex flex-col items-center gap-3"> <div
        role="timer"
        aria-live="off"
        aria-label={`Tempo rimanente ${rimasti} secondi`}
        className={`font-titolo text-5xl font-extrabold tabular-nums ${finito ? "text-corallo" : ""}`}
      > {min}:{sec}
      </div> <Button variant="morbido" onClick={toggle}> {attivo ? it.ov.fermaTimer : finito ? "Tempo scaduto" : it.ov.avviaTimer}
      </Button> </div> );
}

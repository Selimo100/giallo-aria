import Link from "next/link";
import { PlayingCard } from "@/components/ui";
import type { GameMode } from "@/types/domain";
import { CARD_STYLE } from "./cardStyle";

// A dealt game card: big stacked title, large mode number, minimal metadata.
export function GameCard({ gioco, numero }: { gioco: GameMode; numero: number }) {
  const stile = CARD_STYLE[gioco.slug];
  const numeroLabel = numero.toString().padStart(2, "0");

  return (
    <Link
      href={`/giochi/${gioco.slug}`}
      className="block focus-visible:outline-none"
      aria-label={gioco.nome}
    > <PlayingCard
        variant={stile.variant}
        rotate={stile.rotate}
        interactive
        className="flex h-full min-h-[13rem] flex-col justify-between"
      > <div className="flex items-start justify-between gap-2"> <span className="font-titolo text-sm font-extrabold tabular-nums opacity-70"> {numeroLabel}
          </span> {!gioco.giocabile && (
            <span className="rounded-[var(--radius-pill)] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide shadow-[inset_0_0_0_2px_currentColor]"> In arrivo
            </span> )}
        </div> <h3 className="font-titolo font-extrabold uppercase leading-[0.92] tracking-tight text-[clamp(1.75rem,7vw,2.5rem)]"> {stile.titolo.map((riga, i) => (
            <span key={i} className="block"> {riga}
            </span> ))}
        </h3> <p className="font-titolo text-xs font-bold uppercase tracking-wide opacity-70"> {gioco.minGiocatori}–{gioco.maxGiocatori} giocatori
        </p> </PlayingCard> </Link> );
}

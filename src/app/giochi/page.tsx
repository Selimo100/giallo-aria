import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, Logo, PlayingCard } from "@/components/ui";
import { GameCard } from "@/features/games/GameCard";
import { GIOCHI } from "@/features/games/registry";

export const metadata: Metadata = { title: "Giochi" };

const UTILITY = [
  { href: "/contenuti-personali", label: "I TUOI CONTENUTI" },
  { href: "/giochi", label: "COSA GIOCHIAMO?" },
  { href: "/contenuti-personali", label: "PREFERITI" },
  { href: "/informazioni", label: "IMPOSTAZIONI" },
];

export default function GiochiPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[1200px] flex-col px-5 pb-20">
      <header className="flex items-start justify-between gap-4 py-5 sm:items-center sm:py-6">
        <Logo size="sm" priority className="max-w-[min(56vw,172px)] sm:max-w-none" />
        <Link
          href="/giochi"
          className="shrink-0 rounded-[var(--radius-control)] px-4 py-2 font-titolo text-sm font-extrabold uppercase tracking-wide text-white shadow-[inset_0_0_0_2px_#fff] transition active:translate-y-[2px] active:bg-white active:text-black"
        >
          Menu
        </Link>
      </header>

      <section className="anim-entra pt-8 sm:pt-12">
        <h1 className="font-titolo font-extrabold uppercase leading-[0.9] tracking-tight text-[clamp(3rem,15vw,6.5rem)]">
          <span className="block">Cosa</span>
          <span className="block text-lemon-card">giochiamo?</span>
        </h1>
        <p className="mt-6 font-titolo text-lg font-bold uppercase tracking-wide text-testo-morbido">
          Un telefono. Tutti insieme.
        </p>
        <div className="mt-8 max-w-sm">
          <ButtonLink href="/partita/nuova" variant="secondario" fullWidth>
            Inizia una partita
          </ButtonLink>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="mb-6 font-titolo text-2xl font-extrabold uppercase tracking-tight">
          Scegli un gioco
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {GIOCHI.map((g, i) => (
            <GameCard key={g.slug} gioco={g} numero={i + 1} />
          ))}
        </div>
      </section>

      <footer className="mt-20 border-t-2 border-white/15 pt-6 text-sm text-testo-morbido">
        <div className="flex flex-wrap gap-5 font-titolo font-bold tracking-wide">
          <p>Built by Selina Mogicato</p>
        </div>
        <p className="mt-4">© {new Date().getFullYear()} Giallo-Aria</p>
      </footer>
    </main>
  );
}

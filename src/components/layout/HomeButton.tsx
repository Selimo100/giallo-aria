"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Persistent floating button to return to the home screen at any time.
// Hidden on the home page (redundant) and on the setup wizard, which has its
// own fixed bottom navigation bar it would overlap.
const NASCOSTO = ["/", "/giochi", "/partita/nuova"];

export function HomeButton() {
  // trailingSlash: true means pathname can arrive as "/partita/nuova/".
  const pathname = usePathname().replace(/(.)\/$/, "$1");
  if (NASCOSTO.includes(pathname)) return null;

  return (
    <Link
      href="/"
      aria-label="Torna alla schermata iniziale"
      title="Home"
      className="fixed right-4 top-4 z-50 flex h-12 items-center justify-center rounded-[var(--radius-control)] bg-white px-4 font-titolo text-xs font-extrabold uppercase tracking-wide text-black shadow-[inset_0_0_0_2px_#000] transition active:translate-y-[2px]"
      style={{
        top: "max(1rem, env(safe-area-inset-top))",
        right: "max(1rem, env(safe-area-inset-right))",
      }}
    >
      Inizio
    </Link>
  );
}

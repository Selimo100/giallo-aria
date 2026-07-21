"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Persistent floating shortcut to the user's own content library, reachable
// from anywhere. Hidden on the home page, the setup wizard (own bottom bar) and
// the content page itself. Sits just below the home button.
const NASCOSTO = ["/", "/partita/nuova", "/contenuti-personali", "/ricordi"];

export function ContentButton() {
  const pathname = usePathname();
  if (NASCOSTO.includes(pathname)) return null;

  return (
    <div
      className="fixed right-4 z-50 flex flex-col items-end gap-3"
      style={{
        top: "calc(max(1rem, env(safe-area-inset-top)) + 3.5rem)",
        right: "max(1rem, env(safe-area-inset-right))",
      }}
    >
      <Link
        href="/contenuti-personali"
        aria-label="Apri i miei contenuti"
        title="I miei contenuti"
        className="flex h-12 items-center justify-center rounded-[var(--radius-control)] bg-lemon-card px-4 font-titolo text-xs font-extrabold uppercase tracking-wide text-black shadow-[inset_0_0_0_2px_#000] transition active:translate-y-[2px]"
      >
        Tue parole
      </Link>
      <Link
        href="/ricordi"
        aria-label="Apri i nostri ricordi"
        title="I nostri ricordi"
        className="flex min-h-[44px] items-center justify-center rounded-[var(--radius-control)] bg-white px-4 font-titolo text-[11px] font-extrabold uppercase tracking-wide text-black shadow-[inset_0_0_0_2px_#000] transition active:translate-y-[2px]"
      >
        Ricordi
      </Link>
    </div>
  );
}

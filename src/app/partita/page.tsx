"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PartitaRunner from "@/features/games/PartitaRunner";

function PartitaPageInner() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center px-5 text-center text-testo-morbido">
        Nessuna partita da ripristinare.
      </main>
    );
  }

  return <PartitaRunner sessionId={sessionId} />;
}

export default function PartitaPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center px-5 text-center text-testo-morbido">
          Caricamento...
        </main>
      }
    >
      <PartitaPageInner />
    </Suspense>
  );
}

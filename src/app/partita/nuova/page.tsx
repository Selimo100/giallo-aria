import { Suspense } from "react";
import SetupWizard from "@/features/games/SetupWizard";

export default function NuovaPartitaPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-testo-morbido">Caricamento…</div>}>
      <SetupWizard />
    </Suspense>
  );
}

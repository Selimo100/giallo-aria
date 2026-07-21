import type { Metadata } from "next";
export const metadata: Metadata = { title: "Termini" };

export default function TerminiPage() {
  return (
    <>
      <h1 className="font-titolo text-3xl font-extrabold">Termini di utilizzo</h1>
      <p className="text-sm text-corallo">
        Modello di progetto: richiede una revisione legale prima dell&apos;uso reale.
      </p>
      <p>
        Giallo-Aria è un&apos;applicazione di giochi da festa da usare con
        responsabilità. Ogni giocatore può saltare qualsiasi domanda o sfida in
        ogni momento, senza dover dare spiegazioni.
      </p>
      <p>
        Scegli i contenuti adatti al tuo gruppo e gioca con rispetto. È vietato
        utilizzare l&apos;app per attività illegali, pericolose o lesive della
        dignità delle persone.
      </p>
    </>
  );
}

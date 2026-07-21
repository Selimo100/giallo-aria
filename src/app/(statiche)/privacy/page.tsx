import type { Metadata } from "next";
export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <>
      <h1 className="font-titolo text-3xl font-extrabold">Informativa sulla privacy</h1>
      <p className="text-sm text-corallo">
        Modello di progetto: richiede una revisione legale prima dell&apos;uso
        reale. Non costituisce consulenza legale.
      </p>
      <p>
        Giallo-Aria è progettato secondo il principio della privacy by design.
        Per giocare non è necessario alcun account: i nomi dei giocatori restano
        sul dispositivo e non vengono inviati ad alcun server.
      </p>
      <h2 className="font-titolo text-xl font-bold">Dati che restano locali</h2>
      <p>
        Nomi dei giocatori, impostazioni della partita, punteggi e stato del gioco
        in corso sono salvati solo nella memoria locale del browser
        (localStorage). I segreti di gioco (parola dell&apos;Impostore, ruoli) non
        vengono salvati in forma leggibile.
      </p>
      <h2 className="font-titolo text-xl font-bold">Dati inviati al server</h2>
      <p>
        Solo se crei un account: email e contenuti che decidi di salvare o
        condividere. Puoi eliminare l&apos;account e i contenuti in qualsiasi
        momento.
      </p>
    </>
  );
}

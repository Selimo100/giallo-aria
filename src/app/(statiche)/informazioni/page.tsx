import type { Metadata } from "next";
export const metadata: Metadata = { title: "Informazioni" };

export default function InformazioniPage() {
  return (
    <> <h1 className="font-titolo text-3xl font-extrabold">Informazioni</h1> <p> Giallo-Aria è una piattaforma di giochi da festa pensata per un solo
        telefono condiviso. Amici, famiglie e gruppi possono giocare insieme
        passandosi il dispositivo, senza stanze online né secondi telefoni.
      </p> <p> Tutti i contenuti sono originali e in italiano, con livelli di
        difficoltà e intensità configurabili. Puoi giocare con i contenuti del
        gioco, con i tuoi contenuti personali, oppure con entrambi.
      </p> <p className="text-testo-morbido">Giochi, risate e un soffio di follia. </p> </> );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink, Card, Badge, Logo, PlayingCard } from "@/components/ui";
import { GIOCHI, getGioco } from "@/features/games/registry";
import { CARD_STYLE } from "@/features/games/cardStyle";

export function generateStaticParams() {
  return GIOCHI.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const g = getGioco(slug);
  return { title: g?.nome ?? "Gioco" };
}

export default async function GiocoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const g = getGioco(slug);
  if (!g) notFound();

  const stile = CARD_STYLE[g.slug];

  return (
    <main className="mx-auto max-w-xl px-5 pb-16">
      <header className="flex items-center justify-between py-6">
        <Link href="/giochi"><Logo size="text-xl" /></Link>
      </header>

      <div className="anim-entra mx-auto max-w-[16rem]">
        <PlayingCard variant={stile.variant} rotate={stile.rotate} className="min-h-[15rem] flex flex-col justify-between">
          <span className="font-titolo text-sm font-extrabold opacity-70">{g.nome}</span>
          <h1 className="font-titolo font-extrabold uppercase leading-[0.92] tracking-tight text-[clamp(2rem,9vw,3rem)]">
            {stile.titolo.map((r, i) => <span key={i} className="block">{r}</span>)}
          </h1>
          <p className="font-titolo text-xs font-bold uppercase tracking-wide opacity-70">
            {g.minGiocatori}–{g.maxGiocatori} giocatori
          </p>
        </PlayingCard>
      </div>

      <div className="mt-6 flex justify-center gap-2">
        {g.giocabile ? (
          <Badge colore="menta">Giocabile ora</Badge>
        ) : (
          <Badge colore="viola">In arrivo</Badge>
        )}
      </div>

      <Card className="mt-8">
        <h2 className="font-titolo text-lg font-bold">Come si gioca</h2>
        <p className="mt-2 text-testo-morbido">{g.descrizione}</p>
      </Card>

      <div className="mt-8">
        {g.giocabile ? (
          <ButtonLink href={`/partita/nuova?gioco=${g.slug}`} variant="primario" fullWidth>
            Prepara la partita
          </ButtonLink>
        ) : (
          <Card className="text-center text-testo-morbido">
            Questa modalità sarà presto disponibile su Giallo-Aria. Nel frattempo
            prova L&apos;Impostore o Chi è più probabile?.
          </Card>
        )}
      </div>
    </main>
  );
}

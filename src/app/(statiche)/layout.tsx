import { Logo } from "@/components/ui";

export default function StaticheLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-2xl px-5 pb-16">
      <header className="py-6">
        <Logo size="text-2xl" />
      </header>
      <article className="prose-testo space-y-4 leading-relaxed">{children}</article>
    </main>
  );
}

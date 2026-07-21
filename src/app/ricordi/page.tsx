import Link from "next/link";
import { Logo } from "@/components/ui";
import { MemoryExperience } from "@/features/memories/components/MemoryExperience";

export default function RicordiPage() {
  return (
    <main className="mx-auto max-w-6xl px-5 pb-24">
      <header className="flex items-center justify-between py-6">
        <Logo size="text-2xl" />
      </header>

      <section className="max-w-2xl">
        <p className="font-titolo text-xs font-extrabold uppercase tracking-[0.3em] text-lemon-card">
          Giallo-Aria
        </p>
        <h1 className="mt-4 font-titolo text-5xl font-extrabold uppercase leading-[0.88] tracking-tight text-white sm:text-6xl">
          I nostri
          <span className="block text-lemon-card">ricordi</span>
        </h1>
        <p className="mt-4 max-w-xl text-base text-white/75">
          Foto, video e pensieri dei momenti vissuti insieme.
        </p>
      </section>

      <div className="mt-10">
        <MemoryExperience />
      </div>
    </main>
  );
}

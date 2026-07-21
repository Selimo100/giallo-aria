import { memoryMedia, type MemoryMediaItem } from "@/features/memories/data/memory-media";

const VALID_ASPECT_RATIOS = new Set(["16/9", "4/3", "1/1", "9/16", "3/4"]);

export function validateMemoryMedia(items: MemoryMediaItem[]): string[] {
  const ids = new Set<string>();
  const errors: string[] = [];

  for (const item of items) {
    if (!item.id.trim()) errors.push("Ogni ricordo multimediale deve avere un id.");
    if (ids.has(item.id)) errors.push(`Id duplicato: ${item.id}`);
    ids.add(item.id);

    if (item.aspectRatio && !VALID_ASPECT_RATIOS.has(item.aspectRatio)) {
      errors.push(`Aspect ratio non supportato per ${item.id}: ${item.aspectRatio}`);
    }

    if (item.type === "image") {
      if (!item.src.startsWith("/media/ricordi/")) {
        errors.push(`L'immagine ${item.id} deve stare sotto /media/ricordi/.`);
      }
      if (!item.alt.trim()) {
        errors.push(`L'immagine ${item.id} deve avere un alt descrittivo.`);
      }
      continue;
    }

    if (!item.title.trim()) {
      errors.push(`Il video ${item.id} deve avere un titolo.`);
    }
    if (item.sources.length === 0) {
      errors.push(`Il video ${item.id} deve avere almeno una sorgente.`);
    }
    for (const source of item.sources) {
      if (!source.src.startsWith("/media/ricordi/videos/")) {
        errors.push(`La sorgente ${source.src} del video ${item.id} deve stare in /media/ricordi/videos/.`);
      }
    }
    for (const track of item.tracks ?? []) {
      if (!track.src.startsWith("/media/ricordi/tracks/")) {
        errors.push(`La traccia ${track.src} del video ${item.id} deve stare in /media/ricordi/tracks/.`);
      }
    }
    if (item.poster && !item.poster.startsWith("/media/ricordi/posters/")) {
      errors.push(`Il poster ${item.poster} del video ${item.id} deve stare in /media/ricordi/posters/.`);
    }
  }

  return errors;
}

export function getMemoryMediaById(id: string | null | undefined): MemoryMediaItem | null {
  if (!id) return null;
  return memoryMedia.find((item) => item.id === id) ?? null;
}

export function getMemoryMediaLabel(item: MemoryMediaItem): string {
  const base = item.type === "image" ? item.caption || "Foto senza didascalia" : item.title;
  return [item.type === "image" ? "Foto" : "Video", base].join(" — ");
}

export function sortMemoryNotes<T extends { created_at: string }>(notes: T[]): T[] {
  return [...notes].sort(
    (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
  );
}

export function formatMemoryNoteDate(value: string): string {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function memoryMediaValidationErrors(): string[] {
  return validateMemoryMedia(memoryMedia);
}

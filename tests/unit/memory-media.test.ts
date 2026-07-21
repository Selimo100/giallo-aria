import { describe, expect, it } from "vitest";
import {
  formatMemoryNoteDate,
  getMemoryMediaById,
  getMemoryMediaLabel,
  sortMemoryNotes,
  validateMemoryMedia,
} from "@/features/memories/lib/memory-media";
import { memoryMedia, type MemoryMediaItem } from "@/features/memories/data/memory-media";
import { validateMemoryNoteInput } from "@/features/memories/lib/memory-notes";

describe("memory media", () => {
  it("valida la configurazione reale senza errori", () => {
    expect(validateMemoryMedia(memoryMedia)).toEqual([]);
  });

  it("gestisce il discriminated union di immagini e video", () => {
    const labels = memoryMedia.map((item) => getMemoryMediaLabel(item));
    expect(labels.some((label) => label.startsWith("Foto"))).toBe(true);
    expect(labels.some((label) => label.startsWith("Video"))).toBe(true);
  });

  it("trova un media per id", () => {
    expect(getMemoryMediaById("memory-photo-01")?.type).toBe("image");
    expect(getMemoryMediaById("missing-id")).toBeNull();
  });

  it("segnala configurazioni video non valide", () => {
    const items: MemoryMediaItem[] = [
      {
        id: "bad-video",
        type: "video",
        title: "",
        sources: [],
      },
    ];
    expect(validateMemoryMedia(items)).not.toEqual([]);
  });
});

describe("memory notes", () => {
  it("accetta una nota valida con media collegato", () => {
    expect(
      validateMemoryNoteInput({
        title: "Un titolo",
        body: "Un ricordo scritto bene.",
        mediaId: "memory-photo-01",
      }),
    ).toBeNull();
  });

  it("rifiuta un media id sconosciuto", () => {
    expect(
      validateMemoryNoteInput({
        body: "Ricordo valido",
        mediaId: "qualcosa-di-sconosciuto",
      }),
    ).toBe("Il momento collegato selezionato non è valido.");
  });

  it("ordina le note dalla più recente", () => {
    const sorted = sortMemoryNotes([
      { created_at: "2026-06-01T10:00:00.000Z", id: "a" },
      { created_at: "2026-06-02T10:00:00.000Z", id: "b" },
    ]);
    expect(sorted.map((item) => item.id)).toEqual(["b", "a"]);
  });

  it("formatta la data in italiano", () => {
    expect(formatMemoryNoteDate("2026-06-03T21:15:00.000Z").toLowerCase()).toContain("giugno");
  });
});

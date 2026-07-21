// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryExperience } from "@/features/memories/components/MemoryExperience";
import { addLocalMemoryNote } from "@/lib/local-storage/memory-notes";

// The memory experience is fully static: hardcoded media plus private notes
// persisted in the browser's localStorage. No backend, no fetch, no props.
describe("MemoryExperience", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("renderizza una galleria mista di foto e video", () => {
    render(<MemoryExperience />);
    expect(screen.getByText("Foto e video")).toBeInTheDocument();
    expect(screen.getAllByText(/foto|video/i).length).toBeGreaterThan(1);
  });

  it("apre e chiude il dialog del media", async () => {
    render(<MemoryExperience />);
    fireEvent.click(screen.getAllByRole("button", { name: /apri/i })[0]);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Chiudi" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("mostra all'avvio le note già salvate localmente", () => {
    addLocalMemoryNote({ body: "Testo della nota", mediaId: "memory-photo-01", title: "Ricordo" });
    render(<MemoryExperience />);
    expect(screen.getByText("Ricordo")).toBeInTheDocument();
    expect(screen.getByText("Testo della nota")).toBeInTheDocument();
  });

  it("mostra il fallback quando il media collegato non esiste più", () => {
    // A note whose linked media id is no longer part of the bundled gallery.
    window.localStorage.setItem(
      "giallo-aria:memory-notes",
      JSON.stringify([
        {
          id: "note-2",
          user_id: "locale",
          title: null,
          body: "Testo",
          media_id: "media-rimosso",
          created_at: "2026-06-01T10:00:00.000Z",
          updated_at: "2026-06-01T10:00:00.000Z",
        },
      ]),
    );
    render(<MemoryExperience />);
    expect(
      screen.getByText("Questo ricordo multimediale non è più disponibile."),
    ).toBeInTheDocument();
  });

  it("crea una nota e la salva in localStorage", async () => {
    render(<MemoryExperience />);
    fireEvent.change(screen.getByLabelText("Titolo facoltativo"), { target: { value: "Titolo" } });
    fireEvent.change(screen.getByLabelText("Ricordo personale"), {
      target: { value: "Un ricordo scritto bene." },
    });
    fireEvent.change(screen.getByLabelText("Momento collegato"), {
      target: { value: "memory-video-01" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Aggiungi nota" }));

    await waitFor(() => {
      expect(screen.getByText("Un ricordo scritto bene.")).toBeInTheDocument();
    });

    const stored = JSON.parse(window.localStorage.getItem("giallo-aria:memory-notes") ?? "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      title: "Titolo",
      body: "Un ricordo scritto bene.",
      media_id: "memory-video-01",
    });
  });

  it("quando parte un video ne mette in pausa un altro", () => {
    const { container } = render(<MemoryExperience />);
    const videos = Array.from(container.querySelectorAll("video"));

    const pauseSpy = vi.spyOn(videos[0], "pause");
    fireEvent.play(videos[1]);
    expect(pauseSpy).toHaveBeenCalled();
  });
});

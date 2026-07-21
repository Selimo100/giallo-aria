// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryExperience } from "@/features/memories/components/MemoryExperience";

describe("MemoryExperience", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renderizza una galleria mista di foto e video", () => {
    render(<MemoryExperience canWriteNotes={false} isSupabaseReady={true} initialNotes={[]} />);
    expect(screen.getByText("Foto e video")).toBeInTheDocument();
    expect(screen.getAllByText(/foto|video/i).length).toBeGreaterThan(1);
  });

  it("mostra il prompt ospite quando l'utente non è autenticato", () => {
    render(<MemoryExperience canWriteNotes={false} isSupabaseReady={true} initialNotes={[]} />);
    expect(
      screen.getByText("Accedi per scrivere e conservare i tuoi ricordi personali."),
    ).toBeInTheDocument();
  });

  it("apre e chiude il dialog del media", async () => {
    render(<MemoryExperience canWriteNotes={false} isSupabaseReady={true} initialNotes={[]} />);
    fireEvent.click(screen.getAllByRole("button", { name: /apri/i })[0]);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Chiudi" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("mostra una nota collegata a un'immagine", () => {
    render(
      <MemoryExperience
        canWriteNotes={true}
        isSupabaseReady={true}
        initialNotes={[
          {
            id: "note-1",
            user_id: "user-1",
            title: "Ricordo",
            body: "Testo della nota",
            media_id: "memory-photo-01",
            created_at: "2026-06-01T10:00:00.000Z",
            updated_at: "2026-06-01T10:00:00.000Z",
          },
        ]}
      />,
    );
    expect(screen.getByText("Ricordo")).toBeInTheDocument();
    expect(screen.getByText("Testo della nota")).toBeInTheDocument();
  });

  it("mostra il fallback quando il media collegato non esiste più", () => {
    render(
      <MemoryExperience
        canWriteNotes={true}
        isSupabaseReady={true}
        initialNotes={[
          {
            id: "note-2",
            user_id: "user-1",
            title: null,
            body: "Testo",
            media_id: "media-rimosso",
            created_at: "2026-06-01T10:00:00.000Z",
            updated_at: "2026-06-01T10:00:00.000Z",
          },
        ]}
      />,
    );
    expect(screen.getByText("Questo ricordo multimediale non è più disponibile.")).toBeInTheDocument();
  });

  it("salva il media selezionato nel form della nota", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        note: {
          id: "note-new",
          user_id: "user-1",
          title: "Titolo",
          body: "Un ricordo scritto bene.",
          media_id: "memory-video-01",
          created_at: "2026-06-10T10:00:00.000Z",
          updated_at: "2026-06-10T10:00:00.000Z",
        },
      }),
    } as Response);

    render(<MemoryExperience canWriteNotes={true} isSupabaseReady={true} initialNotes={[]} />);
    fireEvent.change(screen.getByLabelText("Titolo facoltativo"), { target: { value: "Titolo" } });
    fireEvent.change(screen.getByLabelText("Ricordo personale"), {
      target: { value: "Un ricordo scritto bene." },
    });
    fireEvent.change(screen.getByLabelText("Momento collegato"), {
      target: { value: "memory-video-01" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Aggiungi nota" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: "POST",
    });
  });

  it("quando parte un video ne mette in pausa un altro", () => {
    const { container } = render(
      <MemoryExperience canWriteNotes={false} isSupabaseReady={true} initialNotes={[]} />,
    );
    const videos = Array.from(container.querySelectorAll("video"));

    const pauseSpy = vi.spyOn(videos[0], "pause");
    fireEvent.play(videos[1]);
    expect(pauseSpy).toHaveBeenCalled();
  });
});

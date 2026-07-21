"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { Button, Card, PlayingCard, Badge } from "@/components/ui";
import { memoryMedia, type MemoryMediaItem } from "@/features/memories/data/memory-media";
import {
  formatMemoryNoteDate,
  getMemoryMediaById,
  getMemoryMediaLabel,
  memoryMediaValidationErrors,
  sortMemoryNotes,
} from "@/features/memories/lib/memory-media";
import {
  type MemoryNoteInput,
  type MemoryNoteRecord,
  validateMemoryNoteInput,
} from "@/features/memories/lib/memory-notes";
import {
  addLocalMemoryNote,
  getLocalMemoryNotes,
  getServerMemoryNotes,
  removeLocalMemoryNote,
  subscribeMemoryNotes,
  updateLocalMemoryNote,
} from "@/lib/local-storage/memory-notes";

type NoteDraft = {
  title: string;
  body: string;
  mediaId: string;
};

const aspectRatioClass: Record<string, string> = {
  "16/9": "aspect-[16/9]",
  "4/3": "aspect-[4/3]",
  "1/1": "aspect-square",
  "9/16": "aspect-[9/16]",
  "3/4": "aspect-[3/4]",
};

function posterAltFor(item: MemoryMediaItem): string {
  return item.type === "image" ? item.alt : `Anteprima del video ${item.title}`;
}

export function MemoryExperience() {
  const rawNotes = useSyncExternalStore(
    subscribeMemoryNotes,
    getLocalMemoryNotes,
    getServerMemoryNotes,
  );
  const notes = useMemo(() => sortMemoryNotes(rawNotes), [rawNotes]);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [draft, setDraft] = useState<NoteDraft>({ title: "", body: "", mediaId: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const videoRefs = useRef(new Map<string, HTMLVideoElement>());
  const mediaErrors = useMemo(() => memoryMediaValidationErrors(), []);

  useEffect(() => {
    const players = videoRefs.current;
    return () => {
      for (const player of players.values()) {
        player.pause();
      }
    };
  }, []);

  function registerVideo(id: string, node: HTMLVideoElement | null) {
    if (node) {
      videoRefs.current.set(id, node);
    } else {
      videoRefs.current.delete(id);
    }
  }

  function handlePlay(id: string) {
    for (const [otherId, player] of videoRefs.current.entries()) {
      if (otherId !== id) player.pause();
    }
    setActiveVideoId(id);
  }

  function pauseVideo(id: string) {
    const player = videoRefs.current.get(id);
    if (player) player.pause();
    if (activeVideoId === id) setActiveVideoId(null);
  }

  function openMedia(id: string) {
    setSelectedMediaId(id);
  }

  function closeDialog() {
    if (selectedMediaId) pauseVideo(selectedMediaId);
    setSelectedMediaId(null);
  }

  function startEditing(note: MemoryNoteRecord) {
    setEditingId(note.id);
    setDraft({
      title: note.title ?? "",
      body: note.body,
      mediaId: note.media_id ?? "",
    });
    setError(null);
  }

  function resetDraft() {
    setEditingId(null);
    setDraft({ title: "", body: "", mediaId: "" });
  }

  async function submitNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input: MemoryNoteInput = {
      title: draft.title,
      body: draft.body,
      mediaId: draft.mediaId || null,
    };

    const validationError = validateMemoryNoteInput(input);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);

    const note = editingId
      ? updateLocalMemoryNote(editingId, input)
      : addLocalMemoryNote(input);

    setSaving(false);

    if (!note) {
      setError("Impossibile salvare la nota.");
      return;
    }

    resetDraft();
  }

  async function deleteNote(id: string) {
    removeLocalMemoryNote(id);
    if (editingId === id) resetDraft();
  }

  const selectedMedia = getMemoryMediaById(selectedMediaId);

  return (
    <>
      <section>
        <p className="font-titolo text-xs font-extrabold uppercase tracking-[0.28em] text-lemon-card">
          I nostri momenti
        </p>
        <h2 className="mt-3 font-titolo text-3xl font-extrabold uppercase leading-none tracking-tight text-white">
          Foto e video
        </h2>
        <p className="mt-3 max-w-xl text-sm text-white/70">
          Una raccolta fissa di immagini e video tenuti qui come carte sparse sul nostro tavolo.
        </p>
        {mediaErrors.length > 0 && (
          <Card className="mt-5 border border-[var(--color-bordo)] bg-[var(--color-superficie-2)]">
            <p className="font-semibold">Controlla la configurazione dei ricordi multimediali.</p>
            <ul className="mt-2 space-y-1 text-sm text-testo-morbido">
              {mediaErrors.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>
        )}

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {memoryMedia.map((item, index) => (
            <PlayingCard
              key={item.id}
              variant={item.type === "image" ? "white" : "black"}
              rotate={(index % 4) as 0 | 1 | 2 | 3}
              className="overflow-hidden p-3"
            >
              <div className="space-y-3">
                {item.type === "image" ? (
                  <button
                    type="button"
                    onClick={() => openMedia(item.id)}
                    className="block w-full text-left"
                    aria-label={`Apri ${getMemoryMediaLabel(item)}`}
                  >
                    <div
                      className={[
                        "relative overflow-hidden rounded-[calc(var(--radius-card)-4px)]",
                        aspectRatioClass[item.aspectRatio ?? "4/3"],
                        "bg-black/5",
                      ].join(" ")}
                    >
                      <MemoryPoster item={item} />
                    </div>
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div
                      className={[
                        "overflow-hidden rounded-[calc(var(--radius-card)-4px)] bg-white/10",
                        aspectRatioClass[item.aspectRatio ?? "16/9"],
                      ].join(" ")}
                    >
                      <video
                        ref={(node) => registerVideo(item.id, node)}
                        className="h-full w-full object-contain"
                        controls
                        preload="metadata"
                        playsInline
                        poster={item.poster}
                        onPlay={() => handlePlay(item.id)}
                        onPause={() => activeVideoId === item.id && setActiveVideoId(null)}
                      >
                        {item.sources.map((source) => (
                          <source key={source.src} src={source.src} type={source.type} />
                        ))}
                        {(item.tracks ?? []).map((track) => (
                          <track
                            key={`${item.id}-${track.src}-${track.srcLang}`}
                            kind="captions"
                            src={track.src}
                            srcLang={track.srcLang}
                            label={track.label}
                            default={track.default}
                          />
                        ))}
                        Il tuo browser non supporta la riproduzione di questo video.
                      </video>
                    </div>
                    <Button
                      type="button"
                      variant="fantasma"
                      className="px-4 py-2 text-sm text-white"
                      onClick={() => openMedia(item.id)}
                    >
                      Apri
                    </Button>
                  </div>
                )}

                <div className={item.type === "video" ? "text-white" : "text-black"}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge colore={item.type === "image" ? "giallo" : "viola"}>
                      {item.type === "image" ? "Foto" : "Video"}
                    </Badge>
                  </div>
                  <p className="mt-3 font-titolo text-xl font-extrabold leading-tight">
                    {item.type === "image" ? item.caption || "Foto" : item.title}
                  </p>
                  {item.caption && item.type === "video" && (
                    <p className="mt-2 text-sm text-white/75">{item.caption}</p>
                  )}
                </div>
              </div>
            </PlayingCard>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <p className="font-titolo text-xs font-extrabold uppercase tracking-[0.28em] text-lemon-card">
          Le nostre note
        </p>
        <h2 className="mt-3 font-titolo text-3xl font-extrabold uppercase leading-none tracking-tight text-white">
          Pensieri privati
        </h2>
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <Card>
              <form className="space-y-4" onSubmit={submitNote}>
                <div>
                  <label htmlFor="memory-note-title" className="mb-2 block font-semibold">
                    Titolo facoltativo
                  </label>
                  <input
                    id="memory-note-title"
                    value={draft.title}
                    onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                    maxLength={80}
                    className="min-h-[48px] w-full rounded-full border border-[var(--color-bordo)] bg-white px-4 text-black"
                    placeholder="Un nome breve per questo ricordo"
                  />
                </div>

                <div>
                  <label htmlFor="memory-note-body" className="mb-2 block font-semibold">
                    Ricordo personale
                  </label>
                  <textarea
                    id="memory-note-body"
                    value={draft.body}
                    onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))}
                    rows={5}
                    maxLength={1200}
                    className="w-full rounded-[var(--radius-card)] border border-[var(--color-bordo)] bg-white p-3 text-black"
                    placeholder="Scrivi qui quello che vuoi conservare per te."
                  />
                </div>

                <div>
                  <label htmlFor="memory-note-media" className="mb-2 block font-semibold">
                    Momento collegato
                  </label>
                  <select
                    id="memory-note-media"
                    value={draft.mediaId}
                    onChange={(event) => setDraft((current) => ({ ...current, mediaId: event.target.value }))}
                    className="min-h-[48px] w-full rounded-full border border-[var(--color-bordo)] bg-white px-4 text-black"
                  >
                    <option value="">Nessun momento collegato</option>
                    {memoryMedia.map((item) => (
                      <option key={item.id} value={item.id}>
                        {getMemoryMediaLabel(item)}
                      </option>
                    ))}
                  </select>
                </div>

                {error && <p className="text-sm text-corallo">{error}</p>}

                <div className="flex flex-wrap gap-3">
                  <Button type="submit" variant="secondario" disabled={saving}>
                    {editingId ? "Salva modifiche" : "Aggiungi nota"}
                  </Button>
                  {editingId && (
                    <Button type="button" variant="fantasma" onClick={resetDraft}>
                      Annulla
                    </Button>
                  )}
                </div>
              </form>
            </Card>

            <div className="space-y-4">
              {notes.length === 0 ? (
                <Card className="text-testo-morbido">Non hai ancora scritto note.</Card>
              ) : (
                notes.map((note) => (
                  <MemoryNoteCard
                    key={note.id}
                    note={note}
                    onOpenMedia={openMedia}
                    onEdit={startEditing}
                    onDelete={deleteNote}
                  />
                ))
              )}
            </div>
          </div>
      </section>

      <MemoryDialog
        item={selectedMedia}
        onClose={closeDialog}
        onPlay={handlePlay}
        onPause={pauseVideo}
        registerVideo={registerVideo}
      />
    </>
  );
}

function MemoryPoster({ item }: { item: MemoryMediaItem }) {
  const [failed, setFailed] = useState(false);
  const src = item.type === "image" ? item.src : item.poster;

  if (!src || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[var(--color-superficie-2)] p-6 text-center text-sm text-black">
        Questo ricordo multimediale non è più disponibile.
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={posterAltFor(item)}
      fill
      sizes="(max-width: 768px) 100vw, 50vw"
      className="object-cover"
      onError={() => setFailed(true)}
    />
  );
}

function MemoryDialog({
  item,
  onClose,
  onPlay,
  onPause,
  registerVideo,
}: {
  item: MemoryMediaItem | null;
  onClose: () => void;
  onPlay: (id: string) => void;
  onPause: (id: string) => void;
  registerVideo: (id: string, node: HTMLVideoElement | null) => void;
}) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!item) return;

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [item, onClose]);

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="memory-dialog-title"
        className="on-light max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[var(--radius-card)] bg-white p-4 text-black shadow-[inset_0_0_0_2px_#000] sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-testo-morbido">
              {item.type === "image" ? "Foto" : "Video"}
            </p>
            <h3 id="memory-dialog-title" className="mt-2 font-titolo text-2xl font-extrabold uppercase leading-tight">
              {item.type === "image" ? item.caption || "Ricordo fotografico" : item.title}
            </h3>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[48px] items-center justify-center rounded-[var(--radius-control)] px-5 py-2 font-titolo text-sm font-extrabold uppercase tracking-wide text-black shadow-[inset_0_0_0_2px_#000] transition active:translate-y-[2px]"
          >
            Chiudi
          </button>
        </div>

        <div className={`relative overflow-hidden rounded-[var(--radius-card)] bg-black/5 ${aspectRatioClass[item.aspectRatio ?? "4/3"]}`}>
          {item.type === "image" ? (
            <MemoryPoster item={item} />
          ) : (
            <video
              ref={(node) => registerVideo(item.id, node)}
              className="h-full w-full object-contain"
              controls
              preload="metadata"
              playsInline
              poster={item.poster}
              onPlay={() => onPlay(item.id)}
              onPause={() => onPause(item.id)}
            >
              {item.sources.map((source) => (
                <source key={source.src} src={source.src} type={source.type} />
              ))}
              {(item.tracks ?? []).map((track) => (
                <track
                  key={`${item.id}-${track.src}-${track.srcLang}`}
                  kind="captions"
                  src={track.src}
                  srcLang={track.srcLang}
                  label={track.label}
                  default={track.default}
                />
              ))}
              Il tuo browser non supporta la riproduzione di questo video.
            </video>
          )}
        </div>

      </div>
    </div>
  );
}

function MemoryNoteCard({
  note,
  onOpenMedia,
  onEdit,
  onDelete,
}: {
  note: MemoryNoteRecord;
  onOpenMedia: (id: string) => void;
  onEdit: (note: MemoryNoteRecord) => void;
  onDelete: (id: string) => void;
}) {
  const media = getMemoryMediaById(note.media_id);

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          {note.title && <p className="font-titolo text-xl font-extrabold uppercase leading-tight">{note.title}</p>}
          <p className="mt-1 text-xs uppercase tracking-wide text-testo-morbido">
            Creata il {formatMemoryNoteDate(note.created_at)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="fantasma" className="px-4 py-2 text-sm" onClick={() => onEdit(note)}>
            Modifica
          </Button>
          <Button type="button" variant="pericolo" className="px-4 py-2 text-sm" onClick={() => onDelete(note.id)}>
            Elimina
          </Button>
        </div>
      </div>

      <p className="whitespace-pre-wrap text-sm leading-relaxed text-black">{note.body}</p>

      {note.media_id && (
        media ? (
          <button
            type="button"
            onClick={() => onOpenMedia(media.id)}
            className="flex w-full items-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-bordo)] bg-[var(--color-superficie-2)] p-3 text-left"
          >
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[10px] bg-white">
              <MemoryPoster item={media} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-wide text-testo-morbido">
                {media.type === "image" ? "Foto" : "Video"}
              </p>
              <p className="mt-1 font-semibold">{media.type === "image" ? media.caption || "Foto" : media.title}</p>
            </div>
          </button>
        ) : (
          <div className="rounded-[var(--radius-card)] border border-[var(--color-bordo)] bg-[var(--color-superficie-2)] p-3 text-sm text-testo-morbido">
            Questo ricordo multimediale non è più disponibile.
          </div>
        )
      )}
    </Card>
  );
}

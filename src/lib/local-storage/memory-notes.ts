import type { MemoryNoteInput, MemoryNoteRecord } from "@/features/memories/lib/memory-notes";
import { normalizeMemoryNoteInput } from "@/features/memories/lib/memory-notes";

const KEY = "giallo-aria:memory-notes";

export function getLocalMemoryNotes(): MemoryNoteRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as MemoryNoteRecord[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalMemoryNotes(notes: MemoryNoteRecord[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(notes));
  } catch {
    /* storage full / disabled */
  }
}

export function addLocalMemoryNote(input: MemoryNoteInput): MemoryNoteRecord {
  const now = new Date().toISOString();
  const note: MemoryNoteRecord = {
    id: `memory-${crypto.randomUUID()}`,
    user_id: "locale",
    created_at: now,
    updated_at: now,
    ...normalizeMemoryNoteInput(input),
  };
  saveLocalMemoryNotes([note, ...getLocalMemoryNotes()]);
  return note;
}

export function updateLocalMemoryNote(id: string, input: MemoryNoteInput): MemoryNoteRecord | null {
  const notes = getLocalMemoryNotes();
  const existing = notes.find((note) => note.id === id);
  if (!existing) return null;

  const updated: MemoryNoteRecord = {
    ...existing,
    ...normalizeMemoryNoteInput(input),
    updated_at: new Date().toISOString(),
  };

  saveLocalMemoryNotes(notes.map((note) => (note.id === id ? updated : note)));
  return updated;
}

export function removeLocalMemoryNote(id: string): void {
  saveLocalMemoryNotes(getLocalMemoryNotes().filter((note) => note.id !== id));
}

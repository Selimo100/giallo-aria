import type { MemoryNoteInput, MemoryNoteRecord } from "@/features/memories/lib/memory-notes";
import { normalizeMemoryNoteInput } from "@/features/memories/lib/memory-notes";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

// Shared, account-free memory notes. Source of truth is the Supabase
// `shared_memory_notes` table (one global pool everyone reads and writes).
// Optimistic in-memory cache keeps the UI synchronous. Note bodies are private
// content, so we never log them. See migration 0008_shared_content.sql.

const TABLE = "shared_memory_notes";
const EMPTY: MemoryNoteRecord[] = [];

let cache: MemoryNoteRecord[] = EMPTY;
const listeners = new Set<() => void>();
let hydrated = false;

function emit(): void {
  for (const listener of listeners) listener();
}

type Row = {
  id: string;
  title: string | null;
  body: string;
  media_id: string | null;
  created_at: string;
  updated_at: string;
};

function rowToRecord(r: Row): MemoryNoteRecord {
  return {
    id: r.id,
    user_id: "condiviso",
    title: r.title,
    body: r.body,
    media_id: r.media_id,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

async function hydrate(): Promise<void> {
  const sb = getSupabaseBrowserClient();
  if (!sb) return;
  const { data, error } = await sb
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.warn("[ricordi] impossibile caricare le note condivise:", error.message);
    return;
  }
  cache = (data as Row[] | null)?.map(rowToRecord) ?? EMPTY;
  emit();
}

function setCache(list: MemoryNoteRecord[]): void {
  cache = list;
  emit();
}

/** Test-only: reset the module cache so specs don't leak state into each other. */
export function __resetMemoryNotesForTests(): void {
  cache = EMPTY;
  hydrated = false;
  listeners.clear();
}

/** Snapshot for useSyncExternalStore (mutated only on hydrate/write). */
export function getLocalMemoryNotes(): MemoryNoteRecord[] {
  return cache;
}

export function getServerMemoryNotes(): MemoryNoteRecord[] {
  return EMPTY;
}

export function subscribeMemoryNotes(onChange: () => void): () => void {
  listeners.add(onChange);
  if (!hydrated) {
    hydrated = true;
    void hydrate();
  }
  return () => {
    listeners.delete(onChange);
  };
}

export function addLocalMemoryNote(input: MemoryNoteInput): MemoryNoteRecord {
  const now = new Date().toISOString();
  const normalized = normalizeMemoryNoteInput(input);
  const note: MemoryNoteRecord = {
    id: `memory-${crypto.randomUUID()}`,
    user_id: "condiviso",
    created_at: now,
    updated_at: now,
    ...normalized,
  };
  setCache([note, ...cache]); // optimistic
  const sb = getSupabaseBrowserClient();
  if (sb) {
    void sb
      .from(TABLE)
      .insert({ id: note.id, created_at: now, updated_at: now, ...normalized })
      .then(({ error }) => {
        if (error) {
          console.warn("[ricordi] salvataggio non riuscito:", error.message);
          void hydrate();
        }
      });
  }
  return note;
}

export function updateLocalMemoryNote(id: string, input: MemoryNoteInput): MemoryNoteRecord | null {
  const existing = cache.find((note) => note.id === id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const normalized = normalizeMemoryNoteInput(input);
  const updated: MemoryNoteRecord = { ...existing, ...normalized, updated_at: now };
  setCache(cache.map((note) => (note.id === id ? updated : note)));

  const sb = getSupabaseBrowserClient();
  if (sb) {
    void sb
      .from(TABLE)
      .update({ ...normalized, updated_at: now })
      .eq("id", id)
      .then(({ error }) => {
        if (error) {
          console.warn("[ricordi] aggiornamento non riuscito:", error.message);
          void hydrate();
        }
      });
  }
  return updated;
}

export function removeLocalMemoryNote(id: string): void {
  setCache(cache.filter((note) => note.id !== id));
  const sb = getSupabaseBrowserClient();
  if (sb) {
    void sb
      .from(TABLE)
      .delete()
      .eq("id", id)
      .then(({ error }) => {
        if (error) {
          console.warn("[ricordi] eliminazione non riuscita:", error.message);
          void hydrate();
        }
      });
  }
}

import { memoryMedia } from "@/features/memories/data/memory-media";

export type MemoryNoteRecord = {
  id: string;
  user_id: string;
  title: string | null;
  body: string;
  media_id: string | null;
  created_at: string;
  updated_at: string;
};

export type MemoryNoteInput = {
  title?: string;
  body: string;
  mediaId?: string | null;
};

const memoryIds = new Set(memoryMedia.map((item) => item.id));

export function validateMemoryNoteInput(input: MemoryNoteInput): string | null {
  const title = input.title?.trim() ?? "";
  const body = input.body.trim();

  if (title.length > 80) return "Il titolo può contenere al massimo 80 caratteri.";
  if (body.length < 2) return "Scrivi almeno due caratteri nel ricordo.";
  if (body.length > 1200) return "Il ricordo può contenere al massimo 1200 caratteri.";

  const mediaId = input.mediaId?.trim() ?? "";
  if (mediaId && !memoryIds.has(mediaId)) {
    return "Il momento collegato selezionato non è valido.";
  }

  return null;
}

export function normalizeMemoryNoteInput(input: MemoryNoteInput) {
  return {
    title: input.title?.trim() || null,
    body: input.body.trim(),
    media_id: input.mediaId?.trim() || null,
  };
}

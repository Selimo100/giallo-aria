"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

// supabase-js expects the PROJECT base URL (https://xxxx.supabase.co), not a
// REST endpoint. Strip a trailing "/rest/v1" (a common copy-paste mistake) and
// any trailing slash so the client builds correct request URLs.
function normalizeSupabaseUrl(raw: string): string {
  return raw.trim().replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");
}

export function getSupabaseBrowserClient(): SupabaseClient | null {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!rawUrl || !anonKey) return null;

  if (!browserClient) {
    browserClient = createBrowserClient(normalizeSupabaseUrl(rawUrl), anonKey);
  }

  return browserClient;
}

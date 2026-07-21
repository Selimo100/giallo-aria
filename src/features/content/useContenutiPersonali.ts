"use client";

import { useSyncExternalStore } from "react";
import {
  getContenuti,
  getServerContenuti,
  subscribeContenuti,
} from "@/lib/local-storage/custom-content";

/** Reactive access to the device's user-created content. */
export function useContenutiPersonali() {
  return useSyncExternalStore(subscribeContenuti, getContenuti, getServerContenuti);
}

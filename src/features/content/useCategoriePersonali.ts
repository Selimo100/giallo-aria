"use client";

import { useSyncExternalStore } from "react";
import {
  getCategorie,
  getServerCategorie,
  subscribeCategorie,
} from "@/lib/local-storage/personal-categories";

/** Reactive access to the device's user-created categories. */
export function useCategoriePersonali() {
  return useSyncExternalStore(subscribeCategorie, getCategorie, getServerCategorie);
}

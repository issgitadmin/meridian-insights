"use client";

import type { Deal } from "@/lib/deals";

// The working dataset lives in this browser tab until it is shared.
const KEY = "meridian:dataset";

export type Dataset = { name: string; deals: Deal[]; loadedAt: string };

export function saveDataset(ds: Dataset) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(ds));
    return true;
  } catch {
    return false;
  }
}

export function loadDataset(): Dataset | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Dataset) : null;
  } catch {
    return null;
  }
}

export function clearDataset() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {}
}

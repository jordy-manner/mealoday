"use server";

// Server Actions for the preference sections of /parametres: the Pexels API key
// (a server secret — never returned to the client), the seasonal-data check
// frequency, and the manual "Mettre à jour" job. Theme/accent are not here:
// they are a client preference (localStorage).

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  SETTING_KEYS,
  SEASON_FREQUENCIES,
  setSetting,
} from "@/lib/settings";
import { getSeasonStats, type SeasonStats } from "@/lib/season-sources";
import { runSeasonUpdate, type SeasonUpdateResult } from "@/lib/season-update";

export type ActionResult<T = unknown> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

/** Saves the Pexels API key as a server secret. The value is never read back. */
export async function savePexelsKey(rawKey: string): Promise<ActionResult> {
  const key = z.string().trim().min(1, "Clé vide").safeParse(rawKey);
  if (!key.success) return { ok: false, error: key.error.issues[0].message };
  // A masked placeholder (only bullet characters) must not overwrite the key.
  if (/^[•*\s]+$/.test(key.data)) return { ok: false, error: "Saisissez une nouvelle clé" };
  await setSetting(SETTING_KEYS.pexelsApiKey, key.data);
  revalidatePath("/parametres/general");
  revalidatePath("/saisons");
  return { ok: true };
}

/** Saves the Gemini API key as a server secret (recipe photo scanning). */
export async function saveGeminiKey(rawKey: string): Promise<ActionResult> {
  const key = z.string().trim().min(1, "Clé vide").safeParse(rawKey);
  if (!key.success) return { ok: false, error: key.error.issues[0].message };
  if (/^[•*\s]+$/.test(key.data)) return { ok: false, error: "Saisissez une nouvelle clé" };
  await setSetting(SETTING_KEYS.geminiApiKey, key.data);
  revalidatePath("/parametres/general");
  revalidatePath("/recettes/nouvelle"); // toggles the scan option availability
  return { ok: true };
}

/** Sets the seasonal-data auto-check frequency. */
export async function setSeasonFrequency(value: string): Promise<ActionResult> {
  const parsed = z.enum(SEASON_FREQUENCIES).safeParse(value);
  if (!parsed.success) return { ok: false, error: "Fréquence invalide" };
  await setSetting(SETTING_KEYS.seasonCheckFrequency, parsed.data);
  revalidatePath("/parametres/saisons");
  return { ok: true };
}

/**
 * Manual one-off "Mettre à jour": runs the operational seasonal-data update
 * (re-apply the dataset, derive aisles, refresh ADEME carbon, stamp the date),
 * then returns the refreshed stats + a summary of what changed.
 */
export async function updateSeasonData(): Promise<
  ActionResult<{ lastChecked: string; stats: SeasonStats; result: SeasonUpdateResult }>
> {
  try {
    const result = await runSeasonUpdate({ refreshCarbon: true });
    const stats = await getSeasonStats();
    return { ok: true, lastChecked: result.lastChecked, stats, result };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Échec de la mise à jour" };
  }
}

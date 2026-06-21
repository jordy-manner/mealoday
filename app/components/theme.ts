// Theme + accent tokens for the Apparence settings. Theme/accent are a CLIENT
// preference (localStorage) applied by overriding the --color-* custom
// properties on <html> at runtime — Tailwind v4 utilities read those vars, so
// the override re-cascades across the whole app without a rebuild.
//
// Dark-mode pitfall: never transition the body background/color tied to a
// custom property (the transition freezes the old value). We swap tokens
// instantly and suppress transitions for one frame via the `no-transition`
// class (see globals.css) so nothing animates the var() change.
//
// Single source of truth: all hex values live in tokens/tokens.json.
// The @theme in app/globals.css mirrors `light`; check:design fails on drift.

import TOKENS from "../../tokens/tokens.json";

export const THEME_STORAGE = "sur-le-plat-theme";
export const ACCENT_STORAGE = "sur-le-plat-accent";

// Legacy keys (pre-rebrand). Used only for the one-time migration on boot.
export const LEGACY_THEME_STORAGE = "mealoday-theme";
export const LEGACY_ACCENT_STORAGE = "mealoday-accent";

export type ThemeMode = "light" | "dark";

export const ACCENTS = TOKENS.accents as readonly {
  id: string;
  value: string;
  deep: string;
  soft: string;
  ink: string;
  darkSoft: string;
  darkInk: string;
}[];

export type AccentId = (typeof ACCENTS)[number]["id"];

// Token values per theme. Keys map to --color-<key>. Light mirrors globals.css @theme.
export const LIGHT_TOKENS: Record<string, string> = TOKENS.light;
export const DARK_TOKENS: Record<string, string> = TOKENS.dark;

/** Applies theme + accent to <html> (client-only — touches the DOM). */
export function applyTheme(theme: ThemeMode, accentId: string) {
  const root = document.documentElement;
  // Suppress transitions for one frame to avoid freezing the var() change.
  root.classList.add("no-transition");
  root.setAttribute("data-theme", theme);
  const tokens = theme === "dark" ? DARK_TOKENS : LIGHT_TOKENS;
  for (const [k, v] of Object.entries(tokens)) root.style.setProperty(`--color-${k}`, v);
  const a = ACCENTS.find((x) => x.id === accentId) ?? ACCENTS[0];
  const isDark = theme === "dark";
  root.style.setProperty("--color-accent", a.value);
  root.style.setProperty("--color-accent-deep", a.deep);
  root.style.setProperty("--color-accent-soft", isDark ? a.darkSoft : a.soft);
  root.style.setProperty("--color-accent-ink",  isDark ? a.darkInk  : a.ink);
  requestAnimationFrame(() => root.classList.remove("no-transition"));
}

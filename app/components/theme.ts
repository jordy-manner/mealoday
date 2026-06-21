// Theme + accent tokens for the Apparence settings. Theme/accent are a CLIENT
// preference (localStorage) applied by overriding the --color-* custom
// properties on <html> at runtime — Tailwind v4 utilities read those vars, so
// the override re-cascades across the whole app without a rebuild.
//
// Dark-mode pitfall: never transition the body background/color tied to a
// custom property (the transition freezes the old value). We swap tokens
// instantly and suppress transitions for one frame via the `no-transition`
// class (see globals.css) so nothing animates the var() change.

export const THEME_STORAGE = "sur-le-plat-theme";
export const ACCENT_STORAGE = "sur-le-plat-accent";

// Legacy keys (pre-rebrand). Used only for the one-time migration on boot.
export const LEGACY_THEME_STORAGE = "mealoday-theme";
export const LEGACY_ACCENT_STORAGE = "mealoday-accent";

export type ThemeMode = "light" | "dark";

export const ACCENTS = [
  { id: "Jaune",      value: "#f5c700", deep: "#d9af00", soft: "#fdf2c0", ink: "#8a6a00", darkSoft: "#2c2613", darkInk: "#f5c700" },
  { id: "Terracotta", value: "#d8582e", deep: "#a73a1b", soft: "#ffdfcb", ink: "#852b09", darkSoft: "#3a1f15", darkInk: "#e8794f" },
  { id: "Paprika",    value: "#c0392b", deep: "#992c20", soft: "#ffd9d2", ink: "#7e241a", darkSoft: "#3a1a16", darkInk: "#e06a5b" },
  { id: "Ambre",      value: "#cc8d2e", deep: "#a06f1f", soft: "#fdecc8", ink: "#7a541a", darkSoft: "#332512", darkInk: "#e0aa55" },
  { id: "Olive",      value: "#6f8f3f", deep: "#566f30", soft: "#e6efcf", ink: "#42531f", darkSoft: "#232a16", darkInk: "#9fbf63" },
] as const;

export type AccentId = (typeof ACCENTS)[number]["id"];

// Token values per theme. Keys map to --color-<key>. Light mirrors globals.css.
export const LIGHT_TOKENS: Record<string, string> = {
  bg: "#f3ecd8",
  surface: "#fffdf3",
  "surface-muted": "#efe7d2",
  ink: "#1a1a1a",
  "ink-soft": "#6b6456",
  "ink-faint": "#9b9484",
  line: "#e4dabf",
  "line-soft": "#ede4cf",
  veg: "#4b8b5a",
  "veg-soft": "#dcefdf",
};

export const DARK_TOKENS: Record<string, string> = {
  bg: "#151517",
  surface: "#232327",
  "surface-muted": "#2d2d33",
  ink: "#f4eedd",
  "ink-soft": "#9a958c",
  "ink-faint": "#6f6a62",
  line: "#34343b",
  "line-soft": "#2a2a30",
  veg: "#74b487",
  "veg-soft": "#1f2c23",
};

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

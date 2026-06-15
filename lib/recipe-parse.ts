// Client-safe parsing helpers shared by the recipe-import paths (web crawl and
// OCR): split a free ingredient line into quantity / unit / name. Pure, no
// server or DOM dependency.

const FRACTIONS: Record<string, number> = {
  "½": 0.5,
  "¼": 0.25,
  "¾": 0.75,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
};

/** Parses a numeric quantity (decimal comma, simple fraction, unicode) → number|null. */
export function toNumber(raw: string): number | null {
  const t = raw.trim();
  if (t in FRACTIONS) return FRACTIONS[t];
  const frac = t.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

// Known unit tokens (longest first) used to split "200 g de farine".
export const UNIT_WORDS = [
  "c. à s.", "c. à c.", "càs", "càc", "cuillères", "cuillère", "kg", "mg", "g", "dl", "cl", "ml", "l",
  "pincées", "pincée", "gousses", "gousse", "tranches", "tranche", "pièces", "pièce", "sachets",
  "sachet", "verres", "verre", "tasses", "tasse", "bottes", "botte", "poignées", "poignée",
];

/** Splits a free ingredient line into { quantity, unit, name } (best-effort). */
export function parseIngredientLine(raw: string): { name: string; quantity: string; unit: string } {
  const line = raw.replace(/\s+/g, " ").trim();
  if (!line) return { name: "", quantity: "", unit: "" };
  const qm = line.match(/^([0-9]+(?:[.,][0-9]+)?(?:\s*\/\s*[0-9]+)?|[½¼¾⅓⅔])\s*(.*)$/);
  if (!qm) return { name: line, quantity: "", unit: "" };
  const num = toNumber(qm[1]);
  if (num == null) return { name: line, quantity: "", unit: "" };
  let rest = qm[2];
  let unit = "";
  for (const u of UNIT_WORDS) {
    const re = new RegExp("^" + u.replace(/\./g, "\\.").replace(/\s/g, "\\s*") + "(?=\\s|$)", "i");
    if (re.test(rest)) {
      unit = u;
      rest = rest.replace(re, "");
      break;
    }
  }
  rest = rest.replace(/^\s*(?:de\s+|d['’]\s*)/i, "").trim();
  return { name: rest || line, quantity: String(num), unit };
}

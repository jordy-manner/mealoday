// Design-token sync guard. Fails if a color/radius/shadow/container token
// documented in DESIGN.md diverges from the running `@theme` in
// app/globals.css (or vice-versa). Also guards that tokens/tokens.json light
// values match @theme, preventing drift between the JS runtime and the CSS.
// Wired into `vercel-build` so any divergence breaks the deploy.
// Plain Node (no deps), run via `npm run check:design`.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Token families that live in the @theme and must match DESIGN.md.
const CHECKED = /^--(color|radius|shadow|container)-/;

const norm = (v) => v.trim().replace(/;$/, "").replace(/\s+/g, " ").toLowerCase();

/** Tokens declared in DESIGN.md: table rows + inline `--name: value` spans. */
function parseDesign(md) {
  const tokens = new Map();
  for (const line of md.split("\n")) {
    const row = line.match(/^\|\s*`(--[\w-]+)`\s*\|\s*`([^`]+)`\s*\|/);
    if (row) tokens.set(row[1], norm(row[2]));
    for (const m of line.matchAll(/`(--[\w-]+):\s*([^`]+)`/g)) {
      tokens.set(m[1], norm(m[2]));
    }
  }
  return tokens;
}

/** Tokens declared in the `@theme { … }` block of globals.css. */
function parseTheme(css) {
  const block = css.match(/@theme\s*\{([\s\S]*?)\n\}/);
  const body = block ? block[1] : css;
  const tokens = new Map();
  for (const m of body.matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
    tokens.set(m[1], norm(m[2]));
  }
  return tokens;
}

const design = parseDesign(readFileSync(join(root, "DESIGN.md"), "utf8"));
const theme = parseTheme(readFileSync(join(root, "app/globals.css"), "utf8"));
const TOKENS = JSON.parse(readFileSync(join(root, "tokens/tokens.json"), "utf8"));

const errors = [];

// 1. Every checked @theme token must be documented in DESIGN.md with the same value.
for (const [name, value] of theme) {
  if (!CHECKED.test(name)) continue;
  if (!design.has(name)) {
    errors.push(`@theme has \`${name}\` (= ${value}) but DESIGN.md does not document it.`);
  } else if (design.get(name) !== value) {
    errors.push(`\`${name}\`: DESIGN.md = ${design.get(name)} ≠ @theme = ${value}.`);
  }
}

// 2. Every checked token documented in DESIGN.md must exist in the @theme.
for (const [name, value] of design) {
  if (!CHECKED.test(name)) continue;
  if (!theme.has(name)) {
    errors.push(`DESIGN.md documents \`${name}\` (= ${value}) but the @theme has no such token.`);
  }
}

// 3. tokens/tokens.json `light` values must match the @theme (prevents JS/CSS drift).
for (const [key, value] of Object.entries(TOKENS.light)) {
  const cssName = `--color-${key}`;
  const cssValue = norm(value);
  if (!theme.has(cssName)) {
    errors.push(`tokens.json light["${key}"] (= ${value}) has no matching \`${cssName}\` in @theme.`);
  } else if (theme.get(cssName) !== cssValue) {
    errors.push(`tokens.json light["${key}"]: tokens.json = ${cssValue} ≠ @theme \`${cssName}\` = ${theme.get(cssName)}.`);
  }
}

if (errors.length) {
  console.error("✗ Design tokens out of sync:\n");
  for (const e of errors) console.error("  • " + e);
  console.error("\nFix the source (tokens/tokens.json → theme.ts + globals.css, DESIGN.md §10).");
  process.exit(1);
}

const checked = [...theme.keys()].filter((n) => CHECKED.test(n)).length;
console.log(`✓ Design tokens in sync (${checked} @theme tokens match DESIGN.md; ${Object.keys(TOKENS.light).length} light tokens match tokens.json).`);

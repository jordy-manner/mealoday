"use server";

// Web import: fetch a recipe page SERVER-SIDE and extract its structured data
// (schema.org/Recipe). JSON-LD is preferred; a light DOM/microdata fallback
// covers pages without JSON-LD. The result pre-fills the creation form (fields
// stay fully editable) and the origin URL is added as the first source.

import type { RecipeFormValues } from "./recipe-form";
import { parseIngredientLine } from "@/lib/recipe-parse";

export type ExtractResult =
  | { ok: true; values: RecipeFormValues }
  | { ok: false; error: string };

const FETCH_TIMEOUT_MS = 12_000;

/** A blank form value set (server-side mirror of the form's EMPTY). */
function emptyValues(): RecipeFormValues {
  return {
    title: "",
    description: "",
    servings: "",
    prepTime: "",
    cookTime: "",
    restTime: "",
    difficulty: null,
    rating: "",
    author: "",
    popular: false,
    kcal: "",
    protein: "",
    carbs: "",
    fat: "",
    imageUrl: null,
    ingredients: [],
    utensils: [],
    steps: [],
    tags: [],
    categories: [],
    sources: [],
    seasonMode: "AUTO",
    seasonMonths: [],
  };
}

// Common named HTML entities seen in recipe pages (typography + French accents).
// Numeric entities (&#8217; / &#x2019;) are decoded generically below.
const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", sbquo: "‚", bdquo: "„",
  hellip: "…", ndash: "–", mdash: "—", minus: "−", deg: "°", middot: "·",
  laquo: "«", raquo: "»", times: "×", divide: "÷", frac12: "½", frac14: "¼", frac34: "¾",
  trade: "™", copy: "©", reg: "®", euro: "€", eacute: "é", egrave: "è", ecirc: "ê",
  euml: "ë", agrave: "à", acirc: "â", auml: "ä", ccedil: "ç", ugrave: "ù", ucirc: "û",
  uuml: "ü", icirc: "î", iuml: "ï", ocirc: "ô", ouml: "ö", oelig: "œ", aelig: "æ",
  Eacute: "É", Egrave: "È", Ecirc: "Ê", Agrave: "À", Acirc: "Â", Ccedil: "Ç", Ocirc: "Ô",
};

const fromCp = (cp: number): string => {
  try {
    return String.fromCodePoint(cp);
  } catch {
    return "";
  }
};

/** Decodes numeric (&#…; / &#x…;) and common named HTML entities. */
function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => fromCp(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => fromCp(parseInt(d, 10)))
    .replace(/&([a-z][a-z0-9]*);/gi, (m, name) =>
      name in NAMED_ENTITIES ? NAMED_ENTITIES[name as keyof typeof NAMED_ENTITIES] : m,
    );
}

/** Strips HTML tags + decodes entities + collapses whitespace (incl. nbsp). */
function strip(s: unknown): string {
  return decodeEntities(String(s ?? "").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

/** ISO 8601 duration ("PT1H30M") → minutes as a string ("90"), or "". */
function isoToMinutes(d: unknown): string {
  if (typeof d !== "string") return "";
  const m = d.match(/P(?:\d+D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
  if (!m) return "";
  const h = Number(m[1] ?? 0);
  const min = Number(m[2] ?? 0);
  const total = h * 60 + min;
  return total > 0 ? String(total) : "";
}

/** schema.org recipeInstructions (string | HowToStep[] | HowToSection[]) → string[]. */
function parseInstructions(ri: unknown): string[] {
  if (!ri) return [];
  if (typeof ri === "string") return ri.split(/\r?\n|<br\s*\/?>/i).map(strip).filter(Boolean);
  if (Array.isArray(ri)) {
    const out: string[] = [];
    for (const item of ri) {
      if (typeof item === "string") out.push(strip(item));
      else if (item && typeof item === "object") {
        const o = item as Record<string, unknown>;
        if (o["@type"] === "HowToSection" && Array.isArray(o.itemListElement)) {
          for (const st of o.itemListElement) {
            const s = st as Record<string, unknown>;
            out.push(strip(s.text ?? s.name));
          }
        } else {
          out.push(strip(o.text ?? o.name));
        }
      }
    }
    return out.filter(Boolean);
  }
  return [];
}

/** Resolves a schema.org image (string | {url} | array) to the first URL. */
function parseImage(img: unknown): string | null {
  if (!img) return null;
  if (typeof img === "string") return img;
  if (Array.isArray(img)) return parseImage(img[0]);
  if (typeof img === "object") {
    const url = (img as Record<string, unknown>).url;
    return typeof url === "string" ? url : null;
  }
  return null;
}

/** recipeYield (number | string | array) → first integer as a string. */
function parseYield(y: unknown): string {
  const first = Array.isArray(y) ? y[0] : y;
  const m = String(first ?? "").match(/\d+/);
  return m ? m[0] : "";
}

/** Walks JSON-LD (handles @graph + arrays) to find the first Recipe node. */
function findRecipeNode(json: unknown): Record<string, unknown> | null {
  const nodes: unknown[] = [];
  const visit = (v: unknown) => {
    if (Array.isArray(v)) v.forEach(visit);
    else if (v && typeof v === "object") {
      nodes.push(v);
      const graph = (v as Record<string, unknown>)["@graph"];
      if (Array.isArray(graph)) graph.forEach(visit);
    }
  };
  visit(json);
  for (const n of nodes) {
    const t = (n as Record<string, unknown>)["@type"];
    const types = Array.isArray(t) ? t : [t];
    if (types.some((x) => String(x).toLowerCase() === "recipe")) {
      return n as Record<string, unknown>;
    }
  }
  return null;
}

function mapRecipeNode(node: Record<string, unknown>, url: string): RecipeFormValues {
  const values = emptyValues();
  values.title = strip(node.name);
  values.description = strip(node.description);
  values.servings = parseYield(node.recipeYield);
  values.prepTime = isoToMinutes(node.prepTime);
  values.cookTime = isoToMinutes(node.cookTime);
  // If only totalTime is given, fall back to it as prep time.
  if (!values.prepTime && !values.cookTime) values.prepTime = isoToMinutes(node.totalTime);
  values.imageUrl = parseImage(node.image);
  values.author =
    typeof node.author === "object" && node.author
      ? strip((node.author as Record<string, unknown>).name)
      : strip(node.author);

  const ing = node.recipeIngredient ?? node.ingredients;
  if (Array.isArray(ing)) {
    values.ingredients = ing
      .map((line) => parseIngredientLine(strip(line)))
      .filter((r) => r.name)
      .map((r) => ({ ...r, isPrimary: false }));
  }
  values.steps = parseInstructions(node.recipeInstructions);
  values.sources = [url];
  return values;
}

export async function extractRecipeFromUrl(rawUrl: string): Promise<ExtractResult> {
  const url = rawUrl.trim();
  if (!/^https?:\/\/\S+$/i.test(url)) {
    return { ok: false, error: "Adresse invalide — collez une URL commençant par http(s)://." };
  }

  let html: string;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MarmiteBot/1.0; +recipe-import)",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: "follow",
    });
    if (!res.ok) return { ok: false, error: `La page a répondu ${res.status}. Vérifiez l'adresse.` };
    html = await res.text();
  } catch (e) {
    const msg = e instanceof Error && e.name === "TimeoutError" ? "La page a mis trop de temps à répondre." : "Impossible de récupérer la page.";
    return { ok: false, error: msg };
  }

  // 1. JSON-LD (preferred).
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const b of blocks) {
    let json: unknown;
    try {
      json = JSON.parse(b[1].trim());
    } catch {
      continue;
    }
    const node = findRecipeNode(json);
    if (node) {
      const values = mapRecipeNode(node, url);
      if (values.title || values.ingredients.length || values.steps.length) {
        return { ok: true, values };
      }
    }
  }

  // 2. Minimal fallback: at least pre-fill the title (og:title / <title> / <h1>)
  //    so the user can finish by hand, with the source kept.
  const og = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = strip(og?.[1] ?? h1?.[1] ?? titleTag?.[1]);
  if (title) {
    const values = emptyValues();
    values.title = title;
    values.sources = [url];
    return { ok: true, values };
  }

  return { ok: false, error: "Aucune recette structurée détectée sur cette page." };
}

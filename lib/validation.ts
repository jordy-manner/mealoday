// Shared Zod validation for recipe input (Server Actions + REST API).
// Tolerant to form strings: "" → null, French decimal comma, empty rows dropped.
// RecipeInput is derived from the schema (single source of truth).

import { z } from "zod";

/** Optional non-negative integer (max bound for e.g. difficulty 1–3). */
const intField = (field: string, max?: number, min = 0) =>
  z.preprocess(
    (v) =>
      v === "" || v === null || v === undefined
        ? null
        : typeof v === "number"
          ? v
          : Number(String(v).trim()),
    z
      .number({ message: `${field} est invalide` })
      .int(`${field} doit être un entier`)
      .min(min, `${field} est invalide`)
      .max(max ?? Number.MAX_SAFE_INTEGER, `${field} est invalide`)
      .nullable(),
  );

/** Optional non-negative float within [0, max] (French decimal comma tolerated). */
const floatField = (field: string, max: number) =>
  z.preprocess(
    (v) =>
      v === "" || v === null || v === undefined
        ? null
        : typeof v === "number"
          ? v
          : Number(String(v).replace(",", ".").trim()),
    z.number({ message: `${field} est invalide` }).min(0).max(max).nullable(),
  );

/** Trimmed string, or null when empty. */
const trimmedOrNull = z.preprocess(
  (v) => (typeof v === "string" && v.trim().length > 0 ? v.trim() : null),
  z.string().nullable(),
);

/** Array of strings: accepts an array or a comma-separated string; trims/drops empties. */
const stringList = z.preprocess(
  (v) =>
    Array.isArray(v)
      ? v.map((s) => String(s).trim()).filter(Boolean)
      : typeof v === "string"
        ? v.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
  z.array(z.string()),
);

/** Steps: array (or newline string); trims and drops empty steps. */
const steps = z.preprocess(
  (v) =>
    Array.isArray(v)
      ? v.map((s) => String(s).trim()).filter(Boolean)
      : typeof v === "string"
        ? v.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
        : [],
  z.array(z.string()),
);

const nameOf = (r: unknown) =>
  r && typeof r === "object" ? String((r as Record<string, unknown>).name ?? "").trim() : "";

const ingredientSchema = z.object({
  name: z.string().trim().min(1),
  quantity: floatField("La quantité", 1_000_000),
  unit: trimmedOrNull,
});

const utensilSchema = z.object({
  name: z.string().trim().min(1),
  quantity: intField("La quantité", 100_000, 1), // optional; ≥ 1 when provided
});

/** Rows without a name are dropped before validation. */
const ingredients = z.preprocess(
  (v) => (Array.isArray(v) ? v.filter((r) => nameOf(r).length > 0) : []),
  z.array(ingredientSchema),
);
const utensils = z.preprocess(
  (v) => (Array.isArray(v) ? v.filter((r) => nameOf(r).length > 0) : []),
  z.array(utensilSchema),
);

export const recipeInputSchema = z.object({
  title: z.string().trim().min(1, "Le titre est obligatoire"),
  description: trimmedOrNull,
  servings: intField("Le nombre de parts"),
  prepTime: intField("Le temps de préparation"),
  cookTime: intField("Le temps de cuisson"),
  difficulty: intField("La difficulté", 3),
  rating: floatField("La note", 5),
  author: trimmedOrNull,
  popular: z.preprocess(
    (v) => v === true || v === "true" || v === "on",
    z.boolean(),
  ),
  kcal: intField("Les calories"),
  protein: intField("Les protéines"),
  carbs: intField("Les glucides"),
  fat: intField("Les lipides"),
  ingredients,
  utensils,
  steps,
  tags: stringList,
  categories: stringList,
});

export type RecipeInput = z.infer<typeof recipeInputSchema>;
export type IngredientInput = RecipeInput["ingredients"][number];
export type UtensilInput = RecipeInput["utensils"][number];

export type ValidationResult =
  | { ok: true; data: RecipeInput }
  | { ok: false; errors: string[] };

/** Validates a raw input object (JSON body or FormData-derived) with Zod. */
export function validateRecipeInput(raw: unknown): ValidationResult {
  const parsed = recipeInputSchema.safeParse(raw);
  if (parsed.success) return { ok: true, data: parsed.data };
  const errors = parsed.error.issues.map((i) => i.message);
  return { ok: false, errors: [...new Set(errors)] };
}

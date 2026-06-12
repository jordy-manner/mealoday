// Seasonal produce dataset (fruits, vegetables, herbs, pulses) for /saisons.
// Committed, Zod-validated, no external runtime API: lib/data/seasonality.json
// (sources: Greenpeace, Interfel, chambres d'agriculture — see its _meta).
// Carbon footprint (ecv, kg CO2e/kg) comes from a committed ADEME Agribalyse
// snapshot (lib/data/carbon-ademe.json), merged by slug; items without an
// Agribalyse match keep ecv: null and their carbon UI stays hidden.

import { z } from "zod";
import seasonalityJson from "@/lib/data/seasonality.json";
import carbonJson from "@/lib/data/carbon-ademe.json";
import { hueForSlug, type Produce, type ProduceCategory } from "@/lib/seasons-data";

const ItemSchema = z.object({
  slug: z.string().min(1),
  label: z.string().min(1),
  category: z.enum(["fruits", "legumes", "herbes", "legumineuses"]),
  months: z.array(z.number().int().min(1).max(12)).min(1),
});

const FileSchema = z.object({ items: z.array(ItemSchema).min(1) });

const CarbonSchema = z.object({ ecv: z.record(z.string(), z.number().nonnegative()) });
// Carbon footprint per produce slug (kg CO2e/kg), from the committed ADEME snapshot.
const CARBON = CarbonSchema.parse(carbonJson).ecv;

// Source categories are unaccented; map them to the displayed (accented) ones.
const CATEGORY: Record<z.infer<typeof ItemSchema>["category"], ProduceCategory> = {
  fruits: "fruits",
  legumes: "légumes",
  herbes: "herbes",
  legumineuses: "légumineuses",
};

// Validated at module load: a malformed data file fails fast on the server.
const { items } = FileSchema.parse(seasonalityJson);

/** All seasonal produce, sorted by display name (French collation). */
export const PRODUCE: Produce[] = items
  .map((it): Produce => ({
    name: it.label,
    slug: it.slug,
    months: [...new Set(it.months.filter((m) => m >= 1 && m <= 12))].sort((a, b) => a - b),
    ecv: CARBON[it.slug] ?? null,
    category: CATEGORY[it.category],
    hue: hueForSlug(it.slug),
  }))
  .sort((a, b) => a.name.localeCompare(b.name, "fr"));

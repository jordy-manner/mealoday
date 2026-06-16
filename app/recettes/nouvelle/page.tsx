import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getMediaStore } from "@/lib/media";
import { Icon } from "../../components/icons";
import { createRecipeAction } from "../actions";
import { CreateFlow } from "./create-flow";
import { geminiConfigured } from "@/lib/settings";

export const metadata = { title: "Nouvelle recette" };

// Catalogs (ingredients/units/tags/categories) read from the DB → on demand.
export const dynamic = "force-dynamic";

type Method = "choose" | "manual" | "web" | "scan";

export default async function NewRecipePage({
  searchParams,
}: {
  searchParams: Promise<{ method?: string }>;
}) {
  const { method } = await searchParams;
  const initialMethod: Method =
    method === "manual" || method === "web" || method === "scan" ? method : "choose";
  const [ingredients, units, utensils, tags, categories, unitTypes, scanEnabled] = await Promise.all([
    prisma.ingredient.findMany({
      orderBy: { name: "asc" },
      select: { name: true, aisleId: true, defaultUnitId: true, defaultUnit: { select: { name: true } } },
    }),
    prisma.unit.findMany({ orderBy: { name: "asc" }, select: { name: true, abbreviation: true } }),
    prisma.utensil.findMany({ orderBy: { name: "asc" }, select: { name: true } }),
    prisma.tag.findMany({ orderBy: { name: "asc" }, select: { name: true } }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { name: true } }),
    prisma.unitType.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    geminiConfigured(),
  ]);

  return (
    <main className="mx-auto w-full max-w-content animate-fade-up px-[18px] pb-20 pt-7 sm:px-8">
      <Link
        href="/recettes"
        className="inline-flex items-center gap-2 py-1.5 text-[15px] font-semibold text-ink-soft transition hover:text-accent"
      >
        <Icon name="back" size={18} /> Retour
      </Link>
      <div className="mt-3">
        <CreateFlow
          initialMethod={initialMethod}
          action={createRecipeAction}
          ingredientOptions={ingredients.map((i) => ({
            name: i.name,
            defaultUnit: i.defaultUnit?.name ?? null,
            incomplete: !i.defaultUnitId || !i.aisleId,
          }))}
          unitOptions={units.map((u) => ({ name: u.name, abbreviation: u.abbreviation }))}
          utensilOptions={utensils.map((u) => u.name)}
          tagOptions={tags.map((t) => t.name)}
          categoryOptions={categories.map((c) => c.name)}
          unitTypeOptions={unitTypes}
          mediaEnabled={getMediaStore().configured}
          scanEnabled={scanEnabled}
        />
      </div>
    </main>
  );
}

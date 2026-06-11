"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  recipeIngredientsCreate,
  recipeInputFromFormData,
  recipeScalars,
  recipeTagsCreate,
  recipeUtensilsCreate,
} from "@/lib/recipes";

// State returned to the form via useActionState (error display).
export type FormState = { error: string | null };

export async function createRecipeAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const result = recipeInputFromFormData(formData);
  if (!result.ok) {
    return { error: result.errors.join(" · ") };
  }

  const recipe = await prisma.recipe.create({
    data: {
      ...recipeScalars(result.data),
      recipeIngredients: { create: recipeIngredientsCreate(result.data) },
      recipeUtensils: { create: recipeUtensilsCreate(result.data) },
      recipeTags: { create: recipeTagsCreate(result.data) },
    },
  });

  revalidatePath("/recipes");
  redirect(`/recipes/${recipe.id}`);
}

export async function updateRecipeAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const result = recipeInputFromFormData(formData);
  if (!result.ok) {
    return { error: result.errors.join(" · ") };
  }

  const existing = await prisma.recipe.findUnique({ where: { id } });
  if (!existing) {
    return { error: "Recette introuvable" };
  }

  await prisma.recipe.update({
    where: { id },
    data: {
      ...recipeScalars(result.data),
      recipeIngredients: {
        deleteMany: {},
        create: recipeIngredientsCreate(result.data),
      },
      recipeUtensils: {
        deleteMany: {},
        create: recipeUtensilsCreate(result.data),
      },
      recipeTags: { deleteMany: {}, create: recipeTagsCreate(result.data) },
    },
  });

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${id}`);
  redirect(`/recipes/${id}`);
}

export async function deleteRecipeAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id"));
  await prisma.recipe.delete({ where: { id } });

  revalidatePath("/recipes");
  redirect("/recipes");
}
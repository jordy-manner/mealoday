-- Recipe sources: where a recipe comes from (URLs / free-text attributions),
-- an owned one-to-many list on Recipe (like Step). Additive, no backfill.

-- CreateEnum
CREATE TYPE "SourceKind" AS ENUM ('url', 'text');

-- CreateTable
CREATE TABLE "RecipeSource" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "kind" "SourceKind" NOT NULL DEFAULT 'text',
    "position" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "RecipeSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecipeSource_recipeId_idx" ON "RecipeSource"("recipeId");

-- AddForeignKey
ALTER TABLE "RecipeSource" ADD CONSTRAINT "RecipeSource_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

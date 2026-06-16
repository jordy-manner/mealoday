-- AlterTable
ALTER TABLE "RecipeIngredient" ADD COLUMN     "sectionId" TEXT;

-- AlterTable
ALTER TABLE "Step" ADD COLUMN     "sectionId" TEXT;

-- CreateTable
CREATE TABLE "IngredientSection" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "IngredientSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StepSection" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StepSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IngredientSection_recipeId_idx" ON "IngredientSection"("recipeId");

-- CreateIndex
CREATE INDEX "StepSection_recipeId_idx" ON "StepSection"("recipeId");

-- CreateIndex
CREATE INDEX "RecipeIngredient_sectionId_idx" ON "RecipeIngredient"("sectionId");

-- CreateIndex
CREATE INDEX "Step_sectionId_idx" ON "Step"("sectionId");

-- AddForeignKey
ALTER TABLE "Step" ADD CONSTRAINT "Step_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "StepSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngredientSection" ADD CONSTRAINT "IngredientSection_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StepSection" ADD CONSTRAINT "StepSection_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "IngredientSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

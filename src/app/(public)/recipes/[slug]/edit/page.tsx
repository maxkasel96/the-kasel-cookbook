import { notFound } from "next/navigation";

import { getRecipeBySlug } from "@/lib/db/recipes";

import RecipeEditForm from "./recipe-edit-form";

type RecipeEditPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function RecipeEditPage({ params }: RecipeEditPageProps) {
  const { slug } = await params;
  const recipe = await getRecipeBySlug(slug);

  if (!recipe) {
    notFound();
  }

  const ingredients = (recipe.recipe_ingredients ?? []).map((ingredient: any) => ({
    id: String(ingredient.id),
    ingredientText: ingredient.ingredient_text ?? "",
    quantity: ingredient.quantity ? String(ingredient.quantity) : "",
    unit: ingredient.unit ?? "",
    note: ingredient.note ?? "",
    isOptional: Boolean(ingredient.is_optional),
  }));

  const steps = (recipe.recipe_instruction_steps ?? []).map((step: any) => ({
    id: String(step.id),
    content: step.content ?? "",
  }));

  return (
    <RecipeEditForm
      recipe={{
        id: String(recipe.id),
        slug: recipe.slug,
        title: recipe.title,
        description: recipe.description,
        ingredients,
        steps,
      }}
    />
  );
}

import { notFound } from "next/navigation";

import { getRecipeForEditBySlug } from "@/lib/db/recipes";

import RecipeEditForm from "./recipe-edit-form";

type RecipeEditPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function RecipeEditPage({ params }: RecipeEditPageProps) {
  const { slug } = await params;
  const recipe = await getRecipeForEditBySlug(slug);

  if (!recipe) {
    notFound();
  }

  const steps = (recipe.recipe_instruction_steps ?? []).map((step: any) => ({
    id: String(step.id),
    content: step.content ?? "",
    ingredientIds: Array.isArray(step.ingredient_ids)
      ? step.ingredient_ids.map((ingredientId: any) => String(ingredientId))
      : [],
  }));

  const ingredientStepMap = new Map<string, string[]>();
  steps.forEach((step) => {
    step.ingredientIds.forEach((ingredientId) => {
      const existing = ingredientStepMap.get(ingredientId) ?? [];
      ingredientStepMap.set(ingredientId, [...existing, step.id]);
    });
  });

  const ingredients = (recipe.recipe_ingredients ?? []).map((ingredient: any) => ({
    id: String(ingredient.id),
    ingredientText: ingredient.ingredient_text ?? "",
    quantity: ingredient.quantity ? String(ingredient.quantity) : "",
    unit: ingredient.unit ?? "",
    note: ingredient.note ?? "",
    isOptional: Boolean(ingredient.is_optional),
    assignedStepIds: ingredientStepMap.get(String(ingredient.id)) ?? [],
  }));

  const tags = (recipe.recipe_tags ?? [])
    .map((tagLink: any) => ({
      id: String(tagLink.tags?.id ?? tagLink.tag_id ?? tagLink.id),
      name: tagLink.tags?.name ?? "",
      category: tagLink.tags?.category ?? null,
    }))
    .filter((tag: { name: string }) => tag.name);

  const categories = (recipe.recipe_categories ?? [])
    .map((categoryLink: any) => ({
      id: String(
        categoryLink.categories?.id ??
          categoryLink.category_id ??
          categoryLink.id
      ),
      name: categoryLink.categories?.name ?? "",
    }))
    .filter((category: { name: string }) => category.name);

  return (
    <RecipeEditForm
      recipe={{
        id: String(recipe.id),
        slug: recipe.slug,
        title: recipe.title,
        description: recipe.description,
        prepMinutes: recipe.prep_minutes ?? null,
        cookMinutes: recipe.cook_minutes ?? null,
        servings: recipe.servings ?? null,
        ingredients,
        steps,
        tags,
        categories,
      }}
    />
  );
}

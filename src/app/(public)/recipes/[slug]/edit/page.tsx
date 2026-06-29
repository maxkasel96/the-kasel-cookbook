import { notFound } from "next/navigation";

import { getRecipeForEditBySlug } from "@/lib/db/recipes";

import RecipeEditForm from "./recipe-edit-form";

type RecipeEditPageProps = {
  params: Promise<{ slug: string }>;
};

type StepIngredientLink = {
  ingredient_id?: string | number | null;
};

type EditableStep = {
  id?: string | number | null;
  content?: string | null;
  recipe_instruction_step_ingredients?: StepIngredientLink[] | null;
};

type EditableIngredient = {
  id?: string | number | null;
  ingredient_text?: string | null;
  quantity?: string | number | null;
  unit?: string | null;
  note?: string | null;
  is_optional?: boolean | null;
};

type EditableTagLink = {
  id?: string | number | null;
  tag_id?: string | number | null;
  tags?:
    | {
        id?: string | number | null;
        name?: string | null;
        category?: string | null;
      }
    | Array<{
        id?: string | number | null;
        name?: string | null;
        category?: string | null;
      }>
    | null;
};

type EditableCategoryLink = {
  id?: string | number | null;
  category_id?: string | number | null;
  categories?:
    | {
        id?: string | number | null;
        name?: string | null;
      }
    | Array<{
        id?: string | number | null;
        name?: string | null;
      }>
    | null;
};

const getFirst = <T,>(value: T | T[] | null | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function RecipeEditPage({ params }: RecipeEditPageProps) {
  const { slug } = await params;
  const recipe = await getRecipeForEditBySlug(slug);

  if (!recipe) {
    notFound();
  }

  const steps = ((recipe.recipe_instruction_steps ?? []) as EditableStep[]).map((step) => ({
    id: String(step.id),
    content: step.content ?? "",
  }));

  const ingredientStepMap = new Map<string, string[]>();
  ((recipe.recipe_instruction_steps ?? []) as EditableStep[]).forEach((step) => {
    const stepId = String(step.id);
    (step.recipe_instruction_step_ingredients ?? []).forEach(
      (link) => {
        const ingredientId = String(link.ingredient_id);
        const existing = ingredientStepMap.get(ingredientId) ?? [];
        ingredientStepMap.set(ingredientId, [...existing, stepId]);
      }
    );
  });

  const ingredients = ((recipe.recipe_ingredients ?? []) as EditableIngredient[]).map((ingredient) => ({
    id: String(ingredient.id),
    ingredientText: ingredient.ingredient_text ?? "",
    quantity: ingredient.quantity ? String(ingredient.quantity) : "",
    unit: ingredient.unit ?? "",
    note: ingredient.note ?? "",
    isOptional: Boolean(ingredient.is_optional),
    assignedStepIds: ingredientStepMap.get(String(ingredient.id)) ?? [],
  }));

  const tags = (recipe.recipe_tags ?? [])
    .map((tagLink: EditableTagLink) => {
      const tag = getFirst(tagLink.tags);
      return {
        id: String(tag?.id ?? tagLink.tag_id ?? tagLink.id),
        name: tag?.name ?? "",
        category: tag?.category ?? null,
      };
    })
    .filter((tag: { name: string }) => tag.name);

  const categories = (recipe.recipe_categories ?? [])
    .map((categoryLink: EditableCategoryLink) => {
      const category = getFirst(categoryLink.categories);
      return {
        id: String(category?.id ?? categoryLink.category_id ?? categoryLink.id),
        name: category?.name ?? "",
      };
    })
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

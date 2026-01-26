import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type RecipeIngredientPayload = {
  ingredientText: string;
  quantity: string;
  unit: string;
  note: string;
  isOptional: boolean;
};

type RecipePayload = {
  title: string;
  description?: string;
  prepMinutes?: number | null;
  cookMinutes?: number | null;
  servings?: number | null;
  status?: "draft" | "published";
  isDeleted?: boolean;
  tags?: string[];
  ingredients: RecipeIngredientPayload[];
  steps: string[];
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RecipePayload;

    if (!body.title || body.title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }

    if (!body.ingredients || body.ingredients.length === 0) {
      return NextResponse.json(
        { error: "At least one ingredient is required." },
        { status: 400 }
      );
    }

    if (!body.steps || body.steps.length === 0) {
      return NextResponse.json(
        { error: "At least one preparation step is required." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();
    const slug = slugify(body.title);
    const status = body.status ?? "draft";

    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .insert({
        title: body.title.trim(),
        description: body.description?.trim() ?? null,
        slug,
        status,
        prep_minutes: body.prepMinutes ?? null,
        cook_minutes: body.cookMinutes ?? null,
        servings: body.servings ?? null,
        is_deleted: body.isDeleted ?? false,
      })
      .select("id")
      .single();

    if (recipeError || !recipe) {
      return NextResponse.json(
        { error: recipeError?.message ?? "Unable to create recipe." },
        { status: 500 }
      );
    }

    const ingredientRows = body.ingredients.map((ingredient, index) => {
      const parsedQuantity = Number(ingredient.quantity);
      return {
        recipe_id: recipe.id,
        position: index + 1,
        ingredient_text: ingredient.ingredientText,
        quantity: Number.isFinite(parsedQuantity) ? parsedQuantity : null,
        unit: ingredient.unit || null,
        note: ingredient.note || null,
        is_optional: ingredient.isOptional,
      };
    });

    const { error: ingredientError } = await supabase
      .from("recipe_ingredients")
      .insert(ingredientRows);

    if (ingredientError) {
      await supabase.from("recipes").delete().eq("id", recipe.id);
      return NextResponse.json(
        { error: ingredientError.message },
        { status: 500 }
      );
    }

    const stepRows = body.steps.map((content, index) => ({
      recipe_id: recipe.id,
      position: index + 1,
      content,
    }));

    const { error: stepError } = await supabase
      .from("recipe_instruction_steps")
      .insert(stepRows);

    if (stepError) {
      await supabase.from("recipes").delete().eq("id", recipe.id);
      return NextResponse.json({ error: stepError.message }, { status: 500 });
    }

    const tagNames =
      body.tags
        ?.map((tag) => tag.trim())
        .filter(Boolean)
        .filter(
          (tag, index, self) =>
            self.findIndex(
              (item) => item.toLowerCase() === tag.toLowerCase()
            ) === index
        ) ?? [];

    if (tagNames.length > 0) {
      const { data: existingTags, error: existingTagsError } = await supabase
        .from("tags")
        .select("id, name")
        .in("name", tagNames);

      if (existingTagsError) {
        await supabase.from("recipes").delete().eq("id", recipe.id);
        return NextResponse.json(
          { error: existingTagsError.message },
          { status: 500 }
        );
      }

      const existingTagNames = new Set(
        existingTags?.map((tag) => tag.name.toLowerCase()) ?? []
      );
      const newTagNames = tagNames.filter(
        (tag) => !existingTagNames.has(tag.toLowerCase())
      );

      let createdTags = existingTags ?? [];

      if (newTagNames.length > 0) {
        const { data: insertedTags, error: insertTagsError } = await supabase
          .from("tags")
          .insert(newTagNames.map((name) => ({ name })))
          .select("id, name");

        if (insertTagsError) {
          await supabase.from("recipes").delete().eq("id", recipe.id);
          return NextResponse.json(
            { error: insertTagsError.message },
            { status: 500 }
          );
        }

        createdTags = [...createdTags, ...(insertedTags ?? [])];
      }

      const tagLinks = createdTags.map((tag) => ({
        recipe_id: recipe.id,
        tag_id: tag.id,
      }));

      const { error: tagLinkError } = await supabase
        .from("recipe_tags")
        .insert(tagLinks);

      if (tagLinkError) {
        await supabase.from("recipes").delete().eq("id", recipe.id);
        return NextResponse.json(
          { error: tagLinkError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ id: recipe.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request." },
      { status: 400 }
    );
  }
}

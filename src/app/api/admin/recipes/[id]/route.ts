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
  prepMinutes?: number | string | null;
  cookMinutes?: number | string | null;
  servings?: number | string | null;
  status?: "draft" | "published";
  tags?: string[];
  categories?: string[];
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

const parseOptionalNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
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
    const status = body.status ?? "published";

    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .update({
        title: body.title.trim(),
        description: body.description?.trim() ?? null,
        prep_minutes: parseOptionalNumber(body.prepMinutes),
        cook_minutes: parseOptionalNumber(body.cookMinutes),
        servings: parseOptionalNumber(body.servings),
        slug,
        status,
      })
      .eq("id", id)
      .select("id, slug")
      .single();

    if (recipeError || !recipe) {
      return NextResponse.json(
        { error: recipeError?.message ?? "Unable to update recipe." },
        { status: 500 }
      );
    }

    const { error: ingredientDeleteError } = await supabase
      .from("recipe_ingredients")
      .delete()
      .eq("recipe_id", id);

    if (ingredientDeleteError) {
      return NextResponse.json(
        { error: ingredientDeleteError.message },
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
      return NextResponse.json(
        { error: ingredientError.message },
        { status: 500 }
      );
    }

    const { error: stepDeleteError } = await supabase
      .from("recipe_instruction_steps")
      .delete()
      .eq("recipe_id", id);

    if (stepDeleteError) {
      return NextResponse.json(
        { error: stepDeleteError.message },
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
      return NextResponse.json({ error: stepError.message }, { status: 500 });
    }

    const { error: tagDeleteError } = await supabase
      .from("recipe_tags")
      .delete()
      .eq("recipe_id", id);

    if (tagDeleteError) {
      return NextResponse.json(
        { error: tagDeleteError.message },
        { status: 500 }
      );
    }

    const tagNames = (body.tags ?? [])
      .map((tag) => tag.trim())
      .filter(Boolean);
    const uniqueTagMap = new Map(
      tagNames.map((tag) => [tag.toLowerCase(), tag])
    );
    const uniqueTags = Array.from(uniqueTagMap.values());

    if (uniqueTags.length > 0) {
      const { data: existingTags, error: existingTagsError } = await supabase
        .from("tags")
        .select("id, name")
        .in("name", uniqueTags);

      if (existingTagsError) {
        return NextResponse.json(
          { error: existingTagsError.message },
          { status: 500 }
        );
      }

      const existingNames = new Set(
        (existingTags ?? []).map((tag) => tag.name.toLowerCase())
      );
      const newTags = uniqueTags.filter(
        (tag) => !existingNames.has(tag.toLowerCase())
      );

      let insertedTags: { id: string; name: string }[] = [];
      if (newTags.length > 0) {
        const { data: createdTags, error: createTagsError } = await supabase
          .from("tags")
          .insert(newTags.map((name) => ({ name })))
          .select("id, name");

        if (createTagsError) {
          return NextResponse.json(
            { error: createTagsError.message },
            { status: 500 }
          );
        }

        insertedTags = createdTags ?? [];
      }

      const allTags = [...(existingTags ?? []), ...insertedTags];

      const { error: tagLinkError } = await supabase
        .from("recipe_tags")
        .insert(
          allTags.map((tag) => ({
            recipe_id: recipe.id,
            tag_id: tag.id,
          }))
        );

      if (tagLinkError) {
        return NextResponse.json(
          { error: tagLinkError.message },
          { status: 500 }
        );
      }
    }

    const { error: categoryDeleteError } = await supabase
      .from("recipe_categories")
      .delete()
      .eq("recipe_id", id);

    if (categoryDeleteError) {
      return NextResponse.json(
        { error: categoryDeleteError.message },
        { status: 500 }
      );
    }

    const categoryNames = (body.categories ?? [])
      .map((category) => category.trim())
      .filter(Boolean);
    const uniqueCategoryMap = new Map(
      categoryNames.map((category) => [category.toLowerCase(), category])
    );
    const uniqueCategories = Array.from(uniqueCategoryMap.values());

    if (uniqueCategories.length > 0) {
      const { data: existingCategories, error: existingCategoriesError } =
        await supabase
          .from("categories")
          .select("id, name")
          .in("name", uniqueCategories);

      if (existingCategoriesError) {
        return NextResponse.json(
          { error: existingCategoriesError.message },
          { status: 500 }
        );
      }

      const existingNames = new Set(
        (existingCategories ?? []).map((category) =>
          category.name.toLowerCase()
        )
      );
      const newCategories = uniqueCategories.filter(
        (category) => !existingNames.has(category.toLowerCase())
      );

      let insertedCategories: { id: string; name: string }[] = [];
      if (newCategories.length > 0) {
        const { data: createdCategories, error: createCategoriesError } =
          await supabase
            .from("categories")
            .insert(newCategories.map((name) => ({ name })))
            .select("id, name");

        if (createCategoriesError) {
          return NextResponse.json(
            { error: createCategoriesError.message },
            { status: 500 }
          );
        }

        insertedCategories = createdCategories ?? [];
      }

      const allCategories = [
        ...(existingCategories ?? []),
        ...insertedCategories,
      ];

      const { error: categoryLinkError } = await supabase
        .from("recipe_categories")
        .insert(
          allCategories.map((category) => ({
            recipe_id: recipe.id,
            category_id: category.id,
          }))
        );

      if (categoryLinkError) {
        return NextResponse.json(
          { error: categoryLinkError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ id: recipe.id, slug: recipe.slug }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request." },
      { status: 400 }
    );
  }
}

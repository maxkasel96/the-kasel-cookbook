"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Ingredient = {
  id: string;
  ingredientText: string;
  quantity: string;
  unit: string;
  note: string;
  isOptional: boolean;
};

type InstructionStep = {
  id: string;
  content: string;
};

type TagOption = {
  id: string;
  name: string;
  category?: string | null;
};

type CategoryOption = {
  id: string;
  name: string;
};

type RecipeEditFormProps = {
  recipe: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    prepMinutes: number | null;
    cookMinutes: number | null;
    servings: number | null;
    ingredients: Ingredient[];
    steps: InstructionStep[];
    tags: TagOption[];
    categories: CategoryOption[];
  };
};

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `temp-${Date.now()}-${Math.random()}`;

const ensureIngredient = (ingredients: Ingredient[]) =>
  ingredients.length
    ? ingredients
    : [
        {
          id: createId(),
          ingredientText: "",
          quantity: "",
          unit: "",
          note: "",
          isOptional: false,
        },
      ];

const ensureSteps = (steps: InstructionStep[]) =>
  steps.length ? steps : [{ id: createId(), content: "" }];

export default function RecipeEditForm({ recipe }: RecipeEditFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(recipe.title ?? "");
  const [prepMinutes, setPrepMinutes] = useState(
    recipe.prepMinutes ? String(recipe.prepMinutes) : ""
  );
  const [cookMinutes, setCookMinutes] = useState(
    recipe.cookMinutes ? String(recipe.cookMinutes) : ""
  );
  const [servings, setServings] = useState(
    recipe.servings ? String(recipe.servings) : ""
  );
  const [description, setDescription] = useState(recipe.description ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formStatus, setFormStatus] = useState<string | null>(null);
  const [currentSlug, setCurrentSlug] = useState(recipe.slug);
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    ensureIngredient(recipe.ingredients)
  );
  const [steps, setSteps] = useState<InstructionStep[]>(
    ensureSteps(recipe.steps)
  );
  const [availableTags, setAvailableTags] = useState<TagOption[]>([]);
  const [selectedTags, setSelectedTags] = useState<TagOption[]>(
    recipe.tags ?? []
  );
  const [newTagName, setNewTagName] = useState("");
  const [availableCategories, setAvailableCategories] = useState<CategoryOption[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<CategoryOption[]>(
    recipe.categories ?? []
  );
  const [newCategoryName, setNewCategoryName] = useState("");

  const ingredientCount = useMemo(
    () => ingredients.filter((ingredient) => ingredient.ingredientText.trim()).length,
    [ingredients]
  );

  useEffect(() => {
    let isMounted = true;

    const fetchTags = async () => {
      setIsLoadingTags(true);

      try {
        const response = await fetch("/api/admin/tags");
        if (!response.ok) {
          throw new Error("Unable to load tags.");
        }
        const payload = (await response.json()) as { tags?: TagOption[] };
        if (isMounted) {
          const fetched = payload.tags ?? [];
          setAvailableTags(
            fetched.concat(
              recipe.tags.filter(
                (tag) =>
                  !fetched.some(
                    (item) =>
                      item.name.trim().toLowerCase() ===
                      tag.name.trim().toLowerCase()
                  )
              )
            )
          );
        }
      } catch {
        if (isMounted) {
          setAvailableTags(recipe.tags);
        }
      } finally {
        if (isMounted) {
          setIsLoadingTags(false);
        }
      }
    };

    fetchTags();

    return () => {
      isMounted = false;
    };
  }, [recipe.tags]);

  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      setIsLoadingCategories(true);

      try {
        const response = await fetch("/api/admin/categories");
        if (!response.ok) {
          throw new Error("Unable to load categories.");
        }
        const payload = (await response.json()) as {
          categories?: CategoryOption[];
        };
        if (isMounted) {
          const fetched = payload.categories ?? [];
          setAvailableCategories(
            fetched.concat(
              recipe.categories.filter(
                (category) =>
                  !fetched.some(
                    (item) =>
                      item.name.trim().toLowerCase() ===
                      category.name.trim().toLowerCase()
                  )
              )
            )
          );
        }
      } catch {
        if (isMounted) {
          setAvailableCategories(recipe.categories);
        }
      } finally {
        if (isMounted) {
          setIsLoadingCategories(false);
        }
      }
    };

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, [recipe.categories]);

  const normalizeTag = (name: string) => name.trim().toLowerCase();

  const toggleTag = (tag: TagOption) => {
    setSelectedTags((prev) => {
      const isSelected = prev.some(
        (selected) => normalizeTag(selected.name) === normalizeTag(tag.name)
      );

      if (isSelected) {
        return prev.filter(
          (selected) =>
            normalizeTag(selected.name) !== normalizeTag(tag.name)
        );
      }

      return [...prev, tag];
    });
  };

  const addNewTag = () => {
    const trimmed = newTagName.trim();
    if (!trimmed) return;

    const existing = availableTags.find(
      (tag) => normalizeTag(tag.name) === normalizeTag(trimmed)
    );

    const tagToAdd =
      existing ?? {
        id: `new-${createId()}`,
        name: trimmed,
      };

    setAvailableTags((prev) => (existing ? prev : [...prev, tagToAdd]));
    setSelectedTags((prev) => {
      const isSelected = prev.some(
        (tag) => normalizeTag(tag.name) === normalizeTag(tagToAdd.name)
      );
      return isSelected ? prev : [...prev, tagToAdd];
    });
    setNewTagName("");
  };

  const removeSelectedTag = (tagToRemove: TagOption) => {
    setSelectedTags((prev) =>
      prev.filter(
        (tag) => normalizeTag(tag.name) !== normalizeTag(tagToRemove.name)
      )
    );
  };

  const normalizeCategory = (name: string) => name.trim().toLowerCase();

  const toggleCategory = (category: CategoryOption) => {
    setSelectedCategories((prev) => {
      const isSelected = prev.some(
        (selected) =>
          normalizeCategory(selected.name) === normalizeCategory(category.name)
      );

      if (isSelected) {
        return prev.filter(
          (selected) =>
            normalizeCategory(selected.name) !== normalizeCategory(category.name)
        );
      }

      return [...prev, category];
    });
  };

  const addNewCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    const existing = availableCategories.find(
      (category) =>
        normalizeCategory(category.name) === normalizeCategory(trimmed)
    );

    const categoryToAdd =
      existing ?? {
        id: `new-${createId()}`,
        name: trimmed,
      };

    setAvailableCategories((prev) =>
      existing ? prev : [...prev, categoryToAdd]
    );
    setSelectedCategories((prev) => {
      const isSelected = prev.some(
        (category) =>
          normalizeCategory(category.name) ===
          normalizeCategory(categoryToAdd.name)
      );
      return isSelected ? prev : [...prev, categoryToAdd];
    });
    setNewCategoryName("");
  };

  const removeSelectedCategory = (categoryToRemove: CategoryOption) => {
    setSelectedCategories((prev) =>
      prev.filter(
        (category) =>
          normalizeCategory(category.name) !==
          normalizeCategory(categoryToRemove.name)
      )
    );
  };

  const parseOptionalNumber = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const handleIngredientChange = (
    id: string,
    field: keyof Ingredient,
    value: string | boolean
  ) => {
    setIngredients((prev) =>
      prev.map((ingredient) =>
        ingredient.id === id
          ? { ...ingredient, [field]: value }
          : ingredient
      )
    );
  };

  const addIngredient = () => {
    setIngredients((prev) => [
      ...prev,
      {
        id: createId(),
        ingredientText: "",
        quantity: "",
        unit: "",
        note: "",
        isOptional: false,
      },
    ]);
  };

  const removeIngredient = (id: string) => {
    setIngredients((prev) =>
      prev.length > 1 ? prev.filter((ingredient) => ingredient.id !== id) : prev
    );
  };

  const handleStepChange = (id: string, value: string) => {
    setSteps((prev) =>
      prev.map((step) => (step.id === id ? { ...step, content: value } : step))
    );
  };

  const addStep = () => {
    setSteps((prev) => [...prev, { id: createId(), content: "" }]);
  };

  const removeStep = (id: string) => {
    setSteps((prev) => (prev.length > 1 ? prev.filter((step) => step.id !== id) : prev));
  };

  const handleSave = async (status: "draft" | "published") => {
    setFormError(null);
    setFormStatus(null);

    if (!title.trim()) {
      setFormError("Add a recipe title before saving.");
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      prepMinutes: parseOptionalNumber(prepMinutes),
      cookMinutes: parseOptionalNumber(cookMinutes),
      servings: parseOptionalNumber(servings),
      status,
      tags: selectedTags.map((tag) => tag.name),
      categories: selectedCategories.map((category) => category.name),
      ingredients: ingredients
        .map((ingredient) => ({
          ingredientText: ingredient.ingredientText.trim(),
          quantity: ingredient.quantity.trim(),
          unit: ingredient.unit.trim(),
          note: ingredient.note.trim(),
          isOptional: ingredient.isOptional,
        }))
        .filter(
          (ingredient) =>
            ingredient.ingredientText ||
            ingredient.quantity ||
            ingredient.unit ||
            ingredient.note
        ),
      steps: steps.map((step) => step.content.trim()).filter(Boolean),
    };

    if (payload.ingredients.length === 0) {
      setFormError("Add at least one ingredient before saving.");
      return;
    }

    if (payload.steps.length === 0) {
      setFormError("Add at least one preparation step before saving.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/recipes/${recipe.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorPayload = (await response.json()) as { error?: string };
        throw new Error(errorPayload.error ?? "Unable to update recipe.");
      }

      const responsePayload = (await response.json()) as { slug?: string };
      const nextSlug = responsePayload.slug ?? currentSlug;

      setFormStatus(
        status === "published"
          ? "Recipe updated and published."
          : "Draft updated successfully."
      );

      if (nextSlug !== currentSlug) {
        setCurrentSlug(nextSlug);
        router.replace(`/recipes/${nextSlug}/edit`);
      }
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to update recipe."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-6 py-12 text-foreground">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <header className="flex flex-col gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent-2">
            Saved recipe
          </p>
          <h1 className="text-4xl font-semibold text-foreground">Edit recipe</h1>
          <p className="max-w-2xl text-base leading-7 text-text-muted">
            Update the recipe details, ingredients, and preparation steps. Changes
            will immediately refresh the saved recipe entry.
          </p>
        </header>

        <form className="flex flex-col gap-10 rounded-3xl border border-border bg-surface p-8 shadow-sm">
          <section className="flex flex-col gap-5">
            <h2 className="text-xl font-semibold">Recipe details</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium">
                Title
                <input
                  className="h-12 rounded-2xl border border-border bg-surface-2 px-4 text-base text-foreground focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/40"
                  placeholder="Citrus herb chicken"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </label>
              <div className="rounded-2xl border border-dashed border-border-strong bg-surface-2 px-4 py-3 text-sm text-text-muted">
                Slugs are generated automatically from the recipe title when you
                save.
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="flex flex-col gap-2 text-sm font-medium">
                Prep minutes
                <input
                  className="h-12 rounded-2xl border border-border bg-surface-2 px-4 text-base text-foreground focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/40"
                  inputMode="numeric"
                  placeholder="20"
                  value={prepMinutes}
                  onChange={(event) => setPrepMinutes(event.target.value)}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium">
                Cook minutes
                <input
                  className="h-12 rounded-2xl border border-border bg-surface-2 px-4 text-base text-foreground focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/40"
                  inputMode="numeric"
                  placeholder="45"
                  value={cookMinutes}
                  onChange={(event) => setCookMinutes(event.target.value)}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium">
                Servings
                <input
                  className="h-12 rounded-2xl border border-border bg-surface-2 px-4 text-base text-foreground focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/40"
                  inputMode="numeric"
                  placeholder="4"
                  value={servings}
                  onChange={(event) => setServings(event.target.value)}
                />
              </label>
            </div>
            <label className="flex flex-col gap-2 text-sm font-medium">
              Description
              <textarea
                className="min-h-[120px] rounded-2xl border border-border bg-surface-2 px-4 py-3 text-base text-foreground focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/40"
                placeholder="Bright, savory chicken with citrus zest and herbs."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>
            <div className="flex flex-col gap-4 rounded-3xl border border-border bg-surface-2 p-6">
              <div className="flex flex-col gap-2">
                <h3 className="text-base font-semibold">Tags & categories</h3>
                <p className="text-sm text-text-muted">
                  Set recipe tags and categories independently to organize your
                  recipes.
                </p>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface px-4 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
                      Tags
                    </p>
                    <p className="mt-2 text-sm text-text-muted">
                      Select existing tags or add a new tag.
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
                      Existing tags
                    </p>
                    {isLoadingTags ? (
                      <p className="mt-3 text-sm text-text-muted">
                        Loading tags...
                      </p>
                    ) : availableTags.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {availableTags.map((tag) => {
                          const isSelected = selectedTags.some(
                            (selected) =>
                              normalizeTag(selected.name) ===
                              normalizeTag(tag.name)
                          );
                          return (
                            <button
                              key={tag.id}
                              className={`rounded-full border px-4 py-1 text-sm font-semibold transition ${
                                isSelected
                                  ? "border-accent bg-accent/10 text-accent"
                                  : "border-border-strong text-foreground hover:border-accent-2 hover:text-accent-2"
                              }`}
                              type="button"
                              onClick={() => toggleTag(tag)}
                            >
                              {tag.name}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-text-muted">
                        No existing tags found.
                      </p>
                    )}
                  </div>
                  <label className="flex flex-col gap-2 text-sm font-medium">
                    Add a new tag
                    <div className="flex flex-wrap gap-3">
                      <input
                        className="h-11 flex-1 rounded-2xl border border-border bg-surface px-4 text-base text-foreground focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/40"
                        placeholder="Seasonal"
                        value={newTagName}
                        onChange={(event) => setNewTagName(event.target.value)}
                      />
                      <button
                        className="rounded-full border border-border-strong px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent-2 hover:text-accent-2"
                        type="button"
                        onClick={addNewTag}
                      >
                        Add new tag
                      </button>
                    </div>
                  </label>
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-semibold text-text-muted">
                      Selected tags
                    </p>
                    {selectedTags.length ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedTags.map((tag) => (
                          <button
                            key={tag.id}
                            className="rounded-full border border-border-strong px-4 py-1 text-sm font-semibold text-foreground transition hover:border-danger hover:text-danger"
                            type="button"
                            onClick={() => removeSelectedTag(tag)}
                          >
                            {tag.name} ×
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-text-muted">
                        No tags selected yet.
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface px-4 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
                      Categories
                    </p>
                    <p className="mt-2 text-sm text-text-muted">
                      Select existing categories or add a new category.
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
                      Existing categories
                    </p>
                    {isLoadingCategories ? (
                      <p className="mt-3 text-sm text-text-muted">
                        Loading categories...
                      </p>
                    ) : availableCategories.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {availableCategories.map((category) => {
                          const isSelected = selectedCategories.some(
                            (selected) =>
                              normalizeCategory(selected.name) ===
                              normalizeCategory(category.name)
                          );
                          return (
                            <button
                              key={category.id}
                              className={`rounded-full border px-4 py-1 text-sm font-semibold transition ${
                                isSelected
                                  ? "border-accent bg-accent/10 text-accent"
                                  : "border-border-strong text-foreground hover:border-accent-2 hover:text-accent-2"
                              }`}
                              type="button"
                              onClick={() => toggleCategory(category)}
                            >
                              {category.name}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-text-muted">
                        No existing categories found.
                      </p>
                    )}
                  </div>
                  <label className="flex flex-col gap-2 text-sm font-medium">
                    Add a new category
                    <div className="flex flex-wrap gap-3">
                      <input
                        className="h-11 flex-1 rounded-2xl border border-border bg-surface px-4 text-base text-foreground focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/40"
                        placeholder="Dinner"
                        value={newCategoryName}
                        onChange={(event) =>
                          setNewCategoryName(event.target.value)
                        }
                      />
                      <button
                        className="rounded-full border border-border-strong px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent-2 hover:text-accent-2"
                        type="button"
                        onClick={addNewCategory}
                      >
                        Add new category
                      </button>
                    </div>
                  </label>
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-semibold text-text-muted">
                      Selected categories
                    </p>
                    {selectedCategories.length ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedCategories.map((category) => (
                          <button
                            key={category.id}
                            className="rounded-full border border-border-strong px-4 py-1 text-sm font-semibold text-foreground transition hover:border-danger hover:text-danger"
                            type="button"
                            onClick={() => removeSelectedCategory(category)}
                          >
                            {category.name} ×
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-text-muted">
                        No categories selected yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Ingredients</h2>
                <p className="text-sm text-text-muted">
                  {ingredientCount || 0} ingredient{ingredientCount === 1 ? "" : "s"} listed
                </p>
              </div>
              <button
                className="rounded-full border border-border-strong px-5 py-2 text-sm font-semibold text-foreground transition hover:border-accent-2 hover:text-accent-2"
                type="button"
                onClick={addIngredient}
              >
                Add ingredient
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {ingredients.map((ingredient, index) => (
                <div
                  key={ingredient.id}
                  className="rounded-3xl border border-border bg-surface-2 p-5"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-text-muted">
                      Ingredient {index + 1}
                    </p>
                    <button
                      className="text-xs font-semibold uppercase tracking-[0.2em] text-danger transition hover:text-accent"
                      type="button"
                      onClick={() => removeIngredient(ingredient.id)}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="flex flex-col gap-2 text-sm font-medium">
                      Ingredient
                      <input
                        className="h-11 rounded-2xl border border-border bg-surface px-4 text-base text-foreground focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/40"
                        placeholder="Chicken thighs"
                        value={ingredient.ingredientText}
                        onChange={(event) =>
                          handleIngredientChange(
                            ingredient.id,
                            "ingredientText",
                            event.target.value
                          )
                        }
                      />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="flex flex-col gap-2 text-sm font-medium">
                        Quantity
                        <input
                          className="h-11 rounded-2xl border border-border bg-surface px-4 text-base text-foreground focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/40"
                          inputMode="decimal"
                          placeholder="1.5"
                          value={ingredient.quantity}
                          onChange={(event) =>
                            handleIngredientChange(
                              ingredient.id,
                              "quantity",
                              event.target.value
                            )
                          }
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm font-medium">
                        Unit
                        <input
                          className="h-11 rounded-2xl border border-border bg-surface px-4 text-base text-foreground focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/40"
                          placeholder="lbs"
                          value={ingredient.unit}
                          onChange={(event) =>
                            handleIngredientChange(
                              ingredient.id,
                              "unit",
                              event.target.value
                            )
                          }
                        />
                      </label>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-[2fr,1fr]">
                    <label className="flex flex-col gap-2 text-sm font-medium">
                      Note
                      <input
                        className="h-11 rounded-2xl border border-border bg-surface px-4 text-base text-foreground focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/40"
                        placeholder="Finely chopped"
                        value={ingredient.note}
                        onChange={(event) =>
                          handleIngredientChange(
                            ingredient.id,
                            "note",
                            event.target.value
                          )
                        }
                      />
                    </label>
                    <label className="flex items-center gap-3 text-sm font-medium">
                      <input
                        className="h-4 w-4 rounded border-border"
                        type="checkbox"
                        checked={ingredient.isOptional}
                        onChange={(event) =>
                          handleIngredientChange(
                            ingredient.id,
                            "isOptional",
                            event.target.checked
                          )
                        }
                      />
                      Optional ingredient
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Preparation steps</h2>
                <p className="text-sm text-text-muted">
                  Order your instructions as they should appear in the recipe.
                </p>
              </div>
              <button
                className="rounded-full border border-border-strong px-5 py-2 text-sm font-semibold text-foreground transition hover:border-accent-2 hover:text-accent-2"
                type="button"
                onClick={addStep}
              >
                Add step
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className="rounded-3xl border border-border bg-surface-2 p-5"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-text-muted">Step {index + 1}</p>
                    <button
                      className="text-xs font-semibold uppercase tracking-[0.2em] text-danger transition hover:text-accent"
                      type="button"
                      onClick={() => removeStep(step.id)}
                    >
                      Remove
                    </button>
                  </div>
                  <textarea
                    className="min-h-[120px] w-full rounded-2xl border border-border bg-surface px-4 py-3 text-base text-foreground focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/40"
                    placeholder="Describe the prep work for this step."
                    value={step.content}
                    onChange={(event) => handleStepChange(step.id, event.target.value)}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-4 rounded-3xl border border-border bg-surface-2 p-6">
            <h2 className="text-lg font-semibold">Ready to update?</h2>
            <p className="text-sm text-text-muted">
              Updates replace the existing ingredients and preparation steps for
              this recipe.
            </p>
            {formError ? (
              <p className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                {formError}
              </p>
            ) : null}
            {formStatus ? (
              <p className="rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
                {formStatus}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white transition hover:bg-danger"
                type="button"
                onClick={() => handleSave("published")}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Update recipe"}
              </button>
              <button
                className="rounded-full border border-border-strong px-6 py-2 text-sm font-semibold text-foreground transition hover:border-accent-2 hover:text-accent-2"
                type="button"
                onClick={() => handleSave("draft")}
                disabled={isSaving}
              >
                Save as draft
              </button>
              <a
                className="rounded-full border border-border-strong px-6 py-2 text-sm font-semibold text-foreground transition hover:border-accent-2 hover:text-accent-2"
                href={`/recipes/${currentSlug}`}
              >
                View recipe
              </a>
            </div>
          </section>
        </form>
      </main>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
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

type RecipeEditFormProps = {
  recipe: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    ingredients: Ingredient[];
    steps: InstructionStep[];
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
  const [description, setDescription] = useState(recipe.description ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formStatus, setFormStatus] = useState<string | null>(null);
  const [currentSlug, setCurrentSlug] = useState(recipe.slug);
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    ensureIngredient(recipe.ingredients)
  );
  const [steps, setSteps] = useState<InstructionStep[]>(
    ensureSteps(recipe.steps)
  );

  const ingredientCount = useMemo(
    () => ingredients.filter((ingredient) => ingredient.ingredientText.trim()).length,
    [ingredients]
  );

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
      status,
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
                Recipe title updates will also refresh the URL slug used for this
                page.
              </div>
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

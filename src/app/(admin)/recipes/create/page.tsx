"use client";

import { useMemo, useState } from "react";

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

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `temp-${Date.now()}-${Math.random()}`;

export default function AdminCreateRecipePage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    {
      id: createId(),
      ingredientText: "",
      quantity: "",
      unit: "",
      note: "",
      isOptional: false,
    },
  ]);
  const [steps, setSteps] = useState<InstructionStep[]>([
    { id: createId(), content: "" },
  ]);

  const ingredientCount = useMemo(
    () => ingredients.filter((ingredient) => ingredient.ingredientText.trim())
      .length,
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

  return (
    <div className="min-h-screen bg-background px-6 py-12 text-foreground">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <header className="flex flex-col gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent-2">
            Admin
          </p>
          <h1 className="text-4xl font-semibold text-foreground">Create recipe</h1>
          <p className="max-w-2xl text-base leading-7 text-text-muted">
            Capture recipe descriptions, ingredient quantities, and preparation
            instructions before saving them to the database. This view lives under
            the admin route, keeping it private from unauthenticated visitors.
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
                Slug, prep time, and status fields can be added when wiring the
                backend. For now, focus on the core recipe content.
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
            <h2 className="text-lg font-semibold">Ready to save?</h2>
            <p className="text-sm text-text-muted">
              Saving will create entries in <code>recipes</code>,
              <code> recipe_ingredients</code>, and
              <code> recipe_instruction_steps</code>. Wire this form to your API
              handler when you are ready to persist data.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white transition hover:bg-danger"
                type="button"
              >
                Save recipe
              </button>
              <button
                className="rounded-full border border-border-strong px-6 py-2 text-sm font-semibold text-foreground transition hover:border-accent-2 hover:text-accent-2"
                type="button"
              >
                Save as draft
              </button>
            </div>
          </section>
        </form>
      </main>
    </div>
  );
}

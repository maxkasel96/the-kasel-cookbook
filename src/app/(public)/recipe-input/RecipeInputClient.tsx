"use client";

import Link from "next/link";
import { useState } from "react";

import {
  RECIPE_IMPORT_DRAFT_STORAGE_KEY,
  type ImportedRecipeDraft,
} from "@/lib/recipe-import";

type ParseResponse = {
  draft?: ImportedRecipeDraft;
  error?: string;
};

export default function RecipeInputClient() {
  const [recipeUrl, setRecipeUrl] = useState("");
  const [draft, setDraft] = useState<ImportedRecipeDraft | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleParseUrl = async () => {
    setError(null);
    setStatus(null);
    setDraft(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/recipe-input/parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: recipeUrl }),
      });

      const payload = (await response.json()) as ParseResponse;

      if (!response.ok || !payload.draft) {
        throw new Error(payload.error ?? "Unable to parse recipe URL right now.");
      }

      setDraft(payload.draft);
      setStatus("Recipe content extracted. Review and continue to Create Recipe.");
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to parse recipe URL right now.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseDraft = () => {
    if (!draft) return;
    window.localStorage.setItem(
      RECIPE_IMPORT_DRAFT_STORAGE_KEY,
      JSON.stringify(draft)
    );
    setStatus("Draft saved. Open Create Recipe to continue.");
  };

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Recipe Input</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Paste a recipe page URL and generate a structured draft that can be
          copied into your custom recipe form.
        </p>

        <label className="mt-5 block text-sm font-medium" htmlFor="recipe-url">
          Recipe page URL
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            id="recipe-url"
            name="recipe-url"
            type="url"
            value={recipeUrl}
            onChange={(event) => setRecipeUrl(event.target.value)}
            placeholder="https://example.com/my-recipe"
            className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm"
          />
          <button
            type="button"
            onClick={handleParseUrl}
            disabled={isLoading || !recipeUrl.trim()}
            className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Reading..." : "Read Recipe URL"}
          </button>
        </div>

        {status ? <p className="mt-3 text-sm text-emerald-700">{status}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Extracted Draft</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUseDraft}
              disabled={!draft}
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save Draft
            </button>
            <Link
              href="/admin/recipes/create"
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium"
            >
              Go to Create Recipe
            </Link>
          </div>
        </div>

        {!draft ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No draft yet. Enter a URL above to test the import framework.
          </p>
        ) : (
          <div className="mt-4 space-y-5 text-sm">
            <div>
              <p className="font-medium">Title</p>
              <p>{draft.title}</p>
            </div>
            <div>
              <p className="font-medium">Ingredients</p>
              <ul className="list-disc space-y-1 pl-5">
                {draft.ingredients.map((ingredient, index) => (
                  <li key={`${ingredient.text}-${index}`}>
                    {[ingredient.quantity, ingredient.unit, ingredient.text]
                      .filter(Boolean)
                      .join(" ")}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium">Steps</p>
              <ol className="list-decimal space-y-1 pl-5">
                {draft.steps.map((step, index) => (
                  <li key={`${step}-${index}`}>{step}</li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

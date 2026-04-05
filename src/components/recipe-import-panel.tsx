"use client";

import Link from "next/link";
import { type ReactNode, useState } from "react";

import { type ImportedRecipeDraft } from "@/lib/recipe-import";

type ParseResponse = {
  draft?: ImportedRecipeDraft;
  error?: string;
};

type RecipeImportPanelProps = {
  onUseDraft: (draft: ImportedRecipeDraft) => void | Promise<void>;
  useDraftButtonLabel?: string;
  title?: string;
  description?: string;
  emptyStateMessage?: string;
  headerActions?: ReactNode;
  secondaryLinkHref?: string;
  secondaryLinkLabel?: string;
};

export default function RecipeImportPanel({
  onUseDraft,
  useDraftButtonLabel = "Use Draft",
  title = "Recipe Input",
  description = "Paste a recipe page URL and generate a structured draft that can be copied into your custom recipe form.",
  emptyStateMessage = "No draft yet. Enter a URL above to test the import framework.",
  headerActions,
  secondaryLinkHref,
  secondaryLinkLabel,
}: RecipeImportPanelProps) {
  const [recipeUrl, setRecipeUrl] = useState("");
  const [draft, setDraft] = useState<ImportedRecipeDraft | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
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
      setStatus("Recipe content extracted. Review and continue.");
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

  const handleUseDraft = async () => {
    if (!draft) return;

    setError(null);
    setIsApplying(true);

    try {
      await onUseDraft(draft);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to use this recipe draft right now.";
      setError(message);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>

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
          <h3 className="text-xl font-semibold">Extracted Draft</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUseDraft}
              disabled={!draft || isApplying}
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isApplying ? "Applying..." : useDraftButtonLabel}
            </button>
            {secondaryLinkHref && secondaryLinkLabel ? (
              <Link
                href={secondaryLinkHref}
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium"
              >
                {secondaryLinkLabel}
              </Link>
            ) : null}
            {headerActions}
          </div>
        </div>

        {!draft ? (
          <p className="mt-4 text-sm text-muted-foreground">{emptyStateMessage}</p>
        ) : (
          <div className="mt-4 space-y-5 text-sm">
            <div>
              <p className="font-medium">Title</p>
              <p>{draft.title}</p>
            </div>
            <div>
              <p className="font-medium">Source URL</p>
              <a
                className="break-all text-accent-2 underline underline-offset-2"
                href={draft.sourceUrl}
                rel="noreferrer"
                target="_blank"
              >
                {draft.sourceUrl}
              </a>
            </div>
            {draft.description ? (
              <div>
                <p className="font-medium">Description</p>
                <p>{draft.description}</p>
              </div>
            ) : null}
            <div>
              <p className="font-medium">Ingredients</p>
              <ul className="list-disc space-y-1 pl-5">
                {draft.ingredients.map((ingredient, index) => (
                  <li key={`${ingredient.text}-${index}`}>
                    {[ingredient.quantity, ingredient.unit, ingredient.text]
                      .filter(Boolean)
                      .join(" ")}
                    {ingredient.note ? ` (${ingredient.note})` : ""}
                    {ingredient.optional ? " [optional]" : ""}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium">Steps</p>
              <ol className="list-decimal space-y-1 pl-5">
                {draft.steps.map((step, index) => (
                  <li key={`${step}-${index}`}>
                    <span>{step}</span>
                    {draft.stepIngredientIndexes?.[index]?.length ? (
                      <span className="block text-muted-foreground">
                        Uses:{" "}
                        {draft.stepIngredientIndexes[index]
                          .map((ingredientIndex) => {
                            const ingredient =
                              draft.ingredients[ingredientIndex - 1];
                            return ingredient?.text?.trim()
                              ? ingredient.text.trim()
                              : `Ingredient ${ingredientIndex}`;
                          })
                          .join(", ")}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

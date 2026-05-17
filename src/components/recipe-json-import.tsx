"use client";

import { useState, type ReactNode } from "react";
import { ZodError } from "zod";

import { type ImportedRecipeDraft, sanitizeImportedRecipeDraft } from "@/lib/recipe-import";

type Messages = {
  parseButton?: string;
  applyButton?: string;
  insertExample?: string;
  importErrorTitle?: string;
  importErrorTip?: string;
  parsedStatus?: string;
  helpTitle?: string;
  schemaTitle?: string;
  exampleTitle?: string;
  copyButton?: string;
};

type Props = {
  onUseDraft: (draft: ImportedRecipeDraft) => void | Promise<void>;
  useDraftButtonLabel?: string;
  title?: string;
  description?: string;
  headerActions?: ReactNode;
  messages?: Messages;
};

export default function RecipeJsonImport({
  onUseDraft,
  useDraftButtonLabel = "Use Draft",
  title = "Recipe JSON Import",
  description = "Paste structured recipe JSON and generate a draft that can be used in the Create Recipe form.",
  headerActions,
  messages,
}: Props) {
  const [rawJson, setRawJson] = useState("");
  const [draft, setDraft] = useState<ImportedRecipeDraft | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const example = {
    sourceUrl: "https://example.com/simple-pancakes",
    title: "Simple Pancakes",
    description: "Fluffy, easy pancakes perfect for weekend brunch.",
    servings: "4",
    prepMinutes: "10",
    cookMinutes: "15",
    ingredients: [
      { text: "all-purpose flour", quantity: "1.5", unit: "cups", note: "", optional: false },
      { text: "milk", quantity: "1.25", unit: "cups", note: "", optional: false },
      { text: "egg", quantity: "1", unit: "", note: "beaten", optional: false },
    ],
    steps: [
      "Whisk the dry ingredients together.",
      "Add the milk and egg, whisk until smooth.",
      "Cook on a hot griddle until golden brown on both sides.",
    ],
    stepIngredientIndexes: [[1], [2, 3], [2, 3]],
  };

  const defaultSchemaSummary = `Recipe JSON Schema:
- sourceUrl (string): URL of the recipe source
- title (string): Recipe name
- description (string): Brief recipe description
- servings (string): Number of servings
- prepMinutes (string): Prep time in minutes
- cookMinutes (string): Cook time in minutes
- ingredients (array): List of ingredients with text, quantity, unit, note, optional
- steps (array): Ordered cooking steps
- stepIngredientIndexes (array): Ingredient indices used in each step`;

  const exampleJsonString = JSON.stringify(example, null, 2);

  const handleParse = () => {
    setError(null);
    setStatus(null);
    setDraft(null);

    try {
      setIsParsing(true);
      const parsed = JSON.parse(rawJson);

      // If the parsed object resembles the model output (steps as objects),
      // convert it into an ImportedRecipeDraft-like shape.
      let candidate: any = parsed;

      if (parsed && Array.isArray(parsed.steps) && parsed.steps.length > 0 && typeof parsed.steps[0] === "object") {
        candidate = {
          sourceUrl: parsed.sourceUrl ?? "about:blank",
          title: parsed.title ?? "",
          description: parsed.description ?? "",
          servings: parsed.servings ?? "",
          prepMinutes: parsed.prepMinutes ?? "",
          cookMinutes: parsed.cookMinutes ?? "",
          ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
          steps: parsed.steps.map((s: any) => s.text ?? ""),
          stepIngredientIndexes: parsed.steps.map((s: any) => s.ingredientIndexes ?? []),
        };
      }

      // If parsed looks like an ImportedRecipeDraft already, ensure sourceUrl exists
      if (!candidate.sourceUrl) candidate.sourceUrl = "about:blank";

      try {
        const sanitized = sanitizeImportedRecipeDraft(candidate);
        setDraft(sanitized);
        setStatus(messages?.parsedStatus ?? "JSON parsed and sanitized. Review the draft below.");
      } catch (zodErr) {
        if (zodErr instanceof ZodError) {
          setError(
            zodErr.issues
              .map((e) => {
                const path = e.path && e.path.length ? `${e.path.join(".")}: ` : "";
                return `${path}${e.message}`;
              })
              .join("\n")
          );
        } else {
          const message = zodErr instanceof Error ? zodErr.message : String(zodErr);
          setError(message);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid JSON provided.";
      setError(message);
    } finally {
      setIsParsing(false);
    }
  };

  const insertExample = () => {
    setRawJson(exampleJsonString);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("Copied to clipboard.");
      setTimeout(() => setStatus(null), 2200);
    } catch {
      setError("Unable to copy to clipboard.");
    }
  };

  const handleUseDraft = async () => {
    if (!draft) return;
    setError(null);
    setIsApplying(true);

    try {
      await onUseDraft(draft);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to use this recipe draft right now.";
      setError(message);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowHelp((current) => !current)}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium"
          >
            {messages?.helpTitle ?? "Help"}
          </button>
        </div>

        {showHelp ? (
          <div className="mt-5 rounded-2xl border border-border bg-background p-4 text-sm text-foreground shadow-sm">
            <div className="mb-4">
              <p className="font-semibold">{messages?.schemaTitle ?? "Schema overview"}</p>
              <pre className="mt-2 overflow-x-auto rounded-xl bg-muted p-3 text-xs leading-6">
{defaultSchemaSummary}
              </pre>
            </div>
            <div>
              <p className="font-semibold">{messages?.exampleTitle ?? "Example JSON"}</p>
              <pre className="mt-2 overflow-x-auto rounded-xl bg-muted p-3 text-xs leading-6">
{exampleJsonString}
              </pre>
              <button
                type="button"
                onClick={() => copyToClipboard(exampleJsonString)}
                className="mt-3 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium"
              >
                {messages?.copyButton ?? "Copy example"}
              </button>
            </div>
          </div>
        ) : null}

        <label className="mt-5 block text-sm font-medium" htmlFor="recipe-json">
          Recipe JSON
        </label>
        <div className="mt-2 flex flex-col gap-3">
          <textarea
            id="recipe-json"
            name="recipe-json"
            value={rawJson}
            onChange={(e) => setRawJson(e.target.value)}
            placeholder='Paste JSON here (e.g. {"title":"...","ingredients":[],"steps":[]})'
            className="w-full min-h-[12rem] rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-6 shadow-sm focus:border-primary focus:outline-none"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleParse}
              disabled={isParsing || !rawJson.trim()}
              className="rounded-2xl border border-border bg-background px-4 py-2 text-sm font-medium transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {messages?.parseButton ?? (isParsing ? "Parsing..." : "Parse JSON")}
            </button>
            {headerActions}
          </div>

          {status ? <p className="text-sm text-emerald-700">{status}</p> : null}
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-sm">
              <strong className="block font-semibold">{messages?.importErrorTitle ?? "Import error"}</strong>
              <pre className="whitespace-pre-wrap mt-2 rounded-md bg-red-100 p-3 text-xs leading-6">{error}</pre>
              <p className="mt-3 text-xs text-red-700">{messages?.importErrorTip ?? "Tip: paste the structured JSON produced by ChatGPT using the importer schema. Use the example to get started."}</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-semibold">Parsed Draft</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUseDraft}
              disabled={!draft || isApplying}
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isApplying ? "Applying..." : useDraftButtonLabel}
            </button>
            {headerActions}
          </div>
        </div>

        {!draft ? (
          <p className="mt-4 text-sm text-muted-foreground">No draft yet. Paste valid recipe JSON and click "Parse JSON".</p>
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
                        Uses: {draft.stepIngredientIndexes[index]
                          .map((ingredientIndex) => {
                            const ingredient = draft.ingredients[ingredientIndex - 1];
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

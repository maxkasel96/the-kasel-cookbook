import { z } from "zod";

export const RECIPE_IMPORT_DRAFT_STORAGE_KEY = "recipe-import-draft-v1";

export const importedIngredientSchema = z.object({
  text: z.string().min(1).max(300),
  quantity: z.string().max(40).optional(),
  unit: z.string().max(80).optional(),
  note: z.string().max(240).optional(),
  optional: z.boolean().optional(),
});

export const importedRecipeDraftSchema = z.object({
  sourceUrl: z.string().url(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  servings: z.string().max(20).optional(),
  prepMinutes: z.string().max(20).optional(),
  cookMinutes: z.string().max(20).optional(),
  ingredients: z.array(importedIngredientSchema).min(1),
  steps: z.array(z.string().min(1).max(1200)).min(1),
  stepIngredientIndexes: z.array(z.array(z.number().int().positive())).optional(),
});

export type ImportedIngredient = z.infer<typeof importedIngredientSchema>;
export type ImportedRecipeDraft = z.infer<typeof importedRecipeDraftSchema>;

export const importedRecipeModelOutputSchema = z.object({
  title: z.string(),
  description: z.string(),
  servings: z.string(),
  prepMinutes: z.string(),
  cookMinutes: z.string(),
  ingredients: z.array(
    z.object({
      text: z.string(),
      quantity: z.string(),
      unit: z.string(),
      note: z.string(),
      optional: z.boolean(),
    })
  ),
  steps: z.array(
    z.object({
      text: z.string(),
      ingredientIndexes: z.array(z.number().int().positive()),
    })
  ),
});

export type ImportedRecipeModelOutput = z.infer<
  typeof importedRecipeModelOutputSchema
>;

export const importedRecipeModelOutputJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "description",
    "servings",
    "prepMinutes",
    "cookMinutes",
    "ingredients",
    "steps",
  ],
  properties: {
    title: { type: "string", description: "Recipe title." },
    description: {
      type: "string",
      description:
        "Short recipe summary. Use an empty string when no reliable description is available.",
    },
    servings: {
      type: "string",
      description:
        "Servings as a plain number string like 4. Use an empty string if unknown.",
    },
    prepMinutes: {
      type: "string",
      description:
        "Prep time in minutes as a plain number string like 15. Use an empty string if unknown.",
    },
    cookMinutes: {
      type: "string",
      description:
        "Cook time in minutes as a plain number string like 35. Use an empty string if unknown.",
    },
    ingredients: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["text", "quantity", "unit", "note", "optional"],
        properties: {
          text: {
            type: "string",
            description: "Ingredient name without quantity or unit.",
          },
          quantity: {
            type: "string",
            description:
              "Quantity as a decimal-friendly string like 1, 1.5, or 0.25. Use an empty string if unknown.",
          },
          unit: {
            type: "string",
            description: "Ingredient unit like cup, tbsp, or oz.",
          },
          note: {
            type: "string",
            description:
              "Preparation note like diced or room temperature. Use an empty string if none.",
          },
          optional: {
            type: "boolean",
            description:
              "True only when the source clearly marks the ingredient as optional.",
          },
        },
      },
    },
    steps: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["text", "ingredientIndexes"],
        properties: {
          text: {
            type: "string",
            description: "One preparation step written as an imperative sentence.",
          },
          ingredientIndexes: {
            type: "array",
            description:
              "1-based ingredient indexes from the ingredients array that are directly used in this step.",
            items: {
              type: "integer",
            },
          },
        },
      },
    },
  },
} as const;

const collapseWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();

const toOptionalText = (value?: string, maxLength = 2000) => {
  const trimmed = collapseWhitespace(value ?? "");
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLength);
};

const toNumberLikeText = (value?: string) => {
  const trimmed = collapseWhitespace(value ?? "");
  if (!trimmed) return undefined;
  const match = trimmed.match(/\d+(?:\.\d+)?/);
  return match?.[0];
};

const unicodeFractionMap: Record<string, string> = {
  "¼": "1/4",
  "½": "1/2",
  "¾": "3/4",
  "⅐": "1/7",
  "⅑": "1/9",
  "⅒": "1/10",
  "⅓": "1/3",
  "⅔": "2/3",
  "⅕": "1/5",
  "⅖": "2/5",
  "⅗": "3/5",
  "⅘": "4/5",
  "⅙": "1/6",
  "⅚": "5/6",
  "⅛": "1/8",
  "⅜": "3/8",
  "⅝": "5/8",
  "⅞": "7/8",
};

const normalizeQuantity = (value?: string) => {
  const raw = collapseWhitespace(value ?? "");
  if (!raw) return undefined;

  const asciiFractions = raw.replace(
    /[¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g,
    (match) => ` ${unicodeFractionMap[match] ?? match}`
  );
  const normalized = collapseWhitespace(
    asciiFractions.replace(/^approx\.?\s+/i, "").replace(/^about\s+/i, "")
  );

  if (/^\d+(?:\.\d+)?$/.test(normalized)) {
    return normalized;
  }

  const mixedNumberMatch = normalized.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedNumberMatch) {
    const [, whole, numerator, denominator] = mixedNumberMatch;
    return String(
      Number(whole) + Number(numerator) / Number(denominator)
    ).slice(0, 40);
  }

  const fractionMatch = normalized.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const [, numerator, denominator] = fractionMatch;
    return String(Number(numerator) / Number(denominator)).slice(0, 40);
  }

  return normalized.slice(0, 40);
};

export function sanitizeImportedRecipeDraft(
  draft: Pick<
    ImportedRecipeDraft,
    | "sourceUrl"
    | "title"
    | "description"
    | "servings"
    | "prepMinutes"
    | "cookMinutes"
    | "ingredients"
    | "steps"
    | "stepIngredientIndexes"
  >
) {
  const sanitizedIngredients = draft.ingredients
    .map((ingredient) => ({
      text: collapseWhitespace(ingredient.text).slice(0, 300),
      quantity: normalizeQuantity(ingredient.quantity),
      unit: toOptionalText(ingredient.unit, 80),
      note: toOptionalText(ingredient.note, 240),
      optional: ingredient.optional ?? false,
    }))
    .filter((ingredient) => ingredient.text);

  const sanitizedSteps = draft.steps
    .map((step) => collapseWhitespace(step).slice(0, 1200))
    .filter(Boolean);

  const sanitizedStepIngredientIndexes = draft.stepIngredientIndexes
    ?.slice(0, sanitizedSteps.length)
    .map((indexes) =>
      Array.from(
        new Set(
          indexes.filter(
            (index) =>
              Number.isInteger(index) &&
              index > 0 &&
              index <= sanitizedIngredients.length
          )
        )
      ).sort((left, right) => left - right)
    );

  return importedRecipeDraftSchema.parse({
    sourceUrl: draft.sourceUrl,
    title: collapseWhitespace(draft.title).slice(0, 200),
    description: toOptionalText(draft.description),
    servings: toNumberLikeText(draft.servings),
    prepMinutes: toNumberLikeText(draft.prepMinutes),
    cookMinutes: toNumberLikeText(draft.cookMinutes),
    ingredients: sanitizedIngredients,
    steps: sanitizedSteps,
    stepIngredientIndexes: sanitizedStepIngredientIndexes,
  });
}

export function recipeDraftFromModelOutput(
  sourceUrl: string,
  modelOutput: ImportedRecipeModelOutput
) {
  return sanitizeImportedRecipeDraft({
    sourceUrl,
    title: modelOutput.title,
    description: modelOutput.description,
    servings: modelOutput.servings,
    prepMinutes: modelOutput.prepMinutes,
    cookMinutes: modelOutput.cookMinutes,
    ingredients: modelOutput.ingredients,
    steps: modelOutput.steps.map((step) => step.text),
    stepIngredientIndexes: modelOutput.steps.map(
      (step) => step.ingredientIndexes
    ),
  });
}

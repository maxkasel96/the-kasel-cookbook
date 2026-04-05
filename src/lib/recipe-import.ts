export const RECIPE_IMPORT_DRAFT_STORAGE_KEY = "recipe-import-draft-v1";

export type ImportedIngredient = {
  text: string;
  quantity?: string;
  unit?: string;
  note?: string;
  optional?: boolean;
};

export type ImportedRecipeDraft = {
  sourceUrl: string;
  title: string;
  description?: string;
  servings?: string;
  prepMinutes?: string;
  cookMinutes?: string;
  ingredients: ImportedIngredient[];
  steps: string[];
};

export type RecipeEditIngredient = {
  ingredientText: string
  quantity: string
  unit: string
  note: string
  isOptional: boolean
}

export type RecipeEditStep = {
  content: string
  ingredientPositions: number[]
}

export type RecipeEditDraft = {
  title: string
  description: string
  prepMinutes: number | null
  cookMinutes: number | null
  servings: number | null
  tags: string[]
  categories: string[]
  ingredients: RecipeEditIngredient[]
  steps: RecipeEditStep[]
}

export type RecipeEditProposal = {
  summary: string[]
  recipe: RecipeEditDraft
}

export type RecipeAssistantResponse = {
  answer: string
  proposal: RecipeEditProposal | null
}

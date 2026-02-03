'use client'

import { useState } from 'react'

import { createShoppingListItem } from '@/lib/shopping-list-client'

type ScaledQuantityFormatter = (quantity: number | null) => string | null

type RecipeIngredient = {
  id: number | string
  ingredient_text: string
  quantity: number | null
  unit: string | null
  note: string | null
  is_optional: boolean | null
}

type RecipeIngredientsProps = {
  ingredients: RecipeIngredient[]
  initialServings: number | null
  servingsInput: string
  isValidServings: boolean
  onServingsChange: (value: string) => void
  getScaledQuantity: ScaledQuantityFormatter
  recipeId: string
  recipeTitle: string
}

export function RecipeIngredients({
  ingredients,
  initialServings,
  servingsInput,
  isValidServings,
  onServingsChange,
  getScaledQuantity,
  recipeId,
  recipeTitle,
}: RecipeIngredientsProps) {
  const [pendingIds, setPendingIds] = useState<Record<string, boolean>>({})
  const [feedback, setFeedback] = useState<string | null>(null)

  const handleAdd = async (
    ingredient: RecipeIngredient,
    displayLabel: string
  ) => {
    const ingredientId = String(ingredient.id)
    setPendingIds((prev) => ({ ...prev, [ingredientId]: true }))
    setFeedback(null)
    try {
      await createShoppingListItem({
        ingredientText: displayLabel,
        recipeId,
        recipeTitle,
      })
      setFeedback(`Added ${ingredient.ingredient_text} to the shopping list.`)
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : 'Unable to add item to the shopping list.'
      )
    } finally {
      setPendingIds((prev) => {
        const next = { ...prev }
        delete next[ingredientId]
        return next
      })
    }
  }

  return (
    <div className="rounded-2xl border border-muted/60 bg-muted/10 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-foreground">
          Ingredients
        </h2>
        {initialServings ? (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-[0.2em]">
              Servings
            </span>
            <input
              aria-label="Adjust servings"
              className="w-20 rounded-full border border-muted/60 bg-background px-3 py-1 text-center text-sm font-semibold text-foreground shadow-sm"
              inputMode="decimal"
              min={1}
              step={0.25}
              type="number"
              value={servingsInput}
              onChange={(event) => onServingsChange(event.target.value)}
            />
            <span className="text-xs text-muted-foreground">
              Base: {initialServings}
            </span>
          </div>
        ) : null}
      </div>
      {!isValidServings && servingsInput ? (
        <p className="mt-2 text-xs text-danger">
          Enter a serving value greater than 0 to update quantities.
        </p>
      ) : null}
      {feedback ? (
        <p className="mt-3 rounded-xl border border-muted/60 bg-background px-3 py-2 text-xs text-muted-foreground">
          {feedback}
        </p>
      ) : null}
      {ingredients.length ? (
        <ul className="mt-4 space-y-3 text-sm text-foreground">
          {ingredients.map((ingredient) => {
            const scaledQuantity = getScaledQuantity(ingredient.quantity)
            const unitLabel = ingredient.unit ? `${ingredient.unit} ` : ''
            const displayLabel = `${
              scaledQuantity !== null ? `${scaledQuantity} ` : ''
            }${unitLabel}${ingredient.ingredient_text}`.trim()
            const isPending = Boolean(pendingIds[String(ingredient.id)])
            return (
              <li
                key={ingredient.id}
                className="flex flex-col gap-2 rounded-xl border border-transparent px-2 py-2 transition hover:border-muted/40 hover:bg-background/60 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{displayLabel}</span>
                  {(ingredient.note || ingredient.is_optional) && (
                    <span className="text-xs text-muted-foreground">
                      {ingredient.note}
                      {ingredient.note && ingredient.is_optional ? ' · ' : ''}
                      {ingredient.is_optional ? 'Optional' : ''}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleAdd(ingredient, displayLabel)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-muted/60 text-base font-semibold text-muted-foreground transition hover:border-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Add to list"
                  title="Add to list"
                >
                  +
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          No ingredients were saved for this recipe.
        </p>
      )}
    </div>
  )
}

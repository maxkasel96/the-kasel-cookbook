'use client'

import { useMemo } from 'react'

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
}

export function RecipeIngredients({
  ingredients,
  initialServings,
  servingsInput,
  isValidServings,
  onServingsChange,
  getScaledQuantity,
}: RecipeIngredientsProps) {
  const ingredientRows = useMemo(
    () =>
      ingredients.map((ingredient) => {
        const scaledQuantity = getScaledQuantity(ingredient.quantity)
        const unitLabel = ingredient.unit ? `${ingredient.unit} ` : ''
        const displayLabel = `${
          scaledQuantity !== null ? `${scaledQuantity} ` : ''
        }${unitLabel}${ingredient.ingredient_text}`.trim()

        return {
          ...ingredient,
          displayLabel,
        }
      }),
    [getScaledQuantity, ingredients]
  )

  return (
    <div className="recipe-detail-panel recipe-ingredients-panel">
      <div className="recipe-panel-heading recipe-panel-heading--split">
        <div className="recipe-panel-heading__main">
          <div>
            <p className="recipe-panel-heading__kicker">Ingredients</p>
            <h2>Ingredients</h2>
          </div>
        </div>
        {initialServings ? (
          <div className="recipe-servings-control">
            <span>
              Servings
            </span>
            <button
              type="button"
              className="recipe-servings-stepper"
              aria-label="Decrease servings"
              onClick={() => {
                const parsed = Number(servingsInput || initialServings)
                const current = Number.isFinite(parsed)
                  ? parsed
                  : initialServings
                const next = Math.max(1, current - 1)
                onServingsChange(String(next))
              }}
            >
              -
            </button>
            <input
              aria-label="Adjust servings"
              className="recipe-detail-input recipe-servings-input"
              inputMode="decimal"
              min={1}
              step={0.25}
              type="number"
              value={servingsInput}
              onChange={(event) => onServingsChange(event.target.value)}
            />
            <button
              type="button"
              className="recipe-servings-stepper"
              aria-label="Increase servings"
              onClick={() => {
                const parsed = Number(servingsInput || initialServings)
                const current = Number.isFinite(parsed)
                  ? parsed
                  : initialServings
                const next = current + 1
                onServingsChange(String(next))
              }}
            >
              +
            </button>
            <span>
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
      {ingredientRows.length ? (
        <>
          <ul className="recipe-ingredient-list">
            {ingredientRows.map((ingredient) => {
              return (
                <li key={ingredient.id} className="recipe-ingredient-item">
                  <div className="recipe-ingredient-item__copy">
                    <span className="recipe-ingredient-item__label">
                      {ingredient.displayLabel}
                    </span>
                    {(ingredient.note || ingredient.is_optional) && (
                      <span className="recipe-ingredient-meta">
                        {ingredient.note}
                        {ingredient.note && ingredient.is_optional ? ' · ' : ''}
                        {ingredient.is_optional ? 'Optional' : ''}
                      </span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          No ingredients were saved for this recipe.
        </p>
      )}
    </div>
  )
}

'use client'

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
            <input
              aria-label="Adjust servings"
              className="recipe-detail-input w-20 rounded-full px-3 py-1 text-center text-sm font-semibold shadow-sm"
              inputMode="decimal"
              min={1}
              step={0.25}
              type="number"
              value={servingsInput}
              onChange={(event) => onServingsChange(event.target.value)}
            />
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
      {ingredients.length ? (
        <ul className="mt-4 space-y-3 text-sm text-foreground">
          {ingredients.map((ingredient) => {
            const scaledQuantity = getScaledQuantity(ingredient.quantity)
            const unitLabel = ingredient.unit ? `${ingredient.unit} ` : ''
            const displayLabel = `${
              scaledQuantity !== null ? `${scaledQuantity} ` : ''
            }${unitLabel}${ingredient.ingredient_text}`.trim()
            return (
              <li
                key={ingredient.id}
                className="recipe-ingredient-item rounded-lg border px-3 py-2.5 transition"
              >
                <div className="min-w-0">
                  <span className="block text-sm font-medium leading-6">
                    {displayLabel}
                  </span>
                  {(ingredient.note || ingredient.is_optional) && (
                    <span className="recipe-ingredient-meta mt-1 inline-flex max-w-full items-center rounded-full px-2 py-0.5 text-xs leading-5">
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
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          No ingredients were saved for this recipe.
        </p>
      )}
    </div>
  )
}

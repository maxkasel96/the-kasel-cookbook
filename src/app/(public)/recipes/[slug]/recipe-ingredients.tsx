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
      {ingredients.length ? (
        <ul className="mt-4 space-y-3 text-sm text-foreground">
          {ingredients.map((ingredient) => {
            const scaledQuantity = getScaledQuantity(ingredient.quantity)
            return (
              <li key={ingredient.id} className="flex flex-col">
                <span className="font-medium">
                  {scaledQuantity !== null ? `${scaledQuantity} ` : ''}
                  {ingredient.unit ? `${ingredient.unit} ` : ''}
                  {ingredient.ingredient_text}
                </span>
                {(ingredient.note || ingredient.is_optional) && (
                  <span className="text-xs text-muted-foreground">
                    {ingredient.note}
                    {ingredient.note && ingredient.is_optional ? ' · ' : ''}
                    {ingredient.is_optional ? 'Optional' : ''}
                  </span>
                )}
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

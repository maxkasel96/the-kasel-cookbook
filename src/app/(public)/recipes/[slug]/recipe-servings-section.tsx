'use client'

import { useCallback, useMemo, useState } from 'react'

import MealAssignment from './MealAssignment'
import { RecipeIngredients } from './recipe-ingredients'

type RecipeIngredient = {
  id: number | string
  ingredient_text: string
  quantity: number | null
  unit: string | null
  note: string | null
  is_optional: boolean | null
}

type InstructionIngredientLink = {
  ingredient_id: number | string
}

type InstructionStep = {
  id?: number | string
  content?: string | null
  recipe_instruction_step_ingredients?: InstructionIngredientLink[] | null
}

type MealOption = {
  id: string
  title: string
  slug: string
}

type RecipeServingsSectionProps = {
  ingredients: RecipeIngredient[]
  initialServings: number | null
  steps: InstructionStep[]
  meals: MealOption[]
  recipeId: string | number
  recipeTitle: string
}

const formatQuantity = (value: number) => {
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100
  return rounded.toFixed(2).replace(/\.?0+$/, '')
}

export default function RecipeServingsSection({
  ingredients,
  initialServings,
  steps,
  meals,
  recipeId,
  recipeTitle,
}: RecipeServingsSectionProps) {
  const [servingsInput, setServingsInput] = useState(
    initialServings ? String(initialServings) : ''
  )

  const { ratio, isValidServings } = useMemo(() => {
    const parsed = Number(servingsInput)
    const valid = Number.isFinite(parsed) && parsed > 0
    if (!valid || !initialServings || initialServings <= 0) {
      return { ratio: null, isValidServings: valid }
    }
    return { ratio: parsed / initialServings, isValidServings: true }
  }, [initialServings, servingsInput])

  const getScaledQuantity = useCallback(
    (quantity: number | null) => {
      if (quantity === null || !Number.isFinite(quantity)) {
        return null
      }
      if (!ratio) {
        return formatQuantity(quantity)
      }
      return formatQuantity(quantity * ratio)
    },
    [ratio]
  )

  const ingredientLookup = useMemo(() => {
    return new Map(
      ingredients.map((ingredient) => {
        const quantity = getScaledQuantity(ingredient.quantity ?? null)
        const unit = ingredient.unit ? `${ingredient.unit} ` : ''
        const label = `${quantity ? `${quantity} ` : ''}${unit}${
          ingredient.ingredient_text ?? ''
        }`.trim()
        return [String(ingredient.id), label]
      })
    )
  }, [getScaledQuantity, ingredients])

  return (
    <section className="recipe-cook-layout">
      <RecipeIngredients
        ingredients={ingredients}
        initialServings={initialServings}
        servingsInput={servingsInput}
        isValidServings={isValidServings}
        onServingsChange={setServingsInput}
        getScaledQuantity={getScaledQuantity}
      />

      <div className="space-y-6">
        <div className="recipe-detail-panel recipe-instructions-panel">
          <div className="recipe-panel-heading">
            <div>
              <p className="recipe-panel-heading__kicker">Method</p>
              <h2>Instructions</h2>
            </div>
          </div>
          {steps.length ? (
            <ol className="recipe-step-list">
              {steps.map((step, index) => {
                const assignedIngredients = (
                  step.recipe_instruction_step_ingredients ?? []
                )
                  .map((link) =>
                    ingredientLookup.get(String(link.ingredient_id))
                  )
                  .filter(
                    (ingredient): ingredient is string => Boolean(ingredient)
                  )

                return (
                  <li key={step.id ?? index} className="recipe-step">
                    <span className="recipe-step__number">{index + 1}</span>
                    <div className="recipe-step__body">
                      <p>{step.content ?? ''}</p>
                    {assignedIngredients.length ? (
                      <ul className="recipe-step__ingredients">
                        {assignedIngredients.map((a, i) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    ) : null}
                    </div>
                  </li>
                )
              })}
            </ol>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              No preparation steps were saved for this recipe.
            </p>
          )}
        </div>

        <MealAssignment
          recipeId={String(recipeId)}
          recipeTitle={recipeTitle}
          meals={meals}
        />
      </div>
    </section>
  )
}

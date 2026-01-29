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
  id: number | string
  content: string
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
    <section className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <RecipeIngredients
        ingredients={ingredients}
        initialServings={initialServings}
        servingsInput={servingsInput}
        isValidServings={isValidServings}
        onServingsChange={setServingsInput}
        getScaledQuantity={getScaledQuantity}
      />

      <div className="space-y-6">
        <div className="rounded-2xl border border-muted/60 bg-background p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">
            Instructions
          </h2>
          {steps.length ? (
            <ol className="mt-4 list-decimal space-y-4 pl-6 text-sm text-foreground">
              {steps.map((step) => {
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
                  <li key={step.id} className="leading-relaxed">
                    <span>{step.content}</span>
                    {assignedIngredients.length ? (
                      <p className="mt-1 text-xs italic text-muted-foreground">
                        {assignedIngredients.join(', ')}
                      </p>
                    ) : null}
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

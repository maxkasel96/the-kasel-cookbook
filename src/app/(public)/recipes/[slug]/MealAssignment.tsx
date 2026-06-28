'use client'

import { useMemo, useState } from 'react'

import { supabaseBrowserClient } from '@/lib/supabase/client'

type MealOption = {
  id: string
  title: string
  slug: string
}

type MealAssignmentProps = {
  recipeId: string
  recipeTitle: string
  meals: MealOption[]
}

type StatusMessage = {
  type: 'success' | 'error'
  message: string
}

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

export default function MealAssignment({
  recipeId,
  recipeTitle,
  meals,
}: MealAssignmentProps) {
  const [selectedMealId, setSelectedMealId] = useState('')
  const [newMealTitle, setNewMealTitle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<StatusMessage | null>(null)

  const canSubmit = useMemo(() => {
    return Boolean(selectedMealId || newMealTitle.trim())
  }, [selectedMealId, newMealTitle])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit || isSubmitting) return

    setIsSubmitting(true)
    setStatus(null)

    let mealId = selectedMealId

    try {
      if (!mealId && newMealTitle.trim()) {
        const slug = slugify(newMealTitle)
        if (!slug) {
          setStatus({
            type: 'error',
            message: 'Enter a meal name to continue.',
          })
          return
        }

        const { data: createdMeal, error: mealError } =
          await supabaseBrowserClient
            .from('meals')
            .insert({
              title: newMealTitle.trim(),
              slug,
            })
            .select('id, title')
            .single()

        if (mealError) {
          throw mealError
        }

        mealId = createdMeal.id
      }

      const { error: linkError } = await supabaseBrowserClient
        .from('meal_recipes')
        .insert({
          meal_id: mealId,
          recipe_id: recipeId,
        })

      if (linkError) {
        throw linkError
      }

      setStatus({
        type: 'success',
        message: `Added ${recipeTitle} to the meal.`,
      })
      setNewMealTitle('')
      setSelectedMealId('')
    } catch (error: any) {
      setStatus({
        type: 'error',
        message: error?.message ?? 'Unable to add this recipe to the meal.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="recipe-detail-panel recipe-meal-assignment rounded-2xl p-6"
    >
      <div className="recipe-meal-assignment__header">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Meals
          </p>
          <h2 className="text-lg font-semibold text-foreground">
            Add this recipe to a meal
          </h2>
        </div>
        <p className="recipe-meal-assignment__summary">
          Choose a saved meal or name a new one.
        </p>
      </div>

      <div className="recipe-meal-assignment__body">
        <div className="recipe-meal-assignment__control">
          <label
            className="recipe-meal-assignment__label"
            htmlFor="recipe-meal-select"
          >
            Saved meal
          </label>
          <div className="recipe-meal-assignment__select-wrap">
            <select
              id="recipe-meal-select"
              value={selectedMealId}
              onChange={(event) => {
                setSelectedMealId(event.target.value)
                if (event.target.value) {
                  setNewMealTitle('')
                }
              }}
              className="recipe-detail-input recipe-meal-assignment__select"
            >
              <option value="">Choose a saved meal</option>
              {meals.map((meal) => (
                <option key={meal.id} value={meal.id}>
                  {meal.title}
                </option>
              ))}
            </select>
            <span aria-hidden="true" className="recipe-meal-assignment__chevron" />
          </div>
        </div>

        <label className="recipe-meal-assignment__control">
          <span className="recipe-meal-assignment__label">New meal</span>
          <input
            type="text"
            value={newMealTitle}
            onChange={(event) => {
              setNewMealTitle(event.target.value)
              if (event.target.value.trim()) {
                setSelectedMealId('')
              }
            }}
            placeholder="e.g. Sunday dinner"
            className="recipe-detail-input recipe-meal-assignment__input"
          />
        </label>
      </div>

      <div className="recipe-meal-assignment__footer">
        <button
          type="submit"
          disabled={!canSubmit || isSubmitting}
          className="recipe-detail-primary-action recipe-meal-assignment__button rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Saving...' : 'Add to meal'}
        </button>
        {status ? (
          <p
            className={`recipe-meal-assignment__status recipe-meal-assignment__status--${status.type}`}
            role="status"
          >
            {status.message}
          </p>
        ) : null}
      </div>
    </form>
  )
}

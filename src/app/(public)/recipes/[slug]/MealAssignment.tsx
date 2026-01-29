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
      className="rounded-2xl border border-muted/60 bg-background p-6 shadow-sm"
    >
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Meals
        </p>
        <h2 className="text-lg font-semibold text-foreground">
          Add this recipe to a meal
        </h2>
        <p className="text-sm text-muted-foreground">
          Choose an existing meal or create a new one for {recipeTitle}.
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-foreground">
          Select a meal
          <select
            value={selectedMealId}
            onChange={(event) => {
              setSelectedMealId(event.target.value)
              if (event.target.value) {
                setNewMealTitle('')
              }
            }}
            className="w-full rounded-md border border-muted/70 bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Choose a saved meal</option>
            {meals.map((meal) => (
              <option key={meal.id} value={meal.id}>
                {meal.title}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm font-medium text-foreground">
          Or create a new meal
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
            className="w-full rounded-md border border-muted/70 bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={!canSubmit || isSubmitting}
          className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-danger disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Saving...' : 'Add to meal'}
        </button>
        {status ? (
          <p
            className={`text-sm ${
              status.type === 'success'
                ? 'text-emerald-600'
                : 'text-rose-600'
            }`}
            role="status"
          >
            {status.message}
          </p>
        ) : null}
      </div>
    </form>
  )
}

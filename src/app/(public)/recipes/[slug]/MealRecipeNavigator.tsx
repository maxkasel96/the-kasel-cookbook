'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef } from 'react'
import type { TouchEvent } from 'react'

type MealRecipeNavigationItem = {
  slug: string
  title: string
}

type MealRecipeNavigatorProps = {
  meal: {
    slug: string
    title: string
  }
  currentIndex: number
  recipes: MealRecipeNavigationItem[]
}

type TouchPosition = {
  x: number
  y: number
}

const getRecipeHref = (recipeSlug: string, mealSlug: string) =>
  `/recipes/${recipeSlug}?meal=${encodeURIComponent(mealSlug)}`

const SWIPE_DISTANCE_THRESHOLD = 50
const SWIPE_VERTICAL_DRIFT_LIMIT = 45

export default function MealRecipeNavigator({
  meal,
  currentIndex,
  recipes,
}: MealRecipeNavigatorProps) {
  const router = useRouter()
  const touchStartRef = useRef<TouchPosition | null>(null)
  const recipeCount = recipes.length
  const previousRecipe = currentIndex > 0 ? recipes[currentIndex - 1] : null
  const nextRecipe =
    currentIndex < recipeCount - 1 ? recipes[currentIndex + 1] : null
  const previousRecipeHref = previousRecipe
    ? getRecipeHref(previousRecipe.slug, meal.slug)
    : null
  const nextRecipeHref = nextRecipe
    ? getRecipeHref(nextRecipe.slug, meal.slug)
    : null

  const handleTouchStart = (event: TouchEvent<HTMLElement>) => {
    const touch = event.touches[0]

    if (!touch) return

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    }
  }

  const handleTouchEnd = (event: TouchEvent<HTMLElement>) => {
    const touchStart = touchStartRef.current
    const touch = event.changedTouches[0]
    touchStartRef.current = null

    if (!touchStart || !touch) return

    const deltaX = touch.clientX - touchStart.x
    const deltaY = touch.clientY - touchStart.y

    if (
      Math.abs(deltaX) < SWIPE_DISTANCE_THRESHOLD ||
      Math.abs(deltaY) > SWIPE_VERTICAL_DRIFT_LIMIT
    ) {
      return
    }

    const targetHref = deltaX < 0 ? nextRecipeHref : previousRecipeHref

    if (targetHref) {
      router.push(targetHref)
    }
  }

  return (
    <nav
      className="meal-recipe-navigator"
      aria-label={`Recipes in ${meal.title}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="meal-recipe-navigator__context">
        <Link
          href={`/meals/${meal.slug}`}
          className="meal-recipe-navigator__back"
        >
          Back to meal
        </Link>
        <div className="meal-recipe-navigator__meta">
          <span className="meal-recipe-navigator__meal">{meal.title}</span>
          <span className="meal-recipe-navigator__position">
            Recipe {currentIndex + 1} of {recipeCount}
          </span>
        </div>
      </div>

      <div className="meal-recipe-navigator__actions">
        {previousRecipe && previousRecipeHref ? (
          <Link
            href={previousRecipeHref}
            className="meal-recipe-navigator__link"
            aria-label={`Previous recipe: ${previousRecipe.title}`}
          >
            <span aria-hidden="true">←</span>
            <span>Previous</span>
          </Link>
        ) : (
          <span
            className="meal-recipe-navigator__link meal-recipe-navigator__link--disabled"
            aria-disabled="true"
          >
            <span aria-hidden="true">←</span>
            <span>Previous</span>
          </span>
        )}

        {nextRecipe && nextRecipeHref ? (
          <Link
            href={nextRecipeHref}
            className="meal-recipe-navigator__link meal-recipe-navigator__link--primary"
            aria-label={`Next recipe: ${nextRecipe.title}`}
          >
            <span>Next</span>
            <span aria-hidden="true">→</span>
          </Link>
        ) : (
          <span
            className="meal-recipe-navigator__link meal-recipe-navigator__link--disabled"
            aria-disabled="true"
          >
            <span>Next</span>
            <span aria-hidden="true">→</span>
          </span>
        )}
      </div>
    </nav>
  )
}

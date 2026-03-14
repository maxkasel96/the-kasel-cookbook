'use client'

import { useEffect } from 'react'

import { trackRecipeView } from '@/lib/analytics/track'

type RecipeViewTrackerProps = {
  recipeId: string
  recipeTitle: string
  recipeSlug: string
  category?: string
  tags?: string[]
}

export default function RecipeViewTracker({
  recipeId,
  recipeTitle,
  recipeSlug,
  category,
  tags,
}: RecipeViewTrackerProps) {
  useEffect(() => {
    trackRecipeView({
      recipe_id: recipeId,
      recipe_title: recipeTitle,
      recipe_slug: recipeSlug,
      ...(category ? { category } : {}),
      ...(tags?.length ? { tags } : {}),
    })
  }, [category, recipeId, recipeSlug, recipeTitle, tags])

  return null
}

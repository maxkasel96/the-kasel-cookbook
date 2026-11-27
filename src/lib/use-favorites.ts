'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { trackFavoriteAdded, trackFavoriteRemoved } from '@/lib/analytics/track'

type RecipeTag = {
  tag_id: string | number
  tags:
    | {
        id: string | number
        name: string
        category?: string | null
      }
    | Array<{
        id: string | number
        name: string
        category?: string | null
      }>
    | null
}

type RecipeCategory = {
  category_id: string | number
  categories:
    | {
        id: string | number
        name: string
      }
    | Array<{
        id: string | number
        name: string
      }>
    | null
}

export type FavoriteRecipe = {
  id: string | number
  slug: string
  title: string
  description?: string | null
  prep_minutes?: number | null
  cook_minutes?: number | null
  servings?: number | null
  recipe_tags?: RecipeTag[] | null
  recipe_categories?: RecipeCategory[] | null
}

const STORAGE_KEY = 'kaselFavorites'

const readFavoritesFromStorage = () => {
  if (typeof window === 'undefined') return []
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (!stored) return []
  try {
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteRecipe[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  const persistLocalFavorites = useCallback((nextFavorites: FavoriteRecipe[]) => {
    setFavorites(nextFavorites)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextFavorites))
    }
  }, [])

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      setFavorites(readFavoritesFromStorage())
      setIsHydrated(true)
    }, 0)

    return () => window.clearTimeout(hydrationTimer)
  }, [])

  const favoriteIds = useMemo(
    () => new Set(favorites.map((recipe) => String(recipe.id))),
    [favorites]
  )

  const isFavorite = useCallback(
    (recipeId: string | number) => favoriteIds.has(String(recipeId)),
    [favoriteIds]
  )

  const toggleFavorite = useCallback(
    (recipe: FavoriteRecipe) => {
      const exists = favoriteIds.has(String(recipe.id))

      if (exists) {
        const nextFavorites = favorites.filter(
          (item) => String(item.id) !== String(recipe.id)
        )
        persistLocalFavorites(nextFavorites)
        trackFavoriteRemoved({
          recipe_id: String(recipe.id),
          recipe_title: recipe.title,
          recipe_slug: recipe.slug,
        })
        return
      }

      persistLocalFavorites([recipe, ...favorites])
      trackFavoriteAdded({
        recipe_id: String(recipe.id),
        recipe_title: recipe.title,
        recipe_slug: recipe.slug,
      })
    },
    [favoriteIds, favorites, persistLocalFavorites]
  )

  return {
    favorites,
    isFavorite,
    isHydrated,
    toggleFavorite,
  }
}

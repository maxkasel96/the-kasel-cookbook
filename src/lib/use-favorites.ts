'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

type RecipeTag = {
  tag_id: string | number
  tags: {
    id: string | number
    name: string
    category?: string | null
  } | null
}

export type FavoriteRecipe = {
  id: string | number
  slug: string
  title: string
  description?: string | null
  recipe_tags?: RecipeTag[] | null
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

  useEffect(() => {
    setFavorites(readFavoritesFromStorage())
    setIsHydrated(true)
  }, [])

  const favoriteIds = useMemo(
    () => new Set(favorites.map((recipe) => String(recipe.id))),
    [favorites]
  )

  const persistFavorites = (nextFavorites: FavoriteRecipe[]) => {
    setFavorites(nextFavorites)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextFavorites))
    }
  }

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
        persistFavorites(nextFavorites)
        return
      }
      persistFavorites([recipe, ...favorites])
    },
    [favoriteIds, favorites]
  )

  return {
    favorites,
    isFavorite,
    isHydrated,
    toggleFavorite,
  }
}

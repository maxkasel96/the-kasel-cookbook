'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { useHouseholds } from '@/lib/use-households'

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
  const { selectedHouseholdId } = useHouseholds()
  const [favorites, setFavorites] = useState<FavoriteRecipe[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  const persistLocalFavorites = useCallback((nextFavorites: FavoriteRecipe[]) => {
    setFavorites(nextFavorites)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextFavorites))
    }
  }, [])

  const loadHouseholdFavorites = useCallback(async (householdId: string) => {
    const response = await fetch(`/api/households/${householdId}/favorites`)
    const payload = (await response.json()) as {
      favorites?: FavoriteRecipe[]
      error?: string
    }

    if (!response.ok) {
      throw new Error(payload.error ?? 'Unable to load household favorites.')
    }

    setFavorites(payload.favorites ?? [])
  }, [])

  useEffect(() => {
    const run = async () => {
      try {
        if (!selectedHouseholdId) {
          setFavorites(readFavoritesFromStorage())
          return
        }

        await loadHouseholdFavorites(selectedHouseholdId)
      } finally {
        setIsHydrated(true)
      }
    }

    run()
  }, [selectedHouseholdId, loadHouseholdFavorites])

  const favoriteIds = useMemo(
    () => new Set(favorites.map((recipe) => String(recipe.id))),
    [favorites]
  )

  const isFavorite = useCallback(
    (recipeId: string | number) => favoriteIds.has(String(recipeId)),
    [favoriteIds]
  )

  const toggleFavorite = useCallback(
    async (recipe: FavoriteRecipe) => {
      const exists = favoriteIds.has(String(recipe.id))

      if (!selectedHouseholdId) {
        if (exists) {
          const nextFavorites = favorites.filter(
            (item) => String(item.id) !== String(recipe.id)
          )
          persistLocalFavorites(nextFavorites)
          return
        }

        persistLocalFavorites([recipe, ...favorites])
        return
      }

      if (exists) {
        const response = await fetch(
          `/api/households/${selectedHouseholdId}/favorites?recipeId=${encodeURIComponent(
            String(recipe.id)
          )}`,
          { method: 'DELETE' }
        )

        if (!response.ok) {
          return
        }

        setFavorites((current) =>
          current.filter((item) => String(item.id) !== String(recipe.id))
        )
        return
      }

      const response = await fetch(`/api/households/${selectedHouseholdId}/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipeId: String(recipe.id) }),
      })

      if (!response.ok) {
        return
      }

      setFavorites((current) => [recipe, ...current])
    },
    [favoriteIds, favorites, persistLocalFavorites, selectedHouseholdId]
  )

  return {
    favorites,
    isFavorite,
    isHydrated,
    toggleFavorite,
    selectedHouseholdId,
  }
}

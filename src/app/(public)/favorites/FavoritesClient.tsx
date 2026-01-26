'use client'

import RecipesClient from '../recipes/RecipesClient'
import { useFavorites } from '@/lib/use-favorites'

export default function FavoritesClient() {
  const { favorites, isHydrated } = useFavorites()

  if (!isHydrated) {
    return (
      <p className="rounded-lg border border-dashed border-muted-foreground/40 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
        Loading favorites…
      </p>
    )
  }

  return (
    <RecipesClient
      recipes={favorites}
      emptyMessage="You have not added any favorite recipes yet."
      noMatchMessage="No favorite recipes match your search right now."
    />
  )
}

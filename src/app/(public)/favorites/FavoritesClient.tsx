'use client'

import RecipesClient from '../recipes/RecipesClient'
import { useFavorites } from '@/lib/use-favorites'

export default function FavoritesClient() {
  const { favorites, isHydrated, selectedHouseholdId } = useFavorites()

  if (!isHydrated) {
    return (
      <p className="rounded-lg border border-dashed border-muted-foreground/40 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
        Loading favorites…
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {selectedHouseholdId
          ? 'Shared household favorites are active.'
          : 'Personal browser favorites are active. Pick a household to share favorites.'}
      </p>
      <RecipesClient
        recipes={favorites}
        emptyMessage="You have not added any favorite recipes yet."
        noMatchMessage="No favorite recipes match your search right now."
      />
    </div>
  )
}

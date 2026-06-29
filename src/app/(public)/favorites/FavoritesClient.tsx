'use client'

import RecipesClient from '../recipes/RecipesClient'
import { Panel, Skeleton } from '@/components/ui/primitives'
import { useFavorites } from '@/lib/use-favorites'

export default function FavoritesClient() {
  const { favorites, isHydrated, selectedHouseholdId } = useFavorites()

  if (!isHydrated) {
    return (
      <Panel className="grid gap-3 p-4" tone="soft">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-40 w-full" />
      </Panel>
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

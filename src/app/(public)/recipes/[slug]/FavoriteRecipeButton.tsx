'use client'

import { useFavorites, type FavoriteRecipe } from '@/lib/use-favorites'

type FavoriteRecipeButtonProps = {
  recipe: FavoriteRecipe
}

export default function FavoriteRecipeButton({
  recipe,
}: FavoriteRecipeButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const active = isFavorite(recipe.id)

  return (
    <button
      type="button"
      onClick={() => toggleFavorite(recipe)}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
        active
          ? 'border-primary/40 bg-primary/10 text-primary'
          : 'border-muted/60 text-muted-foreground hover:border-muted hover:bg-muted/30'
      }`}
      aria-label={
        active
          ? `Remove ${recipe.title} from favorites`
          : `Add ${recipe.title} to favorites`
      }
    >
      <span className="mr-2" aria-hidden="true">
        {active ? '♥' : '♡'}
      </span>
      {active ? 'Favorited' : 'Add to favorites'}
    </button>
  )
}

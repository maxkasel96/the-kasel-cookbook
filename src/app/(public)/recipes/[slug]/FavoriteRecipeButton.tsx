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
      className={`recipe-detail-favorite rounded-full px-4 py-2 text-sm font-medium transition ${
        active ? 'recipe-detail-favorite--active' : ''
      }`}
      aria-label={
        active
          ? `Remove ${recipe.title} from favorites`
          : `Add ${recipe.title} to favorites`
      }
    >
      <span aria-hidden="true">
        {active ? '♥' : '♡'}
      </span>
    </button>
  )
}

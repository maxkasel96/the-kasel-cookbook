'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

import { useFavorites, type FavoriteRecipe } from '@/lib/use-favorites'

type RecipesClientProps = {
  recipes: FavoriteRecipe[]
  emptyMessage?: string
  noMatchMessage?: string
}

export default function RecipesClient({
  recipes,
  emptyMessage = 'No recipes have been published yet.',
  noMatchMessage = 'No recipes match your search right now.',
}: RecipesClientProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const { isFavorite, toggleFavorite } = useFavorites()

  const availableTags = useMemo(() => {
    const names = new Set<string>()
    recipes.forEach((recipe) => {
      recipe.recipe_tags?.forEach((recipeTag) => {
        if (recipeTag?.tags?.name) {
          names.add(recipeTag.tags.name)
        }
      })
    })
    return Array.from(names).sort((a, b) => a.localeCompare(b))
  }, [recipes])

  const filteredRecipes = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    return recipes.filter((recipe) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        recipe.title.toLowerCase().includes(normalizedSearch) ||
        recipe.description?.toLowerCase().includes(normalizedSearch)

      if (!matchesSearch) return false

      if (selectedTags.length === 0) return true

      const recipeTagNames =
        recipe.recipe_tags
          ?.map((recipeTag) => recipeTag?.tags?.name)
          .filter(Boolean) ?? []

      return selectedTags.every((tag) => recipeTagNames.includes(tag))
    })
  }, [recipes, searchTerm, selectedTags])

  const toggleTag = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((tag) => tag !== tagName)
        : [...prev, tagName]
    )
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedTags([])
  }

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-muted/60 bg-background p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1 space-y-2">
            <label
              htmlFor="recipe-search"
              className="text-sm font-medium text-foreground"
            >
              Search recipes
            </label>
            <input
              id="recipe-search"
              type="search"
              placeholder="Search by title or description"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-md border border-muted/70 bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>
              {filteredRecipes.length} of {recipes.length} recipes
            </span>
            {(searchTerm.length > 0 || selectedTags.length > 0) && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-md border border-muted/60 px-2 py-1 text-xs font-medium text-foreground transition hover:border-muted hover:bg-muted/40"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
        {availableTags.length > 0 && (
          <div className="mt-4 border-t border-muted/50 pt-4">
            <p className="text-sm font-medium text-foreground">Filter by tag</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {availableTags.map((tag) => {
                const isSelected = selectedTags.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-muted/60 text-muted-foreground hover:border-muted hover:bg-muted/30'
                    }`}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {recipes.length === 0 ? (
        <p className="rounded-lg border border-dashed border-muted-foreground/40 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      ) : filteredRecipes.length === 0 ? (
        <p className="rounded-lg border border-dashed border-muted-foreground/40 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
          {noMatchMessage}
        </p>
      ) : (
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRecipes.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.slug}`}
              className="group relative flex h-full flex-col rounded-xl border border-muted/60 bg-background p-5 shadow-sm transition hover:-translate-y-1 hover:border-muted hover:shadow-md"
            >
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  toggleFavorite(recipe)
                }}
                className={`absolute right-4 top-4 rounded-full border p-2 text-sm transition ${
                  isFavorite(recipe.id)
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-muted/60 text-muted-foreground hover:border-muted hover:bg-muted/30'
                }`}
                aria-label={
                  isFavorite(recipe.id)
                    ? `Remove ${recipe.title} from favorites`
                    : `Add ${recipe.title} to favorites`
                }
              >
                <span aria-hidden="true">
                  {isFavorite(recipe.id) ? '♥' : '♡'}
                </span>
              </button>
              <div className="flex flex-1 flex-col gap-3">
                <h2 className="text-xl font-semibold text-foreground transition group-hover:text-primary">
                  {recipe.title}
                </h2>
                {recipe.description ? (
                  <p className="text-sm text-muted-foreground">
                    {recipe.description}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    A saved recipe ready for the kitchen.
                  </p>
                )}
              </div>
              <span className="mt-6 text-sm font-medium text-primary">
                View recipe →
              </span>
            </Link>
          ))}
        </section>
      )}
    </section>
  )
}

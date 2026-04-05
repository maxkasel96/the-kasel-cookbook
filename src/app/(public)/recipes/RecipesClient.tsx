'use client'

import { type FormEvent, useMemo, useState } from 'react'
import Link from 'next/link'

import { trackRecipeSearch } from '@/lib/analytics/track'
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
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const { isFavorite, toggleFavorite } = useFavorites()

  const availableTags = useMemo(() => {
    const names = new Set<string>()
    recipes.forEach((recipe) => {
      recipe.recipe_tags?.forEach((recipeTag) => {
        if (Array.isArray(recipeTag?.tags)) {
          recipeTag.tags.forEach((tag) => {
            if (tag?.name) {
              names.add(tag.name)
            }
          })
          return
        }
        if (recipeTag?.tags?.name) {
          names.add(recipeTag.tags.name)
        }
      })
    })
    return Array.from(names).sort((a, b) => a.localeCompare(b))
  }, [recipes])

  const availableCategories = useMemo(() => {
    const names = new Set<string>()
    recipes.forEach((recipe) => {
      recipe.recipe_categories?.forEach((recipeCategory) => {
        if (Array.isArray(recipeCategory?.categories)) {
          recipeCategory.categories.forEach((category) => {
            if (category?.name) {
              names.add(category.name)
            }
          })
          return
        }
        if (recipeCategory?.categories?.name) {
          names.add(recipeCategory.categories.name)
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

      const recipeTagNames =
        recipe.recipe_tags
          ?.flatMap((recipeTag) => {
            if (Array.isArray(recipeTag?.tags)) {
              return recipeTag.tags.map((tag) => tag?.name).filter(Boolean)
            }
            return recipeTag?.tags?.name ? [recipeTag.tags.name] : []
          })
          .filter(Boolean) ?? []

      const recipeCategoryNames =
        recipe.recipe_categories
          ?.flatMap((recipeCategory) => {
            if (Array.isArray(recipeCategory?.categories)) {
              return recipeCategory.categories
                .map((category) => category?.name)
                .filter(Boolean)
            }
            return recipeCategory?.categories?.name
              ? [recipeCategory.categories.name]
              : []
          })
          .filter(Boolean) ?? []

      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.every((tag) => recipeTagNames.includes(tag))

      const matchesCategories =
        selectedCategories.length === 0 ||
        selectedCategories.every((category) =>
          recipeCategoryNames.includes(category)
        )

      return matchesTags && matchesCategories
    })
  }, [recipes, searchTerm, selectedTags, selectedCategories])

  const toggleTag = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((tag) => tag !== tagName)
        : [...prev, tagName]
    )
  }

  const toggleCategory = (categoryName: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryName)
        ? prev.filter((category) => category !== categoryName)
        : [...prev, categoryName]
    )
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedTags([])
    setSelectedCategories([])
  }

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    trackRecipeSearch({
      search_term: searchTerm.trim(),
      results_count: filteredRecipes.length,
      ...(selectedCategories[0] ? { category: selectedCategories[0] } : {}),
      ...(selectedTags.length ? { tags: selectedTags } : {}),
    })
  }

  return (
    <section className="space-y-6">
      <form className="recipes-panel" onSubmit={handleSearchSubmit}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1 space-y-3">
            <label
              htmlFor="recipe-search"
              className="recipes-label"
            >
              Search recipes
            </label>
            <input
              id="recipe-search"
              type="search"
              placeholder="Search by title or description"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="recipes-input"
            />
            <button
              type="submit"
              className="recipes-secondary-button mt-1"
            >
              Apply search
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="recipes-count">
              {filteredRecipes.length} of {recipes.length} recipes
            </span>
            {(searchTerm.length > 0 ||
              selectedTags.length > 0 ||
              selectedCategories.length > 0) && (
              <button
                type="button"
                onClick={clearFilters}
                className="recipes-secondary-button"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
        {availableCategories.length > 0 && (
          <div className="recipes-divider">
            <p className="recipes-filter-label">
              Filter by category
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {availableCategories.map((category) => {
                const isSelected = selectedCategories.includes(category)
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className={`filter-pill ${isSelected ? 'filter-pill--active' : ''}`}
                  >
                    {category}
                  </button>
                )
              })}
            </div>
          </div>
        )}
        {availableTags.length > 0 && (
          <div className="recipes-divider">
            <p className="recipes-filter-label">Filter by tag</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {availableTags.map((tag) => {
                const isSelected = selectedTags.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`filter-pill ${isSelected ? 'filter-pill--active' : ''}`}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </form>

      {recipes.length === 0 ? (
        <p className="editorial-empty-state text-sm">
          {emptyMessage}
        </p>
      ) : filteredRecipes.length === 0 ? (
        <p className="editorial-empty-state text-sm">
          {noMatchMessage}
        </p>
      ) : (
        <section className="recipe-grid sm:grid-cols-2 lg:grid-cols-3">
          {filteredRecipes.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.slug}`}
              className="recipe-card group h-full"
            >
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  toggleFavorite(recipe)
                }}
                className={`recipe-card__favorite ${
                  isFavorite(recipe.id) ? 'recipe-card__favorite--active' : ''
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
                <h2 className="recipe-card__title">
                  {recipe.title}
                </h2>
                {recipe.description ? (
                  <p className="recipe-card__description">
                    {recipe.description}
                  </p>
                ) : (
                  <p className="recipe-card__description">
                    A saved recipe ready for the kitchen.
                  </p>
                )}
              </div>
              <span className="recipe-card__footer">View recipe</span>
            </Link>
          ))}
        </section>
      )}
    </section>
  )
}

'use client'

import { Search } from 'lucide-react'
import { type FormEvent, useMemo, useState } from 'react'

import RecipeCard from '@/components/recipe-card'
import { EmptyState } from '@/components/ui/primitives'
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

  const activeFilterCount =
    (searchTerm.trim() ? 1 : 0) + selectedTags.length + selectedCategories.length

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
    <section className="recipe-library">
      <form className="recipes-panel recipe-command-surface" onSubmit={handleSearchSubmit}>
        <div className="recipes-panel__header">
          <div>
            <p className="recipes-label">Recipe finder</p>
            <p className="recipes-panel__summary">
              {filteredRecipes.length} of {recipes.length} recipes
              {activeFilterCount ? ` · ${activeFilterCount} active` : ''}
            </p>
          </div>
          {activeFilterCount > 0 ? (
            <button
              type="button"
              onClick={clearFilters}
              className="recipes-clear-button"
            >
              Clear all
            </button>
          ) : null}
        </div>

        <div className="recipes-search-row">
          <div className="recipes-search-field">
            <label
              htmlFor="recipe-search"
              className="sr-only"
            >
              Search recipes
            </label>
            <div className="recipes-command-bar">
              <Search aria-hidden="true" />
              <input
                id="recipe-search"
                type="search"
                placeholder="Search by title or description"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="recipes-input"
              />
              <button type="submit" className="recipes-secondary-button">
                Search
              </button>
            </div>
          </div>
        </div>

        <div className="recipes-filter-grid">
          {availableCategories.length > 0 && (
            <section className="recipes-filter-group" aria-labelledby="category-filter-heading">
              <div className="recipes-filter-group__header">
                <p id="category-filter-heading" className="recipes-filter-label">
                  Categories
                </p>
                {selectedCategories.length ? (
                  <span>{selectedCategories.length} selected</span>
                ) : null}
              </div>
              <div className="recipes-chip-tray">
                {availableCategories.map((category) => {
                  const isSelected = selectedCategories.includes(category)
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => toggleCategory(category)}
                      aria-pressed={isSelected}
                      className={`filter-pill ${isSelected ? 'filter-pill--active' : ''}`}
                    >
                      {category}
                    </button>
                  )
                })}
              </div>
            </section>
          )}
          {availableTags.length > 0 && (
            <section className="recipes-filter-group" aria-labelledby="tag-filter-heading">
              <div className="recipes-filter-group__header">
                <p id="tag-filter-heading" className="recipes-filter-label">
                  Tags
                </p>
                {selectedTags.length ? (
                  <span>{selectedTags.length} selected</span>
                ) : null}
              </div>
              <div className="recipes-chip-tray">
                {availableTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag)
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      aria-pressed={isSelected}
                      className={`filter-pill ${isSelected ? 'filter-pill--active' : ''}`}
                    >
                      {tag}
                    </button>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      </form>

      {recipes.length === 0 ? (
        <EmptyState title="No recipes yet">
          <p>{emptyMessage}</p>
        </EmptyState>
      ) : filteredRecipes.length === 0 ? (
        <EmptyState title="No matches">
          <p>{noMatchMessage}</p>
        </EmptyState>
      ) : (
        <section className="recipe-grid sm:grid-cols-2 lg:grid-cols-3">
          {filteredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              isFavorite={isFavorite(recipe.id)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </section>
      )}
    </section>
  )
}

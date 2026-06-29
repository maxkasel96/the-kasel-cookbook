import Link from 'next/link'
import { Clock, Flame, Users } from 'lucide-react'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

import {
  Button,
  MetadataPill,
  PageShell,
  Panel,
} from '@/components/ui/primitives'
import { getMealBySlug, getMeals } from '@/lib/db/meals'
import { getRecipeBySlug } from '@/lib/db/recipes'
import FavoriteRecipeButton from './FavoriteRecipeButton'
import MealRecipeNavigator from './MealRecipeNavigator'
import RecipeAiChat from './RecipeAiChat'
import RecipeViewTracker from './RecipeViewTracker'
import RecipeServingsSection from './recipe-servings-section'
import ScreenWakeLockButton from './ScreenWakeLockButton'

type RecipeDetailPageProps = {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{
    meal?: string | string[]
  }>
}

type LinkedName = {
  name?: string | null
}

type RecipeMetadataLink = {
  tags?: LinkedName | LinkedName[] | null
  categories?: LinkedName | LinkedName[] | null
}

type MealRecipeLink = {
  id?: string | number | null
  slug?: string | null
  title?: string | null
}

type MealRecipeJoin = {
  recipes?: MealRecipeLink | MealRecipeLink[] | null
}

const isPresentString = (value: string | null | undefined): value is string =>
  Boolean(value)

const formatMinutes = (minutes: number) => {
  if (minutes <= 60) {
    return `${minutes} min`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  const hourLabel = hours === 1 ? 'hour' : 'hours'

  if (!remainingMinutes) {
    return `${hours} ${hourLabel}`
  }

  const minuteLabel = remainingMinutes === 1 ? 'minute' : 'minutes'

  return `${hours} ${hourLabel} ${remainingMinutes} ${minuteLabel}`
}

const getLinkedNames = (
  links: RecipeMetadataLink[] | null | undefined,
  key: 'tags' | 'categories'
) =>
  links
    ?.flatMap((link) => {
      const value = link?.[key]

      if (Array.isArray(value)) {
        return value.map((item) => item?.name).filter(isPresentString)
      }

      return value?.name ? [value.name] : []
    })
    .filter(isPresentString) ?? []

const getRecipeFromMealRecipe = (mealRecipe: MealRecipeJoin) => {
  if (Array.isArray(mealRecipe?.recipes)) {
    return mealRecipe.recipes[0] ?? null
  }

  return mealRecipe?.recipes ?? null
}

export default async function RecipeDetailPage({
  params,
  searchParams,
}: RecipeDetailPageProps) {
  const { slug } = await params
  const resolvedSearchParams = await searchParams
  const mealSlugParam = resolvedSearchParams?.meal
  const mealSlug = Array.isArray(mealSlugParam)
    ? mealSlugParam[0]
    : mealSlugParam
  const recipe = await getRecipeBySlug(slug)
  const meals = await getMeals()

  if (!recipe) {
    notFound()
  }

  const activeMeal = mealSlug ? await getMealBySlug(mealSlug) : null
  const mealRecipes =
    activeMeal?.meal_recipes
      ?.map((mealRecipe: MealRecipeJoin) => getRecipeFromMealRecipe(mealRecipe))
      .filter(
        (mealRecipe): mealRecipe is MealRecipeLink =>
          Boolean(mealRecipe?.slug && mealRecipe?.title)
      ) ?? []
  const currentMealRecipeIndex = mealRecipes.findIndex(
    (mealRecipe) => mealRecipe.slug === recipe.slug
  )
  const mealNavigation =
    activeMeal && currentMealRecipeIndex >= 0 && mealRecipes.length > 1
      ? {
          meal: {
            slug: activeMeal.slug,
            title: activeMeal.title,
          },
          currentIndex: currentMealRecipeIndex,
          recipes: mealRecipes.map((mealRecipe) => ({
            slug: String(mealRecipe.slug),
            title: String(mealRecipe.title),
          })),
        }
      : null

  const tagList = getLinkedNames(recipe.recipe_tags, 'tags')
  const categoryList = getLinkedNames(
    recipe.recipe_categories,
    'categories'
  )

  const detailItems = [
    recipe.prep_minutes
      ? {
          label: 'Prep',
          value: formatMinutes(recipe.prep_minutes),
          icon: <Clock aria-hidden="true" />,
        }
      : null,
    recipe.cook_minutes
      ? {
          label: 'Cook',
          value: formatMinutes(recipe.cook_minutes),
          icon: <Flame aria-hidden="true" />,
        }
      : null,
    recipe.servings
      ? {
          label: 'Serves',
          value: recipe.servings,
          icon: <Users aria-hidden="true" />,
        }
      : null,
  ].filter(Boolean) as {
    label: string
    value: string | number
    icon: ReactNode
  }[]

  return (
    <PageShell variant="detail">
      <RecipeViewTracker
        recipeId={String(recipe.id)}
        recipeTitle={recipe.title}
        recipeSlug={recipe.slug}
        category={categoryList[0]}
        tags={tagList}
      />
      {mealNavigation ? (
        <MealRecipeNavigator
          meal={mealNavigation.meal}
          currentIndex={mealNavigation.currentIndex}
          recipes={mealNavigation.recipes}
        />
      ) : null}
      <Panel className="recipe-detail-hero">
        <div className="recipe-detail-heading">
          <div className="recipe-detail-heading__copy">
            <p className="recipe-detail-kicker">Saved recipe</p>
            <h1>{recipe.title}</h1>
            {recipe.description ? <p>{recipe.description}</p> : null}
          </div>
          <div className="recipe-detail-header-actions" aria-label="Recipe actions">
            <FavoriteRecipeButton
              recipe={{
                id: recipe.id,
                slug: recipe.slug,
                title: recipe.title,
                description: recipe.description,
                prep_minutes: recipe.prep_minutes,
                cook_minutes: recipe.cook_minutes,
                servings: recipe.servings,
                recipe_tags: recipe.recipe_tags,
                recipe_categories: recipe.recipe_categories,
              }}
            />
            <Button as={Link} href={`/recipes/${recipe.slug}/edit`} size="sm">
              Edit
            </Button>
          </div>
        </div>
        {detailItems.length ? (
          <div className="recipe-detail-stats">
            {detailItems.map((item) => (
              <MetadataPill
                key={item.label}
                icon={item.icon}
                label={item.label}
                value={item.value}
              />
            ))}
          </div>
        ) : (
          <p className="recipe-detail-muted">
            Prep, cook, and serving details have not been added yet.
          </p>
        )}
        <div className="recipe-detail-taxonomy">
          {categoryList.length ? (
            <div>
              <span className="recipe-detail-taxonomy__label">
                Categories
              </span>
              {categoryList.map((category: string) => (
                <span
                  key={category}
                  className="recipe-detail-chip"
                >
                  {category}
                </span>
              ))}
            </div>
          ) : (
            <p className="recipe-detail-muted">No categories have been associated with this recipe.</p>
          )}
          {tagList.length ? (
            <div>
              <span className="recipe-detail-taxonomy__label">
                Tags
              </span>
              {tagList.map((tag: string) => (
                <span
                  key={tag}
                  className="recipe-detail-chip"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <p className="recipe-detail-muted">No tags have been associated with this recipe.</p>
          )}
        </div>
      </Panel>

      <RecipeServingsSection
        ingredients={recipe.recipe_ingredients ?? []}
        initialServings={recipe.servings ?? null}
        steps={recipe.recipe_instruction_steps ?? []}
        meals={meals}
        recipeId={recipe.id}
        recipeTitle={recipe.title}
      />

      <RecipeAiChat
        recipeId={String(recipe.id)}
        recipeSlug={recipe.slug}
        recipeTitle={recipe.title}
      />

      <div className="recipe-detail-floating-actions fixed bottom-6 right-6 z-10">
        <ScreenWakeLockButton />
      </div>
    </PageShell>
  )
}

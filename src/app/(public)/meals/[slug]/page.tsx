import { Clock } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import {
  Badge,
  EmptyState,
  MetadataPill,
  PageHeader,
  PageShell,
  Panel,
} from '@/components/ui/primitives'
import { getMealBySlug } from '@/lib/db/meals'

type MealDetailPageProps = {
  params: Promise<{ slug: string }>
}

type MealRecipeLink = {
  id?: string | number | null
  slug?: string | null
  title?: string | null
  description?: string | null
  prep_minutes?: number | null
  cook_minutes?: number | null
}

type MealRecipeJoin = {
  recipes?: MealRecipeLink | MealRecipeLink[] | null
}

const getRecipeFromMealRecipe = (mealRecipe: MealRecipeJoin) => {
  if (Array.isArray(mealRecipe?.recipes)) {
    return mealRecipe.recipes[0] ?? null
  }

  return mealRecipe?.recipes ?? null
}

const formatMinutes = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}

export default async function MealDetailPage({ params }: MealDetailPageProps) {
  const { slug } = await params
  const meal = await getMealBySlug(slug)

  if (!meal) {
    notFound()
  }

  const recipes =
    meal.meal_recipes
      ?.map((mealRecipe: MealRecipeJoin) => getRecipeFromMealRecipe(mealRecipe))
      .filter(
        (recipe): recipe is MealRecipeLink =>
          Boolean(recipe?.id && recipe?.slug && recipe?.title)
      ) ?? []

  return (
    <PageShell variant="default">
      <Panel className="meal-detail-hero">
        <PageHeader
          title={meal.title}
          subtitle={meal.description || undefined}
          actions={
            <MetadataPill
              label="Collection"
              value={`${recipes.length} recipe${recipes.length === 1 ? '' : 's'}`}
            />
          }
        />
      </Panel>

      {recipes.length === 0 ? (
        <EmptyState title="No recipes yet">
          <p>No recipes have been added to this meal yet.</p>
        </EmptyState>
      ) : (
        <section className="meal-detail-grid">
          {recipes.map((recipe, index) => {
            const totalTime =
              (recipe.prep_minutes ?? 0) + (recipe.cook_minutes ?? 0) || null

            return (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.slug}?meal=${encodeURIComponent(
                  meal.slug
                )}`}
                className="meal-detail-recipe"
              >
                <div className="meal-detail-recipe__top">
                  <Badge variant="neutral">Recipe {index + 1}</Badge>
                  {totalTime ? (
                    <span>
                      <Clock aria-hidden="true" />
                      {formatMinutes(totalTime)}
                    </span>
                  ) : null}
                </div>
                <div className="meal-detail-recipe__body">
                  <h2>{recipe.title}</h2>
                  <p>
                    {recipe.description || 'A saved recipe ready for the kitchen.'}
                  </p>
                </div>
                <span className="meal-detail-recipe__action">
                  Cook this
                </span>
              </Link>
            )
          })}
        </section>
      )}
    </PageShell>
  )
}

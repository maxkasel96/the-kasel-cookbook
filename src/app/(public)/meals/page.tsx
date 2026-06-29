import Link from 'next/link'

import { Badge, EmptyState, PageHeader, PageShell } from '@/components/ui/primitives'
import { getMeals } from '@/lib/db/meals'

type MealRecipeJoin = {
  recipes?:
    | {
        id?: string | number | null
        slug?: string | null
        title?: string | null
      }
    | Array<{
        id?: string | number | null
        slug?: string | null
        title?: string | null
      }>
    | null
}

const getRecipePreview = (mealRecipe: MealRecipeJoin) => {
  if (Array.isArray(mealRecipe.recipes)) {
    return mealRecipe.recipes[0] ?? null
  }

  return mealRecipe.recipes ?? null
}

export default async function MealsPage() {
  const meals = await getMeals()

  return (
    <PageShell variant="wide">
      <PageHeader title="Meals" />

      {meals.length === 0 ? (
        <EmptyState title="No meals yet">
          <p>Add a recipe to a meal to start building a collection.</p>
        </EmptyState>
      ) : (
        <section className="meal-grid">
          {meals.map((meal) => {
            const previews =
              meal.meal_recipes
                ?.map((mealRecipe: MealRecipeJoin) => getRecipePreview(mealRecipe))
                .filter(
                  (
                    recipe
                  ): recipe is { id: string | number; title: string; slug: string } =>
                    Boolean(recipe?.id && recipe?.title && recipe?.slug)
                ) ?? []
            const recipeCount = meal.meal_recipes?.length ?? 0

            return (
              <Link key={meal.id} href={`/meals/${meal.slug}`} className="meal-card">
                <div className="meal-card__header">
                  <Badge variant="primary">
                    {recipeCount} recipe{recipeCount === 1 ? '' : 's'}
                  </Badge>
                </div>
                <div className="meal-card__body">
                  <h2>{meal.title}</h2>
                  <p>
                    {meal.description || 'A curated collection of favorite recipes.'}
                  </p>
                </div>
                {previews.length ? (
                  <div className="meal-card__preview">
                    <span>
                      Preview
                    </span>
                    <ul>
                      {previews.slice(0, 3).map((recipe) => (
                        <li key={recipe.id}>{recipe.title}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <span className="meal-card__action">
                  View meal
                </span>
              </Link>
            )
          })}
        </section>
      )}
    </PageShell>
  )
}

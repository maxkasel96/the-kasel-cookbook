import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getMealBySlug } from '@/lib/db/meals'

type MealDetailPageProps = {
  params: Promise<{ slug: string }>
}

type MealRecipeLink = {
  id?: string | number | null
  slug?: string | null
  title?: string | null
  description?: string | null
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
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Meal plan
        </p>
        <h1 className="text-3xl font-semibold text-foreground">{meal.title}</h1>
        {meal.description ? (
          <p className="text-base text-muted-foreground">{meal.description}</p>
        ) : (
          <p className="text-base text-muted-foreground">
            A set of recipes grouped together for easy planning.
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          {recipes.length} recipe{recipes.length === 1 ? '' : 's'} in this
          meal.
        </p>
      </header>

      {recipes.length === 0 ? (
        <p className="rounded-lg border border-dashed border-muted-foreground/40 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
          No recipes have been added to this meal yet.
        </p>
      ) : (
        <section className="grid gap-6 sm:grid-cols-2">
          {recipes.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.slug}?meal=${encodeURIComponent(
                meal.slug
              )}`}
              className="group flex h-full flex-col rounded-xl border border-muted/60 bg-background p-5 shadow-sm transition hover:-translate-y-1 hover:border-muted hover:shadow-md"
            >
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
    </main>
  )
}

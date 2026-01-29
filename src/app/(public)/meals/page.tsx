import Link from 'next/link'

import { getMeals } from '@/lib/db/meals'

export default async function MealsPage() {
  const meals = await getMeals()

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Meals
        </p>
        <h1 className="text-3xl font-semibold text-foreground">Saved meals</h1>
        <p className="text-base text-muted-foreground">
          Build weekly plans or event menus with collections of recipes.
        </p>
      </header>

      {meals.length === 0 ? (
        <p className="rounded-lg border border-dashed border-muted-foreground/40 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
          No meals have been created yet. Add a recipe to a meal to get started.
        </p>
      ) : (
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {meals.map((meal: any) => {
            const recipeCount = meal.meal_recipes?.length ?? 0
            return (
              <Link
                key={meal.id}
                href={`/meals/${meal.slug}`}
                className="group flex h-full flex-col rounded-xl border border-muted/60 bg-background p-5 shadow-sm transition hover:-translate-y-1 hover:border-muted hover:shadow-md"
              >
                <div className="flex flex-1 flex-col gap-3">
                  <h2 className="text-xl font-semibold text-foreground transition group-hover:text-primary">
                    {meal.title}
                  </h2>
                  {meal.description ? (
                    <p className="text-sm text-muted-foreground">
                      {meal.description}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      A curated collection of favorite recipes.
                    </p>
                  )}
                </div>
                <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
                  <span>{recipeCount} recipe{recipeCount === 1 ? '' : 's'}</span>
                  <span className="font-medium text-primary">
                    View meal →
                  </span>
                </div>
              </Link>
            )
          })}
        </section>
      )}
    </main>
  )
}

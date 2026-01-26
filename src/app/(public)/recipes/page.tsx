import Link from 'next/link'

import { searchRecipes } from '@/lib/db/recipes'

export default async function RecipesPage() {
  const recipes = await searchRecipes()

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">Recipes</h1>
        <p className="text-base text-muted-foreground">
          Browse every saved recipe and jump back into the full details.
        </p>
      </header>

      {recipes.length === 0 ? (
        <p className="rounded-lg border border-dashed border-muted-foreground/40 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
          No recipes have been published yet.
        </p>
      ) : (
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe: any) => (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.slug}`}
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

import { notFound } from 'next/navigation'

import { getRecipeBySlug } from '@/lib/db/recipes'

type RecipeDetailPageProps = {
  params: { slug: string }
}

export default async function RecipeDetailPage({
  params,
}: RecipeDetailPageProps) {
  const recipe = await getRecipeBySlug(params.slug)

  if (!recipe) {
    notFound()
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-10">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Saved recipe
        </p>
        <h1 className="text-4xl font-semibold text-foreground">
          {recipe.title}
        </h1>
        {recipe.description ? (
          <p className="text-base text-muted-foreground">
            {recipe.description}
          </p>
        ) : null}
      </header>

      <section className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div className="rounded-2xl border border-muted/60 bg-muted/10 p-6">
          <h2 className="text-xl font-semibold text-foreground">
            Ingredients
          </h2>
          {recipe.recipe_ingredients?.length ? (
            <ul className="mt-4 space-y-3 text-sm text-foreground">
              {recipe.recipe_ingredients.map((ingredient: any) => (
                <li key={ingredient.id} className="flex flex-col">
                  <span className="font-medium">
                    {ingredient.quantity
                      ? `${ingredient.quantity} `
                      : ''}
                    {ingredient.unit ? `${ingredient.unit} ` : ''}
                    {ingredient.ingredient_text}
                  </span>
                  {(ingredient.note || ingredient.is_optional) && (
                    <span className="text-xs text-muted-foreground">
                      {ingredient.note}
                      {ingredient.note && ingredient.is_optional ? ' · ' : ''}
                      {ingredient.is_optional ? 'Optional' : ''}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              No ingredients were saved for this recipe.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-muted/60 bg-background p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">
            Instructions
          </h2>
          {recipe.recipe_instruction_steps?.length ? (
            <ol className="mt-4 list-decimal space-y-4 pl-6 text-sm text-foreground">
              {recipe.recipe_instruction_steps.map((step: any) => (
                <li key={step.id} className="leading-relaxed">
                  {step.content}
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              No preparation steps were saved for this recipe.
            </p>
          )}
        </div>
      </section>
    </main>
  )
}

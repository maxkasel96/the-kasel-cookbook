import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getRecipeBySlug } from '@/lib/db/recipes'
import { RecipeIngredients } from './recipe-ingredients'

type RecipeDetailPageProps = {
  params: Promise<{ slug: string }>
}

export default async function RecipeDetailPage({
  params,
}: RecipeDetailPageProps) {
  const { slug } = await params
  const recipe = await getRecipeBySlug(slug)

  if (!recipe) {
    notFound()
  }

  const tagList =
    recipe.recipe_tags?.map((tagLink: any) => tagLink.tags?.name).filter(Boolean) ?? []

  const detailItems = [
    recipe.prep_minutes
      ? { label: 'Prep time', value: `${recipe.prep_minutes} min` }
      : null,
    recipe.cook_minutes
      ? { label: 'Cook time', value: `${recipe.cook_minutes} min` }
      : null,
  ].filter(Boolean) as { label: string; value: string | number }[]

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
        {detailItems.length ? (
          <dl className="mt-4 grid gap-3 rounded-2xl border border-muted/60 bg-muted/10 p-4 text-sm text-foreground sm:grid-cols-3">
            {detailItems.map((item) => (
              <div key={item.label} className="space-y-1">
                <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {item.label}
                </dt>
                <dd className="text-base font-semibold">{item.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Prep, cook, and serving details have not been added yet.
          </p>
        )}
        {tagList.length ? (
          <div className="flex flex-wrap gap-2">
            {tagList.map((tag: string) => (
              <span
                key={tag}
                className="rounded-full border border-muted/60 bg-muted/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            No tags have been associated with this recipe.
          </p>
        )}
      </header>

      <section className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <RecipeIngredients
          ingredients={recipe.recipe_ingredients ?? []}
          initialServings={recipe.servings ?? null}
        />

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

      <div className="fixed bottom-6 right-6 z-10">
        <Link
          href={`/recipes/${recipe.slug}/edit`}
          className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-danger"
        >
          Edit recipe
        </Link>
      </div>
    </main>
  )
}

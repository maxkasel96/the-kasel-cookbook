import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getMeals } from '@/lib/db/meals'
import { getRecipeBySlug } from '@/lib/db/recipes'
import FavoriteRecipeButton from './FavoriteRecipeButton'
import RecipeServingsSection from './recipe-servings-section'

type RecipeDetailPageProps = {
  params: Promise<{ slug: string }>
}

export default async function RecipeDetailPage({
  params,
}: RecipeDetailPageProps) {
  const { slug } = await params
  const recipe = await getRecipeBySlug(slug)
  const meals = await getMeals()

  if (!recipe) {
    notFound()
  }

  const tagList =
    recipe.recipe_tags
      ?.flatMap((tagLink: any) => {
        if (Array.isArray(tagLink?.tags)) {
          return tagLink.tags.map((tag: any) => tag?.name).filter(Boolean)
        }
        return tagLink?.tags?.name ? [tagLink.tags.name] : []
      })
      .filter(Boolean) ?? []

  const categoryList =
    recipe.recipe_categories
      ?.flatMap((categoryLink: any) => {
        if (Array.isArray(categoryLink?.categories)) {
          return categoryLink.categories
            .map((category: any) => category?.name)
            .filter(Boolean)
        }
        return categoryLink?.categories?.name
          ? [categoryLink.categories.name]
          : []
      })
      .filter(Boolean) ?? []

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
      <header className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
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
          </div>
          <FavoriteRecipeButton
            recipe={{
              id: recipe.id,
              slug: recipe.slug,
              title: recipe.title,
              description: recipe.description,
              recipe_tags: recipe.recipe_tags,
              recipe_categories: recipe.recipe_categories,
            }}
          />
        </div>
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
        <div className="space-y-2 text-xs text-muted-foreground">
          {categoryList.length ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Categories
              </span>
              {categoryList.map((category: string) => (
                <span
                  key={category}
                  className="rounded-full border border-muted/60 bg-muted/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
                >
                  {category}
                </span>
              ))}
            </div>
          ) : (
            <p>No categories have been associated with this recipe.</p>
          )}
          {tagList.length ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Tags
              </span>
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
            <p>No tags have been associated with this recipe.</p>
          )}
        </div>
      </header>

      <RecipeServingsSection
        ingredients={recipe.recipe_ingredients ?? []}
        initialServings={recipe.servings ?? null}
        steps={recipe.recipe_instruction_steps ?? []}
        meals={meals}
        recipeId={recipe.id}
        recipeTitle={recipe.title}
      />

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

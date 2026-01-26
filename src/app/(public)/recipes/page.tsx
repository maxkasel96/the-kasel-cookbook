import { searchRecipes } from '@/lib/db/recipes'
import RecipesClient from './RecipesClient'

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

      <RecipesClient recipes={recipes} />
    </main>
  )
}

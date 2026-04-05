import { searchRecipes } from '@/lib/db/recipes'
import RecipesClient from './RecipesClient'

export default async function RecipesPage() {
  const recipes = await searchRecipes()

  return (
    <main className="page-shell">
      <header className="page-heading">
        <p className="page-kicker">Recipe Collection</p>
        <h1 className="page-title">Recipes</h1>
        <p className="page-intro">
          Browse every saved recipe and jump back into the full details.
        </p>
      </header>

      <RecipesClient recipes={recipes} />
    </main>
  )
}

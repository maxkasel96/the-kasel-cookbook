import { searchRecipes } from '@/lib/db/recipes'
import { PageHeader, PageShell } from '@/components/ui/primitives'
import RecipesClient from './RecipesClient'

export default async function RecipesPage() {
  const recipes = await searchRecipes()

  return (
    <PageShell variant="wide">
      <PageHeader title="Recipes" />

      <RecipesClient recipes={recipes} />
    </PageShell>
  )
}

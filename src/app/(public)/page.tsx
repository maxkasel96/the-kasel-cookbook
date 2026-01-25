import { searchRecipes } from '@/lib/db/recipes'

export default async function PublicHomePage({
  searchParams,
}: {
  searchParams?: { q?: string }
}) {
  const q = searchParams?.q
  const recipes = await searchRecipes(q)

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">The Kasel Cookbook</h1>

      {recipes.length === 0 ? (
        <p className="text-gray-500">No recipes found.</p>
      ) : (
        <ul className="space-y-4">
          {recipes.map((recipe: any) => (
            <li key={recipe.id} className="border p-4 rounded">
              <h2 className="text-xl font-semibold">{recipe.title}</h2>
              {recipe.description && (
                <p className="text-gray-600">{recipe.description}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}


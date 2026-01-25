import { getPublishedRecipes } from '@/lib/db/recipes'

export default async function PublicHomePage() {
  const recipes = await getPublishedRecipes()

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">The Kasel Cookbook</h1>

      {recipes.length === 0 && (
        <p className="text-gray-500">No recipes yet.</p>
      )}

      <ul className="space-y-4">
        {recipes.map((recipe) => (
          <li key={recipe.id} className="border p-4 rounded">
            <h2 className="text-xl font-semibold">{recipe.title}</h2>
            {recipe.description && (
              <p className="text-gray-600">{recipe.description}</p>
            )}
          </li>
        ))}
      </ul>
    </main>
  )
}

export async function searchRecipes(query?: string) {
  const supabase = createSupabaseServerClient()

  let request = supabase
    .from('recipes')
    .select('*')
    .eq('status', 'published')

  if (query) {
    request = request.ilike('title', `%${query}%`)
  }

  const { data, error } = await request

  if (error) throw new Error(error.message)
  return data
}


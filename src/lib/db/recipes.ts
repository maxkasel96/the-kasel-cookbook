import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function searchRecipes(query?: string) {
  const supabase = await createSupabaseServerClient()

  let request = supabase
    .from('recipes')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (query && query.trim().length > 0) {
    request = request.ilike('title', `%${query.trim()}%`)
  }

  const { data, error } = await request
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getRecipeBySlug(slug: string) {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('recipes')
    .select(
      `
        id,
        title,
        description,
        slug,
        created_at,
        recipe_ingredients (
          id,
          ingredient_text,
          quantity,
          unit,
          note,
          is_optional,
          position
        ),
        recipe_instruction_steps (
          id,
          content,
          position
        )
      `
    )
    .eq('status', 'published')
    .eq('slug', slug)
    .order('position', { foreignTable: 'recipe_ingredients', ascending: true })
    .order('position', {
      foreignTable: 'recipe_instruction_steps',
      ascending: true,
    })
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

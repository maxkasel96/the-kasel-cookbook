import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function getMeals() {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('meals')
    .select(
      `
        id,
        title,
        slug,
        description,
        created_at,
        meal_recipes (
          id
        )
      `
    )
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getMealBySlug(slug: string) {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('meals')
    .select(
      `
        id,
        title,
        slug,
        description,
        created_at,
        meal_recipes (
          id,
          recipe_id,
          recipes (
            id,
            title,
            slug,
            description,
            prep_minutes,
            cook_minutes
          )
        )
      `
    )
    .eq('slug', slug)
    .order('created_at', { foreignTable: 'meal_recipes', ascending: true })
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

import { isLocalAuthBypassEnabled } from '@/lib/auth/local'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { createSupabaseServerClient } from '@/lib/supabase/server'

function shouldUseLocalMealReadBypass() {
  return (
    isLocalAuthBypassEnabled() && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  )
}

async function createMealReadClient() {
  if (shouldUseLocalMealReadBypass()) {
    return createSupabaseAdminClient()
  }

  return createSupabaseServerClient()
}

export async function getMeals() {
  const supabase = await createMealReadClient()

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
          recipes (
            id,
            title,
            slug
          )
        )
      `
    )
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getMealBySlug(slug: string) {
  const supabase = await createMealReadClient()

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

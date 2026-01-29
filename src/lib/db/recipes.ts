import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function searchRecipes(query?: string) {
  const supabase = await createSupabaseServerClient()

  let request = supabase
    .from('recipes')
    .select(
      `
        *,
        recipe_tags (
          tag_id,
          tags (
            id,
            name,
            category
          )
        ),
        recipe_categories (
          category_id,
          categories (
            id,
            name
          )
        )
      `
    )
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
        prep_minutes,
        cook_minutes,
        servings,
        created_at,
        recipe_ingredients (
          id,
          quantity,
          unit,
          ingredient_text,
          note,
          is_optional,
          position
        ),
        recipe_instruction_steps (
          id,
          content,
          position
        ),
        recipe_tags (
          tag_id,
          tags (
            id,
            name,
            category
          )
        ),
        recipe_categories (
          category_id,
          categories (
            id,
            name
          )
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
  if (!data) return data

  const stepIds = (data.recipe_instruction_steps ?? [])
    .map((step: { id?: string }) => step.id)
    .filter(Boolean)

  if (!stepIds.length) {
    return data
  }

  const {
    data: stepIngredientLinks,
    error: stepIngredientError,
  } = await supabase
    .from('recipe_instruction_step_ingredients')
    .select('step_id, ingredient_id')
    .in('step_id', stepIds as string[])

  if (stepIngredientError) {
    console.warn(
      'Failed to load recipe instruction step ingredients',
      stepIngredientError.message
    )
    return data
  }

  const linksByStepId = new Map<string, { ingredient_id: string }[]>()
  stepIngredientLinks?.forEach((link) => {
    const stepId = String(link.step_id)
    const existing = linksByStepId.get(stepId) ?? []
    linksByStepId.set(stepId, [
      ...existing,
      { ingredient_id: String(link.ingredient_id) },
    ])
  })

  return {
    ...data,
    recipe_instruction_steps: (data.recipe_instruction_steps ?? []).map(
      (step: { id?: string }) => ({
        ...step,
        recipe_instruction_step_ingredients:
          linksByStepId.get(String(step.id)) ?? [],
      })
    ),
  }
}

export async function getRecipeForEditBySlug(slug: string) {
  const hasServiceRole =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  const supabase = hasServiceRole
    ? createSupabaseAdminClient()
    : await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('recipes')
    .select(
      `
        id,
        title,
        description,
        slug,
        prep_minutes,
        cook_minutes,
        servings,
        created_at,
        recipe_ingredients (
          id,
          quantity,
          unit,
          ingredient_text,
          note,
          is_optional,
          position
        ),
        recipe_instruction_steps (
          id,
          content,
          position
        ),
        recipe_tags (
          tag_id,
          tags (
            id,
            name,
            category
          )
        ),
        recipe_categories (
          category_id,
          categories (
            id,
            name
          )
        )
      `
    )
    .eq('slug', slug)
    .order('position', { foreignTable: 'recipe_ingredients', ascending: true })
    .order('position', {
      foreignTable: 'recipe_instruction_steps',
      ascending: true,
    })
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return data

  const stepIds = (data.recipe_instruction_steps ?? [])
    .map((step: { id?: string }) => step.id)
    .filter(Boolean)

  if (!stepIds.length) {
    return data
  }

  const {
    data: stepIngredientLinks,
    error: stepIngredientError,
  } = await supabase
    .from('recipe_instruction_step_ingredients')
    .select('step_id, ingredient_id')
    .in('step_id', stepIds as string[])

  if (stepIngredientError) {
    console.warn(
      'Failed to load recipe instruction step ingredients',
      stepIngredientError.message
    )
    return data
  }

  const linksByStepId = new Map<string, { ingredient_id: string }[]>()
  stepIngredientLinks?.forEach((link) => {
    const stepId = String(link.step_id)
    const existing = linksByStepId.get(stepId) ?? []
    linksByStepId.set(stepId, [
      ...existing,
      { ingredient_id: String(link.ingredient_id) },
    ])
  })

  return {
    ...data,
    recipe_instruction_steps: (data.recipe_instruction_steps ?? []).map(
      (step: { id?: string }) => ({
        ...step,
        recipe_instruction_step_ingredients:
          linksByStepId.get(String(step.id)) ?? [],
      })
    ),
  }
}

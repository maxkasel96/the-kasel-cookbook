import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const recipesSelectWithCategories = `
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

const recipesSelectWithoutCategories = `
  *,
  recipe_tags (
    tag_id,
    tags (
      id,
      name,
      category
    )
  )
`

type RecipeRecord = {
  id: string
  title: string
  description?: string | null
  slug?: string
  prep_minutes?: number | null
  cook_minutes?: number | null
  servings?: number | null
  created_at?: string
  recipe_ingredients?: unknown[] | null
  recipe_instruction_steps?: unknown[] | null
  recipe_tags?: unknown[] | null
  recipe_categories?: unknown[] | null
}

const isMissingCategoryRelation = (message?: string) => {
  if (!message) return false
  const normalized = message.toLowerCase()
  return (
    normalized.includes('recipe_categories') ||
    normalized.includes('categories') ||
    normalized.includes('relationship') ||
    normalized.includes('relation')
  )
}

export async function searchRecipes(query?: string): Promise<RecipeRecord[]> {
  const supabase = await createSupabaseServerClient()

  const buildRequest = (selectClause: string) => {
    let request = supabase
      .from('recipes')
      .select(selectClause as string)
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    if (query && query.trim().length > 0) {
      request = request.ilike('title', `%${query.trim()}%`)
    }

    return request
  }

  let { data, error } = await buildRequest(recipesSelectWithCategories)
  if (error && isMissingCategoryRelation(error.message)) {
    const retry = await buildRequest(recipesSelectWithoutCategories)
    data = retry.data
    error = retry.error
  }

  if (error) throw new Error(error.message)
  return (data ?? []) as RecipeRecord[]
}

const recipeDetailSelectWithCategories = `
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

const recipeDetailSelectWithoutCategories = `
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
  )
`

export async function getRecipeBySlug(
  slug: string
): Promise<RecipeRecord | null> {
  const supabase = await createSupabaseServerClient()

  const buildRequest = (selectClause: string) =>
    supabase
      .from('recipes')
      .select(selectClause as string)
      .eq('status', 'published')
      .eq('slug', slug)
      .order('position', { foreignTable: 'recipe_ingredients', ascending: true })
      .order('position', {
        foreignTable: 'recipe_instruction_steps',
        ascending: true,
      })
      .maybeSingle()

  let { data, error } = await buildRequest(recipeDetailSelectWithCategories)
  if (error && isMissingCategoryRelation(error.message)) {
    const retry = await buildRequest(recipeDetailSelectWithoutCategories)
    data = retry.data
    error = retry.error
  }

  if (error) throw new Error(error.message)
  return (data ?? null) as RecipeRecord | null
}

const recipeEditSelectWithCategories = `
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

const recipeEditSelectWithoutCategories = `
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
  )
`

export async function getRecipeForEditBySlug(
  slug: string
): Promise<RecipeRecord | null> {
  const hasServiceRole =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  const supabase = hasServiceRole
    ? createSupabaseAdminClient()
    : await createSupabaseServerClient()

  const buildRequest = (selectClause: string) =>
    supabase
      .from('recipes')
      .select(selectClause as string)
      .eq('slug', slug)
      .order('position', { foreignTable: 'recipe_ingredients', ascending: true })
      .order('position', {
        foreignTable: 'recipe_instruction_steps',
        ascending: true,
      })
      .maybeSingle()

  let { data, error } = await buildRequest(recipeEditSelectWithCategories)
  if (error && isMissingCategoryRelation(error.message)) {
    const retry = await buildRequest(recipeEditSelectWithoutCategories)
    data = retry.data
    error = retry.error
  }

  if (error) throw new Error(error.message)
  return (data ?? null) as RecipeRecord | null
}

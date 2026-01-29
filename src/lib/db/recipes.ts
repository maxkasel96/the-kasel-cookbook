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
` as const

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
` as const

type RecipesSelectClause =
  | typeof recipesSelectWithCategories
  | typeof recipesSelectWithoutCategories

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

export async function searchRecipes(query?: string) {
  const supabase = await createSupabaseServerClient()

  const buildRequest = (selectClause: RecipesSelectClause) => {
    let request = supabase
      .from('recipes')
      .select(selectClause)
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
  return data ?? []
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
` as const

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
` as const

type RecipeDetailSelectClause =
  | typeof recipeDetailSelectWithCategories
  | typeof recipeDetailSelectWithoutCategories

export async function getRecipeBySlug(slug: string) {
  const supabase = await createSupabaseServerClient()

  const buildRequest = (selectClause: RecipeDetailSelectClause) =>
    supabase
      .from('recipes')
      .select(selectClause)
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
  return data
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
` as const

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
` as const

type RecipeEditSelectClause =
  | typeof recipeEditSelectWithCategories
  | typeof recipeEditSelectWithoutCategories

export async function getRecipeForEditBySlug(slug: string) {
  const hasServiceRole =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  const supabase = hasServiceRole
    ? createSupabaseAdminClient()
    : await createSupabaseServerClient()

  const buildRequest = (selectClause: RecipeEditSelectClause) =>
    supabase
      .from('recipes')
      .select(selectClause)
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
  return data
}

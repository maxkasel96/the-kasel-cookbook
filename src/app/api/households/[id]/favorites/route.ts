import { NextResponse } from 'next/server'

import { createSupabaseServerClient } from '@/lib/supabase/server'

const FAVORITE_RECIPE_SELECT = `
  id,
  slug,
  title,
  description,
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

type RouteParams = {
  params: Promise<{
    id: string
  }>
}

export async function GET(_: Request, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('household_favorites')
    .select(`recipe_id, recipes (${FAVORITE_RECIPE_SELECT})`)
    .eq('household_id', id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const favorites = (data ?? [])
    .map((row) => row.recipes)
    .filter((recipe): recipe is NonNullable<typeof recipe> => Boolean(recipe))

  return NextResponse.json({ favorites })
}

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const body = (await request.json()) as { recipeId?: string }
  const recipeId = body.recipeId?.trim()
  if (!recipeId) {
    return NextResponse.json({ error: 'recipeId is required.' }, { status: 400 })
  }

  const { error } = await supabase.from('household_favorites').upsert(
    {
      household_id: id,
      recipe_id: recipeId,
      added_by: user.id,
    },
    {
      onConflict: 'household_id,recipe_id',
      ignoreDuplicates: true,
    }
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const recipeId = searchParams.get('recipeId')

  if (!recipeId) {
    return NextResponse.json({ error: 'recipeId is required.' }, { status: 400 })
  }

  const { error } = await supabase
    .from('household_favorites')
    .delete()
    .eq('household_id', id)
    .eq('recipe_id', recipeId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

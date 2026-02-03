import { NextResponse } from 'next/server'

import { createSupabaseServerClient } from '@/lib/supabase/server'

type ShoppingListPayload = {
  ingredientText?: string
  recipeId?: string
  recipeTitle?: string
}

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('shopping_list_items')
    .select('id, ingredient_text, is_checked, recipe_id, recipe_title, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ items: data ?? [] })
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const body = (await request.json()) as ShoppingListPayload
  const ingredientText = body.ingredientText?.trim()

  if (!ingredientText) {
    return NextResponse.json(
      { error: 'Ingredient text is required.' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('shopping_list_items')
    .insert({
      user_id: user.id,
      ingredient_text: ingredientText,
      recipe_id: body.recipeId ?? null,
      recipe_title: body.recipeTitle ?? null,
    })
    .select('id, ingredient_text, is_checked, recipe_id, recipe_title, created_at')
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? 'Unable to add item.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ item: data })
}

export async function DELETE() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const { error } = await supabase
    .from('shopping_list_items')
    .delete()
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

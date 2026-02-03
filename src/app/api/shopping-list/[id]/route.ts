import { NextResponse } from 'next/server'

import { createSupabaseServerClient } from '@/lib/supabase/server'

type ShoppingListUpdatePayload = {
  isChecked?: boolean
}

type Params = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }
  const body = (await request.json()) as ShoppingListUpdatePayload

  if (typeof body.isChecked !== 'boolean') {
    return NextResponse.json(
      { error: 'isChecked must be a boolean.' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('shopping_list_items')
    .update({ is_checked: body.isChecked })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, ingredient_text, is_checked, recipe_id, recipe_title, created_at')
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? 'Unable to update item.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ item: data })
}

export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params
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
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

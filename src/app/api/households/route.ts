import { NextResponse } from 'next/server'

import { createSupabaseServerClient } from '@/lib/supabase/server'

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
    .from('households')
    .select('id, name, created_at')
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const households = (data ?? []).map((household) => ({
    id: household.id,
    name: household.name,
    createdAt: household.created_at,
  }))

  return NextResponse.json({ households })
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

  const body = (await request.json()) as { name?: string }
  const name = body.name?.trim()

  if (!name) {
    return NextResponse.json({ error: 'Household name is required.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('households')
    .insert({
      name,
      created_by: user.id,
    })
    .select('id, name, created_at')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Unable to create household.' }, { status: 500 })
  }

  return NextResponse.json(
    {
      household: {
        id: data.id,
        name: data.name,
        createdAt: data.created_at,
      },
    },
    { status: 201 }
  )
}

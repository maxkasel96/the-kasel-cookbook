import { NextResponse } from 'next/server'

import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { createSupabaseServerClient } from '@/lib/supabase/server'

type RouteParams = {
  params: Promise<{
    id: string
  }>
}

const canManageHousehold = async (householdId: string, userId: string) => {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('household_members')
    .select('role')
    .eq('household_id', householdId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data) return false
  return data.role === 'owner' || data.role === 'admin'
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

  const { data: members, error } = await supabase
    .from('household_members')
    .select('user_id, role, created_at')
    .eq('household_id', id)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const adminClient = createSupabaseAdminClient()
  const { data: usersData, error: usersError } = await adminClient.auth.admin.listUsers()

  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 })
  }

  const userById = new Map((usersData.users ?? []).map((u) => [u.id, u.email ?? null]))
  const payload = (members ?? []).map((member) => ({
    userId: member.user_id,
    role: member.role,
    email: userById.get(member.user_id) ?? null,
    createdAt: member.created_at,
  }))

  return NextResponse.json({ members: payload })
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

  const allowed = await canManageHousehold(id, user.id)
  if (!allowed) {
    return NextResponse.json({ error: 'Only household owners/admins can add members.' }, { status: 403 })
  }

  const body = (await request.json()) as { email?: string; role?: 'owner' | 'admin' | 'member' }
  const email = body.email?.trim().toLowerCase()
  const role = body.role ?? 'member'

  if (!email) {
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 })
  }

  if (!['owner', 'admin', 'member'].includes(role)) {
    return NextResponse.json({ error: 'Invalid member role.' }, { status: 400 })
  }

  const adminClient = createSupabaseAdminClient()
  const { data: usersData, error: usersError } = await adminClient.auth.admin.listUsers()

  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 })
  }

  const match = (usersData.users ?? []).find((listedUser) => listedUser.email?.toLowerCase() === email)
  if (!match) {
    return NextResponse.json(
      {
        error: 'User not found. Have the user sign in with Google at least once, then try again.',
      },
      { status: 404 }
    )
  }

  const { error } = await adminClient.from('household_members').upsert(
    {
      household_id: id,
      user_id: match.id,
      role,
    },
    {
      onConflict: 'household_id,user_id',
    }
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(
    {
      member: {
        userId: match.id,
        email: match.email,
        role,
      },
      message: 'Household member saved.',
    },
    { status: 200 }
  )
}

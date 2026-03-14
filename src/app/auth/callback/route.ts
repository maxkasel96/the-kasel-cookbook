import { NextResponse } from 'next/server'

import { syncUserRoleToMetadata } from '@/lib/auth/roles'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const baseUrl = origin

  if (code) {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase.auth.exchangeCodeForSession(code)

    if (data?.user?.id) {
      await syncUserRoleToMetadata(data.user.id)
    }
  }

  return NextResponse.redirect(new URL('/', baseUrl))
}

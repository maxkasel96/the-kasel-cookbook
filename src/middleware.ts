import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

import { ADMIN_ROLE } from '@/lib/auth/roles'

const adminPathPrefixes = ['/admin']
const publicPaths = ['/login', '/auth/callback']

export async function middleware(request: NextRequest) {
  const { nextUrl } = request

  if (nextUrl.pathname === '/' && nextUrl.searchParams.has('code')) {
    const callbackUrl = new URL(
      `/auth/callback${nextUrl.search}`,
      nextUrl.origin
    )
    return NextResponse.redirect(callbackUrl)
  }

  const response = NextResponse.next()

  if (publicPaths.some((path) => nextUrl.pathname.startsWith(path))) {
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value
        },
        set(name, value, options) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', nextUrl.pathname + nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  if (adminPathPrefixes.some((path) => nextUrl.pathname.startsWith(path))) {
    const role = data.user.app_metadata?.role

    if (role !== ADMIN_ROLE) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}

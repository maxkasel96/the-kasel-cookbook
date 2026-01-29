import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

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

  if (nextUrl.pathname.startsWith('/admin')) {
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
      loginUrl.searchParams.set('redirect', nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return response
}

export const config = {
  matcher: ['/', '/admin/:path*'],
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { nextUrl } = request

  if (nextUrl.pathname === '/' && nextUrl.searchParams.has('code')) {
    const callbackUrl = new URL(
      `/auth/callback${nextUrl.search}`,
      nextUrl.origin
    )
    return NextResponse.redirect(callbackUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/'],
}

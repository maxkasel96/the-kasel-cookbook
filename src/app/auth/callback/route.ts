import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const publicSiteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.VERCEL_URL
  const baseUrl = publicSiteUrl
    ? publicSiteUrl.startsWith('http')
      ? publicSiteUrl
      : `https://${publicSiteUrl}`
    : origin

  if (code) {
    const supabase = await createSupabaseServerClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL('/', baseUrl))
}

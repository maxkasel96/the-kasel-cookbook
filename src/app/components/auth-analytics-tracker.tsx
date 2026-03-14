'use client'

import { useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { trackSignInCompleted } from '@/lib/analytics/track'

const AUTH_QUERY_KEY = 'auth'
const GOOGLE_SUCCESS_VALUE = 'google_success'

export default function AuthAnalyticsTracker() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (searchParams.get(AUTH_QUERY_KEY) !== GOOGLE_SUCCESS_VALUE) {
      return
    }

    trackSignInCompleted({ method: 'google' })

    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.delete(AUTH_QUERY_KEY)
    const nextQuery = nextParams.toString()
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname)
  }, [pathname, router, searchParams])

  return null
}

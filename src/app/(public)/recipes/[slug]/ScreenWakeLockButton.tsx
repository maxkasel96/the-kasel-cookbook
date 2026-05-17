'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type WakeLockSentinel = EventTarget & {
  readonly released: boolean
  readonly type: 'screen'
  release: () => Promise<void>
}

type WakeLockNavigator = Navigator & {
  wakeLock?: {
    request: (type: 'screen') => Promise<WakeLockSentinel>
  }
}

export default function ScreenWakeLockButton() {
  const sentinelRef = useRef<WakeLockSentinel | null>(null)
  const wantsWakeLockRef = useRef(false)
  const [isActive, setIsActive] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const releaseWakeLock = useCallback(async () => {
    wantsWakeLockRef.current = false
    const sentinel = sentinelRef.current
    sentinelRef.current = null
    setIsActive(false)

    if (sentinel && !sentinel.released) {
      await sentinel.release()
    }
  }, [])

  const requestWakeLock = useCallback(async () => {
    if (!('wakeLock' in navigator)) {
      setIsSupported(false)
      setError('Wake lock is not supported in this browser.')
      return
    }

    try {
      const nextSentinel = await (navigator as WakeLockNavigator).wakeLock?.request(
        'screen'
      )

      if (!nextSentinel) {
        throw new Error('Wake lock request did not return a lock.')
      }

      sentinelRef.current = nextSentinel
      wantsWakeLockRef.current = true
      setIsActive(true)
      setError(null)

      nextSentinel.addEventListener(
        'release',
        () => {
          if (sentinelRef.current === nextSentinel) {
            sentinelRef.current = null
          }
          setIsActive(false)
        },
        { once: true }
      )
    } catch {
      sentinelRef.current = null
      wantsWakeLockRef.current = false
      setIsActive(false)
      setError('Unable to keep the screen awake right now.')
    }
  }, [])

  useEffect(() => {
    setIsSupported('wakeLock' in navigator)
  }, [])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === 'visible' &&
        wantsWakeLockRef.current &&
        !sentinelRef.current
      ) {
        void requestWakeLock()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      void releaseWakeLock()
    }
  }, [releaseWakeLock, requestWakeLock])

  const handleClick = () => {
    if (isActive) {
      void releaseWakeLock()
      return
    }

    void requestWakeLock()
  }

  const buttonLabel = isActive
    ? 'Allow the screen to sleep'
    : 'Keep the screen awake'
  const tooltip = !isSupported
    ? 'Screen wake lock is not supported in this browser'
    : buttonLabel

  return (
    <div className="recipe-wake-lock">
      <button
        type="button"
        className={`recipe-wake-lock__button ${
          isActive ? 'recipe-wake-lock__button--active' : ''
        }`}
        onClick={handleClick}
        disabled={!isSupported}
        aria-label={tooltip}
        aria-pressed={isActive}
        title={tooltip}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="recipe-wake-lock__icon"
        >
          <path d="M12 3.5v2.1" />
          <path d="M12 18.4v2.1" />
          <path d="M3.5 12h2.1" />
          <path d="M18.4 12h2.1" />
          <path d="m5.95 5.95 1.49 1.49" />
          <path d="m16.56 16.56 1.49 1.49" />
          <path d="m18.05 5.95-1.49 1.49" />
          <path d="m7.44 16.56-1.49 1.49" />
          <circle cx="12" cy="12" r="3.7" />
        </svg>
      </button>
      <span className="sr-only" aria-live="polite">
        {isActive
          ? 'Screen wake lock is on.'
          : error ?? 'Screen wake lock is off.'}
      </span>
    </div>
  )
}

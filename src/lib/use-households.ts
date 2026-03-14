'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

export type HouseholdSummary = {
  id: string
  name: string
  createdAt?: string
}

const SELECTED_HOUSEHOLD_STORAGE_KEY = 'kaselSelectedHouseholdId'

const getStoredHouseholdId = () => {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(SELECTED_HOUSEHOLD_STORAGE_KEY)
}

const storeSelectedHouseholdId = (id: string | null) => {
  if (typeof window === 'undefined') return
  if (!id) {
    window.localStorage.removeItem(SELECTED_HOUSEHOLD_STORAGE_KEY)
    return
  }
  window.localStorage.setItem(SELECTED_HOUSEHOLD_STORAGE_KEY, id)
}

export function useHouseholds() {
  const [households, setHouseholds] = useState<HouseholdSummary[]>([])
  const [selectedHouseholdId, setSelectedHouseholdIdState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadHouseholds = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/households')
      const payload = (await response.json()) as {
        households?: HouseholdSummary[]
        error?: string
      }

      if (!response.ok) {
        throw new Error(payload.error ?? 'Unable to load households.')
      }

      const nextHouseholds = payload.households ?? []
      setHouseholds(nextHouseholds)

      const stored = getStoredHouseholdId()
      const hasStored = stored && nextHouseholds.some((household) => household.id === stored)
      const fallback = nextHouseholds[0]?.id ?? null
      const nextSelectedId = hasStored ? stored : fallback

      setSelectedHouseholdIdState(nextSelectedId)
      storeSelectedHouseholdId(nextSelectedId)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load households.')
      setHouseholds([])
      setSelectedHouseholdIdState(null)
      storeSelectedHouseholdId(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadHouseholds()
  }, [loadHouseholds])

  const setSelectedHouseholdId = useCallback((id: string | null) => {
    setSelectedHouseholdIdState(id)
    storeSelectedHouseholdId(id)
  }, [])

  const selectedHousehold = useMemo(
    () => households.find((household) => household.id === selectedHouseholdId) ?? null,
    [households, selectedHouseholdId]
  )

  return {
    households,
    selectedHousehold,
    selectedHouseholdId,
    setSelectedHouseholdId,
    isLoading,
    error,
    reload: loadHouseholds,
  }
}

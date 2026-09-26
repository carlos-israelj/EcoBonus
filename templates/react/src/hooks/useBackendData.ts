/**
 * useBackendData Hook
 * React hook for fetching data from EcoBonus backend
 */

import { useEffect, useState } from 'react'
import {
  getMissionsNearby,
  getVouchersCatalog,
  getLeaderboard,
  getHealth,
  type MissionsNearbyResponse,
  type VoucherCatalogResponse,
  type LeaderboardResponse,
  type HealthResponse,
} from '../eco/api'

interface UseBackendDataState<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Hook to fetch nearby missions based on GPS coordinates
 */
export function useNearbyMissions(
  lat: number | null,
  lon: number | null,
  radius: number = 1000,
  enabled: boolean = true
): UseBackendDataState<MissionsNearbyResponse> {
  const [data, setData] = useState<MissionsNearbyResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refetchTrigger, setRefetchTrigger] = useState(0)

  const refetch = () => setRefetchTrigger(prev => prev + 1)

  useEffect(() => {
    if (!enabled || lat === null || lon === null) {
      setData(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    getMissionsNearby(lat, lon, radius)
      .then(response => {
        setData(response)
        setError(null)
      })
      .catch(err => {
        console.error('[useNearbyMissions] Error:', err)
        setError(err instanceof Error ? err.message : 'Error al cargar misiones cercanas')
        setData(null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [lat, lon, radius, enabled, refetchTrigger])

  return { data, loading, error, refetch }
}

/**
 * Hook to fetch vouchers catalog
 */
export function useVouchersCatalog(
  enabled: boolean = true
): UseBackendDataState<VoucherCatalogResponse> {
  const [data, setData] = useState<VoucherCatalogResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refetchTrigger, setRefetchTrigger] = useState(0)

  const refetch = () => setRefetchTrigger(prev => prev + 1)

  useEffect(() => {
    if (!enabled) {
      setData(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    getVouchersCatalog()
      .then(response => {
        setData(response)
        setError(null)
      })
      .catch(err => {
        console.error('[useVouchersCatalog] Error:', err)
        setError(err instanceof Error ? err.message : 'Error al cargar catálogo de vouchers')
        setData(null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [enabled, refetchTrigger])

  return { data, loading, error, refetch }
}

/**
 * Hook to fetch leaderboard rankings
 */
export function useLeaderboard(
  period: 'weekly' | 'monthly' | 'all_time' = 'weekly',
  enabled: boolean = true
): UseBackendDataState<LeaderboardResponse> {
  const [data, setData] = useState<LeaderboardResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refetchTrigger, setRefetchTrigger] = useState(0)

  const refetch = () => setRefetchTrigger(prev => prev + 1)

  useEffect(() => {
    if (!enabled) {
      setData(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    getLeaderboard(period)
      .then(response => {
        setData(response)
        setError(null)
      })
      .catch(err => {
        console.error('[useLeaderboard] Error:', err)
        setError(err instanceof Error ? err.message : 'Error al cargar el ranking')
        setData(null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [period, enabled, refetchTrigger])

  return { data, loading, error, refetch }
}

/**
 * Hook to check backend health status
 */
export function useBackendHealth(
  enabled: boolean = true
): UseBackendDataState<HealthResponse> {
  const [data, setData] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refetchTrigger, setRefetchTrigger] = useState(0)

  const refetch = () => setRefetchTrigger(prev => prev + 1)

  useEffect(() => {
    if (!enabled) {
      setData(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    getHealth()
      .then(response => {
        setData(response)
        setError(null)
      })
      .catch(err => {
        console.error('[useBackendHealth] Error:', err)
        setError(err instanceof Error ? err.message : 'Error al verificar el backend')
        setData(null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [enabled, refetchTrigger])

  return { data, loading, error, refetch }
}

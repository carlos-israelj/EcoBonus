/**
 * EcoBonus API Client
 * Connects frontend to backend deployed at https://ecobonus-backend.onrender.com
 */

const API_BASE_URL = import.meta.env.PUBLIC_BACKEND_URL || 'https://ecobonus-backend.onrender.com'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

interface MissionNearby {
  mission_code: string
  title: string
  description: string
  latitude: number
  longitude: number
  radius_meters: number
  reward_points: number
  difficulty_level: string
  estimated_time_minutes: number
  distance_meters: number | null
}

interface MissionsNearbyResponse {
  success: boolean
  count: number
  missions: MissionNearby[]
  user_location: { lat: number; lon: number }
  search_radius: number
}

interface VoucherCatalogItem {
  id: string
  name: string
  description: string
  points_cost: number
  stock: number
  category: string
  sponsor: string
}

interface VoucherCatalogResponse {
  success: boolean
  vouchers: VoucherCatalogItem[]
}

interface LeaderboardEntry {
  rank: number
  user_id: string
  username: string
  total_points: number
  missions_completed: number
  impact_score: number
}

interface LeaderboardResponse {
  success: boolean
  period: 'weekly' | 'monthly' | 'all_time'
  leaderboard: LeaderboardEntry[]
  total_entries: number
  user_rank?: number
}

interface HealthResponse {
  success: boolean
  service: string
  version: string
  status: string
  features: {
    auth: string
    database: string
    points: string
    vouchers: string
    leaderboard: string
    validator: string
    trustlessWork: string
    gps: string
    photoValidation: string
  }
}

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }))
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`[API] Error fetching ${endpoint}:`, error)
    throw error
  }
}

/**
 * Get backend health status
 */
export async function getHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>('/api/health')
}

/**
 * Get nearby missions based on GPS coordinates
 */
export async function getMissionsNearby(
  lat: number,
  lon: number,
  radius: number = 1000
): Promise<MissionsNearbyResponse> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    radius: radius.toString(),
  })

  return apiFetch<MissionsNearbyResponse>(`/api/missions/nearby?${params}`)
}

/**
 * Get vouchers catalog
 */
export async function getVouchersCatalog(): Promise<VoucherCatalogResponse> {
  return apiFetch<VoucherCatalogResponse>('/api/vouchers/catalog')
}

/**
 * Get leaderboard rankings
 */
export async function getLeaderboard(period: 'weekly' | 'monthly' | 'all_time' = 'weekly'): Promise<LeaderboardResponse> {
  const params = new URLSearchParams({ period })
  return apiFetch<LeaderboardResponse>(`/api/leaderboard?${params}`)
}

/**
 * Redeem a voucher (requires authentication)
 */
export async function redeemVoucher(
  voucherId: string,
  userId: string,
  authToken: string
): Promise<ApiResponse<{ voucher_code: string; qr_code: string }>> {
  return apiFetch<ApiResponse<{ voucher_code: string; qr_code: string }>>(
    '/api/vouchers/redeem',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ voucher_id: voucherId, user_id: userId }),
    }
  )
}

/**
 * Upload before photo for a mission claim
 */
export async function uploadBeforePhoto(
  claimId: string,
  photoFile: File,
  authToken: string
): Promise<ApiResponse<{ photo_url: string; exif_gps: { lat: number; lon: number } | null }>> {
  const formData = new FormData()
  formData.append('photo', photoFile)

  const response = await fetch(`${API_BASE_URL}/api/claims/${claimId}/upload-before`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response.json()
}

/**
 * Upload after photo for a mission claim
 */
export async function uploadAfterPhoto(
  claimId: string,
  photoFile: File,
  authToken: string
): Promise<ApiResponse<{ photo_url: string; exif_gps: { lat: number; lon: number } | null }>> {
  const formData = new FormData()
  formData.append('photo', photoFile)

  const response = await fetch(`${API_BASE_URL}/api/claims/${claimId}/upload-after`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response.json()
}

/**
 * Validate both before and after photos
 */
export async function validatePhotos(
  claimId: string,
  authToken: string
): Promise<ApiResponse<{
  validation_score: number
  location_valid: boolean
  photos_different: boolean
  gps_data_present: boolean
  message: string
}>> {
  return apiFetch<ApiResponse<{
    validation_score: number
    location_valid: boolean
    photos_different: boolean
    gps_data_present: boolean
    message: string
  }>>(
    `/api/claims/${claimId}/validate-photos`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }
  )
}

/**
 * Test connection to backend
 */
export async function testConnection(): Promise<boolean> {
  try {
    const health = await getHealth()
    return health.success && health.status === 'healthy'
  } catch (error) {
    console.error('[API] Connection test failed:', error)
    return false
  }
}

// Export types for use in components
export type {
  MissionNearby,
  MissionsNearbyResponse,
  VoucherCatalogItem,
  VoucherCatalogResponse,
  LeaderboardEntry,
  LeaderboardResponse,
  HealthResponse,
}

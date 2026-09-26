/**
 * Adapters to convert backend API responses to frontend data types
 */

import type { Spot, Reward, Zone, Severity, Coordinates } from './types'
import type {
  MissionNearby,
  VoucherCatalogItem,
  LeaderboardEntry,
} from './api'

/**
 * Map difficulty level to zone
 */
function difficultyToZone(difficulty: string): Zone {
  const lowerDifficulty = difficulty.toLowerCase()
  if (lowerDifficulty.includes('park')) return 'Parques'
  if (lowerDifficulty.includes('beach') || lowerDifficulty.includes('coast')) return 'Playas'
  if (lowerDifficulty.includes('river')) return 'Ríos'
  return 'Calles'
}

/**
 * Map difficulty level to severity
 */
function difficultyToSeverity(difficulty: string, points: number): Severity {
  if (points >= 80) return 'high'
  if (points >= 40) return 'medium'
  return 'clean'
}

/**
 * Get placeholder image based on zone
 */
function getImageForZone(zone: Zone): string {
  const images: Record<Zone, string> = {
    'Parques': '/images/park.jpg',
    'Playas': '/images/beach.jpg',
    'Ríos': '/images/coast.jpg',
    'Calles': '/images/park.jpg',
  }
  return images[zone]
}

/**
 * Convert backend MissionNearby to frontend Spot
 */
export function missionToSpot(mission: MissionNearby): Spot {
  const zone = difficultyToZone(mission.difficulty_level)
  const severity = difficultyToSeverity(mission.difficulty_level, mission.reward_points)
  const coordinates: Coordinates = [mission.longitude, mission.latitude]

  return {
    id: mission.mission_code,
    name: mission.title,
    district: extractDistrict(mission.mission_code) || 'Lima',
    zone,
    coordinates,
    severity,
    points: mission.reward_points,
    minutes: mission.estimated_time_minutes,
    image: getImageForZone(zone),
    description: mission.description,
    validator: 'Backend Validator',
    updated: 'Ahora',
  }
}

/**
 * Extract district from mission code (e.g., "LM-MIR-0001" -> "Miraflores")
 */
function extractDistrict(missionCode: string): string | null {
  const districtMap: Record<string, string> = {
    'MIR': 'Miraflores',
    'BAR': 'Barranco',
    'SIS': 'San Isidro',
    'RIM': 'Rímac',
    'CER': 'Lima Cercado',
  }

  const match = missionCode.match(/LM-([A-Z]+)-/)
  if (match && match[1]) {
    return districtMap[match[1]] || null
  }

  return null
}

/**
 * Convert backend VoucherCatalogItem to frontend Reward
 */
export function voucherToReward(voucher: VoucherCatalogItem): Reward {
  const categoryMap: Record<string, 'Alimentos' | 'Experiencias' | 'Accesorios'> = {
    'food': 'Alimentos',
    'experience': 'Experiencias',
    'accessory': 'Accesorios',
  }

  const iconMap: Record<string, string> = {
    'food': 'Wheat',
    'experience': 'Coffee',
    'accessory': 'NotebookPen',
  }

  const colorMap: Record<string, string> = {
    'food': '#f4ecd7',
    'experience': '#ebdfd2',
    'accessory': '#e5e7f7',
  }

  const lowerCategory = voucher.category.toLowerCase()
  const category = categoryMap[lowerCategory] || 'Accesorios'
  const icon = iconMap[lowerCategory] || 'Gift'
  const color = colorMap[lowerCategory] || '#e5e7f7'

  return {
    id: voucher.id,
    title: voucher.name,
    description: voucher.description,
    cost: voucher.points_cost,
    stock: voucher.stock,
    category,
    icon,
    color,
    sponsor: voucher.sponsor || 'EcoBonus',
    location: 'Punto de entrega · Lima',
  }
}

/**
 * Convert backend LeaderboardEntry to a display-friendly format
 */
export function formatLeaderboardEntry(entry: LeaderboardEntry) {
  return {
    rank: entry.rank,
    userId: entry.user_id,
    username: entry.username || `Usuario ${entry.user_id.slice(0, 8)}`,
    points: entry.total_points,
    missions: entry.missions_completed,
    impact: entry.impact_score,
    displayRank: entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : `#${entry.rank}`,
  }
}

/**
 * Convert multiple missions to spots
 */
export function missionsToSpots(missions: MissionNearby[]): Spot[] {
  return missions.map(missionToSpot)
}

/**
 * Convert multiple vouchers to rewards
 */
export function vouchersToRewards(vouchers: VoucherCatalogItem[]): Reward[] {
  return vouchers.map(voucherToReward)
}

/**
 * Format distance for display
 */
export function formatBackendDistance(distanceMeters: number | null): string {
  if (distanceMeters === null) return 'Distancia desconocida'

  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters / 10) * 10} m`
  }

  return `${(distanceMeters / 1000).toFixed(1)} km`
}

/**
 * Sort spots by distance (backend already sorts, but this is a helper)
 */
export function sortSpotsByDistance(spots: Spot[], userLocation: Coordinates): Spot[] {
  return [...spots].sort((a, b) => {
    const distA = calculateDistance(userLocation, a.coordinates)
    const distB = calculateDistance(userLocation, b.coordinates)
    return distA - distB
  })
}

/**
 * Haversine distance calculation (same as backend)
 */
function calculateDistance(from: Coordinates, to: Coordinates): number {
  const rad = Math.PI / 180
  const [lon1, lat1] = from
  const [lon2, lat2] = to

  const p = Math.sin((lat2 - lat1) * rad / 2) ** 2 +
            Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
            Math.sin((lon2 - lon1) * rad / 2) ** 2

  return 6371000 * 2 * Math.atan2(Math.sqrt(p), Math.sqrt(1 - p))
}

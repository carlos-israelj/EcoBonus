export type Zone = 'Parques' | 'Playas' | 'Ríos' | 'Calles'
export type Severity = 'high' | 'medium' | 'clean'
export type Coordinates = [number, number]
export interface Spot {
  id: string; name: string; district: string; zone: Zone; coordinates: Coordinates;
  severity: Severity; points: number; minutes: number; image: string; description: string;
  validator: string; updated: string; hidden?: boolean
}
export interface Evidence {
  url: string; hash: string; timestamp: string; demo: boolean;
  coordinates: Coordinates; accuracy: number
}
export interface Mission {
  id: string; spotId: string; status: 'active' | 'pending' | 'approved' | 'rejected';
  startedAt: string; submittedAt?: string; reviewedAt?: string;
  before?: Evidence; after?: Evidence; bags: number; reason?: string; points: number
}
export interface Reward {
  id: string; title: string; description: string; cost: number; stock: number;
  category: 'Alimentos' | 'Experiencias' | 'Accesorios'; icon: string; color: string;
  sponsor: string; location: string; image?: string
}
export interface Voucher { id: string; rewardId: string; title: string; cost: number; createdAt: string; expiresAt: string; usedAt?: string }
export interface Report { id: string; name: string; district: string; zone: Zone; address: string; reference: string; coordinates: Coordinates; description: string; image: string; severity: 'high' | 'medium'; status: 'pending' | 'approved' | 'rejected'; reason?: string }
export interface Profile { name: string; email: string; district: string; university: string }

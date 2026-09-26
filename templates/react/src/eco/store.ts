import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { rewards, spots } from './data'
import type { Evidence, Mission, Profile, Report, Reward, Spot, Voucher } from './types'
import { submitClaim, mintCertificate } from './soroban'

interface State {
  profile: Profile; joined: boolean; points: number; xp: number; spots: Spot[];
  missions: Mission[]; rewards: Reward[]; vouchers: Voucher[]; reports: Report[];
  budget: number; theme: 'light' | 'dark' | 'system';
  walletAddress: string | null; blockchainEnabled: boolean;
  updateProfile: (profile: Profile) => void;
  setTheme: (theme: State['theme']) => void;
  setWalletAddress: (address: string | null) => void;
  setBlockchainEnabled: (enabled: boolean) => void;
  startMission: (spotId: string) => string;
  updateEvidence: (id: string, kind: 'before' | 'after', evidence: Evidence) => void;
  setBags: (id: string, bags: number) => void;
  submitMission: (id: string) => void;
  reviewMission: (id: string, approve: boolean, reason?: string, signTx?: (xdr: string) => Promise<string>) => Promise<void>;
  retryMission: (id: string) => void;
  cancelMission: (id: string) => void;
  redeem: (id: string, signTx?: (xdr: string) => Promise<string>) => Promise<string>;
  consumeVoucher: (id: string) => void;
  addReport: (report: Omit<Report, 'id' | 'status'>) => void;
  reviewReport: (id: string, approve: boolean, reason?: string) => void;
  addBudget: (amount: number) => void;
  updateStock: (id: string, stock: number) => void;
  toggleSpot: (id: string) => void;
  reset: () => void;
}
const initial = () => ({
  profile: { name: 'Alex', email: '', district: 'Miraflores', university: 'Comunidad EcoBonus' },
  joined: false, points: 320, xp: 320, spots: structuredClone(spots), missions: [] as Mission[],
  rewards: structuredClone(rewards), vouchers: [] as Voucher[], reports: [] as Report[], budget: 2500,
  theme: 'light' as State['theme'],
  walletAddress: null,
  blockchainEnabled: false,
})
const storage = {
  getItem: (name: string) => localStorage.getItem(name),
  setItem: (name: string, value: string) => {
    try { localStorage.setItem(name, value) }
    catch { window.dispatchEvent(new CustomEvent('eco-storage-error')) }
  },
  removeItem: (name: string) => localStorage.removeItem(name),
}
export const useEco = create<State>()(persist((set, get) => ({
  ...initial(),
  updateProfile: profile => set({ profile, joined: true }),
  setTheme: theme => set({ theme }),
  setWalletAddress: address => set({ walletAddress: address }),
  setBlockchainEnabled: enabled => set({ blockchainEnabled: enabled }),
  startMission: spotId => {
    const state = get()
    const existing = state.missions.find(m => m.status === 'active' || (m.spotId === spotId && m.status === 'pending'))
    if (existing) return existing.id
    const spot = state.spots.find(s => s.id === spotId)
    if (!spot || spot.severity === 'clean' || spot.hidden) throw new Error('Esta misión ya no está disponible.')
    const id = crypto.randomUUID()
    set({ missions: [{ id, spotId, points: spot.points, status: 'active', startedAt: new Date().toISOString(), bags: 1 }, ...state.missions] })
    return id
  },
  updateEvidence: (id, kind, evidence) => set(state => ({ missions: state.missions.map(m => m.id === id && m.status === 'active' ? { ...m, [kind]: evidence } : m) })),
  setBags: (id, bags) => set(state => ({ missions: state.missions.map(m => m.id === id && m.status === 'active' ? { ...m, bags: Math.max(1, Math.min(50, Math.round(bags))) } : m) })),
  submitMission: id => {
    const mission = get().missions.find(m => m.id === id)
    if (!mission || mission.status !== 'active' || !mission.before || !mission.after) throw new Error('Agrega las fotos antes y después para continuar.')
    if (mission.before.hash === mission.after.hash) throw new Error('Usa dos fotografías diferentes para mostrar tu impacto.')
    set(state => ({ missions: state.missions.map(m => m.id === id ? { ...m, status: 'pending', submittedAt: new Date().toISOString() } : m) }))
  },
  reviewMission: async (id, approve, reason, signTx) => {
    const state = get()
    const mission = state.missions.find(m => m.id === id)
    if (!mission || mission.status !== 'pending') throw new Error('La misión ya fue revisada.')
    if (!approve && !reason?.trim()) throw new Error('Indica el motivo para que el recolector pueda corregirlo.')

    // If blockchain is enabled and wallet connected, mint NFT certificate on-chain
    if (approve && state.blockchainEnabled && state.walletAddress && signTx) {
      try {
        const spot = state.spots.find(s => s.id === mission.spotId)
        if (spot) {
          const { tokenId, txHash } = await mintCertificate(
            state.walletAddress,
            state.walletAddress,
            parseInt(mission.spotId.replace(/\D/g, '') || '0'),
            parseInt(mission.id.replace(/\D/g, '') || '0'),
            {
              latitude: Math.round(spot.coordinates[1] * 1000000),
              longitude: Math.round(spot.coordinates[0] * 1000000),
              radius: 100,
            },
            mission.bags,
            'Mixed',
            mission.after?.hash || 'ipfs://demo',
            mission.bags * 2,
            signTx
          )
          console.log(`✅ NFT Certificate minted on-chain: Token #${tokenId}, TX: ${txHash}`)
        }
      } catch (error) {
        console.error('Failed to mint certificate on-chain:', error)
        // Continue with local approval even if blockchain fails
      }
    }

    set(state => ({
      missions: state.missions.map(m => m.id === id ? { ...m, status: approve ? 'approved' : 'rejected', reason, reviewedAt: new Date().toISOString() } : m),
      points: state.points + (approve ? mission.points : 0), xp: state.xp + (approve ? mission.points : 0),
      spots: state.spots.map(s => s.id === mission.spotId && approve ? { ...s, severity: 'clean', updated: 'Ahora', image: mission.after?.url ?? s.image } : s),
    }))
  },
  retryMission: id => {
    if (get().missions.some(m => m.status === 'active')) throw new Error('Termina o cancela tu misión activa antes de reintentar.')
    set(state => ({ missions: state.missions.map(m => m.id === id && m.status === 'rejected' ? { ...m, status: 'active', after: undefined, reason: undefined } : m) }))
  },
  cancelMission: id => set(state => ({ missions: state.missions.filter(m => m.id !== id || m.status !== 'active') })),
  redeem: async (id, signTx) => {
    const state = get(), reward = state.rewards.find(r => r.id === id)
    if (!reward || reward.stock < 1) throw new Error('Esta recompensa se agotó.')
    if (state.points < reward.cost) throw new Error('Aún no tienes suficientes puntos ECO.')

    // If blockchain is enabled and wallet connected, submit claim on-chain
    if (state.blockchainEnabled && state.walletAddress && signTx) {
      try {
        const adminAddress = 'GDUGXNI3GIFJSIHVML4DRUFXBWVVJR2PXUIHR4VB7XDT3J7ZPWZKU32W'
        const { claimId, txHash } = await submitClaim(
          state.walletAddress,
          adminAddress,
          parseInt(reward.id.replace(/\D/g, '') || '0'),
          BigInt(reward.cost * 10000000),
          `ipfs://voucher-${reward.id}`,
          signTx
        )
        console.log(`✅ Claim submitted on-chain: Claim #${claimId}, TX: ${txHash}`)
      } catch (error) {
        console.error('Failed to submit claim on-chain:', error)
        // Continue with local redemption even if blockchain fails
      }
    }

    const voucherId = `ECO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
    set({ points: state.points - reward.cost, rewards: state.rewards.map(r => r.id === id ? { ...r, stock: r.stock - 1 } : r), vouchers: [{ id: voucherId, rewardId: id, title: reward.title, cost: reward.cost, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 30 * 86400000).toISOString() }, ...state.vouchers] })
    return voucherId
  },
  consumeVoucher: id => {
    const voucher = get().vouchers.find(v => v.id === id)
    if (!voucher || voucher.usedAt || new Date(voucher.expiresAt).getTime() < Date.now()) throw new Error('Este voucher ya se usó o expiró.')
    set(state => ({ vouchers: state.vouchers.map(v => v.id === id ? { ...v, usedAt: new Date().toISOString() } : v) }))
  },
  addReport: report => set(state => ({ reports: [{ ...report, id: `REP-${crypto.randomUUID().slice(0, 8)}`, status: 'pending' }, ...state.reports] })),
  reviewReport: (id, approve, reason) => {
    const report = get().reports.find(r => r.id === id)
    if (!report || report.status !== 'pending') throw new Error('El reporte ya fue revisado.')
    if (!approve && !reason?.trim()) throw new Error('Indica un motivo de rechazo.')
    set(state => ({ reports: state.reports.map(r => r.id === id ? { ...r, status: approve ? 'approved' : 'rejected', reason } : r), spots: approve ? [...state.spots, { id: `LM-${report.id}`, name: report.name, district: report.district, zone: report.zone, coordinates: report.coordinates, severity: report.severity, points: report.severity === 'high' ? 80 : 40, minutes: 20, image: report.image, description: report.description, validator: 'Validador demo', updated: 'Ahora' }] : state.spots }))
  },
  addBudget: amount => { if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) throw new Error('Ingresa un monto entre 1 y 100 000.'); set(state => ({ budget: state.budget + amount })) },
  updateStock: (id, stock) => { if (!Number.isInteger(stock) || stock < 0 || stock > 10000) throw new Error('El stock debe estar entre 0 y 10 000.'); set(state => ({ rewards: state.rewards.map(r => r.id === id ? { ...r, stock } : r) })) },
  toggleSpot: id => set(state => ({ spots: state.spots.map(s => s.id === id ? { ...s, hidden: !s.hidden } : s) })),
  reset: () => set(initial()),
}), { name: 'ecobonus-demo-v2', version: 2, storage: createJSONStorage(() => storage) }))

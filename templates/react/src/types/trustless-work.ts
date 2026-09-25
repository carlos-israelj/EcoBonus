/**
 * Trustless Work TypeScript Types for EcoBonus
 *
 * These types define the structure of payloads and responses
 * for integrating with Trustless Work escrow system.
 */

// ============================================================================
// Escrow Roles
// ============================================================================

export interface EscrowRoles {
  /** Address that approves milestones (AI service in backend for EcoBonus) */
  approver: string
  /** Address of the mission completer (user) */
  serviceProvider: string
  /** Platform address (EcoBonus admin/treasury) */
  platformAddress: string
  /** Address that signs fund releases (admin/backend) */
  releaseSigner: string
  /** Address that resolves disputes (admin) */
  disputeResolver: string
}

// ============================================================================
// Milestone Types
// ============================================================================

export interface Milestone {
  /** Description of the milestone (e.g., "Complete beach cleanup mission") */
  description: string
  /** Amount in stroops (1 XLM = 10,000,000 stroops) */
  amount: string
  /** Address that receives funds when milestone is released */
  receiver: string
}

export type MilestoneStatus = "pending" | "submitted" | "approved" | "rejected" | "released"

// ============================================================================
// Trustline (Asset) Types
// ============================================================================

export interface Trustline {
  /** Asset code or "native" for XLM */
  address: string
  /** Asset symbol (e.g., "XLM", "USDC") */
  symbol: string
}

// ============================================================================
// Deploy Escrow Payload
// ============================================================================

export interface DeployEscrowPayload {
  /** Address signing the transaction (mission sponsor) */
  signer: string
  /** Unique identifier for the mission (engagementId) */
  engagementId: string
  /** Title of the escrow (mission title) */
  title: string
  /** Description of the escrow (optional) */
  description?: string
  /** All roles for the escrow */
  roles: EscrowRoles
  /** Platform fee percentage (0-100, typically 4 for Trustless Work) */
  platformFee: number
  /** Array of milestones */
  milestones: Milestone[]
  /** Asset to use for the escrow */
  trustline: Trustline
}

// ============================================================================
// Fund Escrow Payload
// ============================================================================

export interface FundEscrowPayload {
  /** Contract ID of the escrow */
  contractId: string
  /** Address signing the transaction (sponsor) */
  signer: string
  /** Amount to fund in stroops */
  amount: string
}

// ============================================================================
// Change Milestone Status Payload
// ============================================================================

export interface ChangeMilestoneStatusPayload {
  /** Contract ID of the escrow */
  contractId: string
  /** Index of the milestone (0-based, as string) */
  milestoneIndex: string
  /** New evidence URI (e.g., IPFS hash) */
  newEvidence: string
  /** New status */
  newStatus: "submitted" | "approved" | "rejected"
  /** Address of the service provider (user) */
  serviceProvider: string
}

// ============================================================================
// Approve Milestone Payload
// ============================================================================

export interface ApproveMilestonePayload {
  /** Contract ID of the escrow */
  contractId: string
  /** Index of the milestone (0-based, as string) */
  milestoneIndex: string
  /** Address of the approver (admin/backend) */
  approver: string
}

// ============================================================================
// Release Funds Payload
// ============================================================================

export interface ReleaseFundsPayload {
  /** Contract ID of the escrow */
  contractId: string
  /** Address signing the release (admin/backend) */
  releaseSigner: string
  /** Index of the milestone (0-based, as string) */
  milestoneIndex: string
}

// ============================================================================
// API Responses
// ============================================================================

export interface EscrowResponse {
  /** Unsigned XDR transaction to be signed by the user */
  unsignedTransaction: string
  /** Contract ID (for deploy operations) */
  contractId?: string
}

export interface EscrowData {
  /** Contract ID */
  contractId: string
  /** Engagement ID (mission ID) */
  engagementId: string
  /** Title */
  title: string
  /** Description */
  description?: string
  /** Roles */
  roles: EscrowRoles
  /** Platform fee percentage */
  platformFee: number
  /** Milestones with current status */
  milestones: Array<{
    description: string
    amount: string
    receiver: string
    status: MilestoneStatus
    evidence?: string
  }>
  /** Asset information */
  trustline: Trustline
  /** Current funded amount */
  fundedAmount: string
  /** Total released amount */
  releasedAmount: string
}

// ============================================================================
// EcoBonus-Specific Types
// ============================================================================

export interface Mission {
  id: string
  title: string
  description: string
  location: {
    latitude: number
    longitude: number
    radius: number
  }
  rewardAmount: string // in stroops
  sponsor: string
  escrowId?: string // Trustless Work contract ID
  status: "active" | "completed" | "expired"
  deadline?: number
  totalSlots: number
  claimedSlots: number
  category: "plastic" | "glass" | "paper" | "metal" | "organic" | "mixed"
}

export interface Claim {
  id: string
  missionId: string
  escrowId: string
  userId: string
  evidenceUri: string // IPFS hash
  status: "pending" | "validating" | "approved" | "rejected" | "rewarded"
  timestamp: number
  aiValidationScore?: number
  rejectionReason?: string
}

// ============================================================================
// Hook Return Types
// ============================================================================

export interface UseMissionEscrowReturn {
  /** Deploy escrow and create mission */
  createMission: (mission: Omit<Mission, "id" | "escrowId" | "claimedSlots">) => Promise<string>
  /** Fund an existing escrow */
  fundMission: (escrowId: string, amount: string) => Promise<void>
  /** Submit a claim (change milestone status) */
  submitClaim: (escrowId: string, evidenceUri: string, userAddress: string) => Promise<void>
  /** Get escrow data */
  getEscrow: (escrowId: string) => Promise<EscrowData | null>
  /** Loading states */
  isDeploying: boolean
  isFunding: boolean
  isSubmitting: boolean
  /** Errors */
  error: Error | null
}

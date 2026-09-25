/**
 * useMissionEscrowSimple Hook
 *
 * Simplified version using direct REST API calls to Trustless Work
 * instead of the React SDK to avoid type compatibility issues.
 */

import { useState, useCallback } from "react"
import { useWallet } from "./useWallet"
import type { Mission, EscrowData } from "../types/trustless-work"

const TRUSTLESS_WORK_API_URL = "https://dev.api.trustlesswork.com"
const TRUSTLESS_WORK_API_KEY = import.meta.env.PUBLIC_TRUSTLESS_WORK_API_KEY || ""
const BACKEND_URL = import.meta.env.PUBLIC_BACKEND_URL || "http://localhost:3001"
const ADMIN_ADDRESS = "GDEODUGRGDLD6HSIINDJ52YXBORIST5PYGEPC33CPFVVAA6G5WK6MAHN"

export interface UseMissionEscrowReturn {
	createMission: (mission: Omit<Mission, "id" | "escrowId" | "claimedSlots">) => Promise<string>
	fundMission: (escrowId: string, amount: string) => Promise<void>
	submitClaim: (escrowId: string, evidenceUri: string, userAddress: string) => Promise<void>
	getEscrow: (escrowId: string) => Promise<EscrowData | null>
	isDeploying: boolean
	isFunding: boolean
	isSubmitting: boolean
	error: Error | null
}

export const useMissionEscrowSimple = (): UseMissionEscrowReturn => {
	const { address, signTransaction } = useWallet()

	const [isDeploying, setIsDeploying] = useState(false)
	const [isFunding, setIsFunding] = useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [error, setError] = useState<Error | null>(null)

	/**
	 * Create a new mission by deploying a Trustless Work escrow
	 */
	const createMission = useCallback(
		async (mission: Omit<Mission, "id" | "escrowId" | "claimedSlots">): Promise<string> => {
			if (!address) {
				throw new Error("Wallet not connected")
			}

			setIsDeploying(true)
			setError(null)

			try {
				const engagementId = `mission-${Date.now()}`

				// Call Trustless Work REST API directly
				const payload = {
					signer: address,
					engagementId,
					title: mission.title,
					description: mission.description || `Complete mission: ${mission.title}`,
					roles: {
						approver: ADMIN_ADDRESS,
						serviceProvider: address,
						platformAddress: ADMIN_ADDRESS,
						releaseSigner: ADMIN_ADDRESS,
						disputeResolver: ADMIN_ADDRESS,
					},
					platformFee: 4,
					milestones: [
						{
							description: `Complete mission: ${mission.title}`,
							amount: Number(mission.rewardAmount),
							receiver: address,
						},
					],
					trustline: {
					asset: "native",
					},
				}

				const response = await fetch(`${TRUSTLESS_WORK_API_URL}/deployer/multi-release`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"x-api-key": TRUSTLESS_WORK_API_KEY,
					},
					body: JSON.stringify(payload),
				})

				if (!response.ok) {
					const errorData = await response.json() as any
					throw new Error(errorData.message || "Failed to deploy escrow")
				}

				const data = await response.json() as any
				const { unsignedTransaction } = data

				if (!unsignedTransaction) {
					throw new Error("No unsigned transaction returned from API")
				}

				// Sign with user's wallet
				const signedXdr = await signTransaction(unsignedTransaction)

				if (!signedXdr) {
					throw new Error("Failed to sign transaction")
				}

				// Submit transaction
				const submitResponse = await fetch(`${TRUSTLESS_WORK_API_URL}/helper/send-transaction`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"x-api-key": TRUSTLESS_WORK_API_KEY,
					},
					body: JSON.stringify({
						signedXdr: signedXdr,
					}),
				})

				if (!submitResponse.ok) {
					const errorData = await submitResponse.json() as any
					throw new Error(errorData.message || "Failed to submit transaction")
				}

				const submitData = await submitResponse.json() as any
				console.log("✅ Escrow deployed successfully:", engagementId)

				// Return the engagement ID as contract ID
				return engagementId
			} catch (err) {
				const error = err instanceof Error ? err : new Error("Failed to create mission")
				setError(error)
				console.error("❌ Error creating mission:", error)
				throw error
			} finally {
				setIsDeploying(false)
			}
		},
		[address, signTransaction],
	)

	/**
	 * Fund an existing mission escrow
	 */
	const fundMission = useCallback(
		async (escrowId: string, amount: string): Promise<void> => {
			if (!address) {
				throw new Error("Wallet not connected")
			}

			setIsFunding(true)
			setError(null)

			try {
				const payload = {
					contractId: escrowId,
					signer: address,
					amount,
				}

				const response = await fetch(
					`${TRUSTLESS_WORK_API_URL}/escrow/multi-release/fund-escrow`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							"x-api-key": TRUSTLESS_WORK_API_KEY,
						},
						body: JSON.stringify(payload),
					},
				)

				if (!response.ok) {
					const errorData = await response.json() as any
					throw new Error(errorData.message || "Failed to fund escrow")
				}

				const data = await response.json() as any
				const { unsignedTransaction } = data

				if (!unsignedTransaction) {
					throw new Error("No unsigned transaction returned from API")
				}

				const signedXdr = await signTransaction(unsignedTransaction)

				if (!signedXdr) {
					throw new Error("Failed to sign transaction")
				}

				const submitResponse = await fetch(`${TRUSTLESS_WORK_API_URL}/helper/send-transaction`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"x-api-key": TRUSTLESS_WORK_API_KEY,
					},
					body: JSON.stringify({
						signedXdr: signedXdr,
					}),
				})

				if (!submitResponse.ok) {
					const errorData = await submitResponse.json() as any
					throw new Error(errorData.message || "Failed to submit transaction")
				}

				console.log("✅ Escrow funded successfully:", escrowId)
			} catch (err) {
				const error = err instanceof Error ? err : new Error("Failed to fund mission")
				setError(error)
				console.error("❌ Error funding mission:", error)
				throw error
			} finally {
				setIsFunding(false)
			}
		},
		[address, signTransaction],
	)

	/**
	 * Submit a claim by changing milestone status
	 */
	const submitClaim = useCallback(
		async (escrowId: string, evidenceUri: string, userAddress: string): Promise<void> => {
			if (!address) {
				throw new Error("Wallet not connected")
			}

			setIsSubmitting(true)
			setError(null)

			try {
				const payload = {
					contractId: escrowId,
					milestoneIndex: "0",
					newEvidence: evidenceUri,
					newStatus: "submitted",
					serviceProvider: userAddress,
				}

				const response = await fetch(
					`${TRUSTLESS_WORK_API_URL}/escrow/multi-release/change-milestone-status`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							"x-api-key": TRUSTLESS_WORK_API_KEY,
						},
						body: JSON.stringify(payload),
					},
				)

				if (!response.ok) {
					const errorData = await response.json() as any
					throw new Error(errorData.message || "Failed to change milestone status")
				}

				const data = await response.json() as any
				const { unsignedTransaction } = data

				if (!unsignedTransaction) {
					throw new Error("No unsigned transaction returned from API")
				}

				const signedXdr = await signTransaction(unsignedTransaction)

				if (!signedXdr) {
					throw new Error("Failed to sign transaction")
				}

				const submitResponse = await fetch(`${TRUSTLESS_WORK_API_URL}/helper/send-transaction`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"x-api-key": TRUSTLESS_WORK_API_KEY,
					},
					body: JSON.stringify({
						signedXdr: signedXdr,
					}),
				})

				if (!submitResponse.ok) {
					const errorData = await submitResponse.json() as any
					throw new Error(errorData.message || "Failed to submit transaction")
				}

				console.log("✅ Claim submitted successfully:", escrowId)

				// Trigger backend AI validation webhook
				try {
					await fetch(`${BACKEND_URL}/api/validate-claim`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							escrowId,
							evidenceUri,
							userAddress,
						}),
					})
					console.log("✅ AI validation triggered")
				} catch (webhookError) {
					console.warn("⚠️ Failed to trigger AI validation webhook:", webhookError)
				}
			} catch (err) {
				const error = err instanceof Error ? err : new Error("Failed to submit claim")
				setError(error)
				console.error("❌ Error submitting claim:", error)
				throw error
			} finally {
				setIsSubmitting(false)
			}
		},
		[address, signTransaction],
	)

	/**
	 * Get escrow data from backend
	 */
	const getEscrow = useCallback(async (escrowId: string): Promise<EscrowData | null> => {
		try {
			const response = await fetch(`${BACKEND_URL}/api/escrow/${escrowId}`)
			if (!response.ok) {
				throw new Error("Failed to fetch escrow data")
			}
			const data = await response.json() as any
			return data.escrow as EscrowData
		} catch (err) {
			console.error("❌ Error fetching escrow:", err)
			return null
		}
	}, [])

	return {
		createMission,
		fundMission,
		submitClaim,
		getEscrow,
		isDeploying,
		isFunding,
		isSubmitting,
		error,
	}
}

/**
 * Trustless Work Integration Demo Page
 *
 * Demonstrates the complete mission workflow using Trustless Work escrow:
 * 1. Create mission (deploy escrow)
 * 2. Fund mission
 * 3. Submit claim
 * 4. AI validation + auto-approval + release
 */

import { useState } from "react"
import { useWallet } from "../hooks/useWallet"
import { useMissionEscrowSimple } from "../hooks/useMissionEscrowSimple"
import styles from "./TrustlessWorkDemo.module.css"

export default function TrustlessWorkDemo() {
	const { address } = useWallet()
	const isConnected = Boolean(address)

	const {
		createMission,
		fundMission,
		submitClaim,
		getEscrow,
		isDeploying,
		isFunding,
		isSubmitting,
		error,
	} = useMissionEscrowSimple()

	const [escrowId, setEscrowId] = useState("")
	const [evidenceUri, setEvidenceUri] = useState("")
	const [result, setResult] = useState<any>(null)
	const [loading, setLoading] = useState(false)

	const handleCreateMission = async () => {
		try {
			setLoading(true)
			setResult(null)

			const mission = {
				id: `test-${Date.now()}`,
				title: "Clean Parque Kennedy",
				description: "Clean up plastic waste in the park",
				location: {
					latitude: -12.118893,
					longitude: -77.029572,
					radius: 100, // 100 meters
				},
				rewardAmount: "10000000", // 1 XLM (7 decimals)
				sponsor: address || "",
				status: "active" as const,
				totalSlots: 10,
				category: "plastic" as const,
			}

			const contractId = await createMission(mission)
			setEscrowId(contractId)
			setResult({
				success: true,
				message: "Mission created successfully!",
				escrowId: contractId,
			})
		} catch (err: any) {
			setResult({
				success: false,
				message: err.message || "Failed to create mission",
			})
		} finally {
			setLoading(false)
		}
	}

	const handleFundMission = async () => {
		if (!escrowId) {
			setResult({ success: false, message: "Please create a mission first" })
			return
		}

		try {
			setLoading(true)
			setResult(null)

			await fundMission(escrowId, "10000000") // 1 XLM

			setResult({
				success: true,
				message: "Mission funded successfully!",
				amount: "1 XLM",
			})
		} catch (err: any) {
			setResult({
				success: false,
				message: err.message || "Failed to fund mission",
			})
		} finally {
			setLoading(false)
		}
	}

	const handleSubmitClaim = async () => {
		if (!escrowId) {
			setResult({ success: false, message: "Please create a mission first" })
			return
		}

		if (!evidenceUri) {
			setResult({ success: false, message: "Please provide evidence URI" })
			return
		}

		try {
			setLoading(true)
			setResult(null)

			await submitClaim(escrowId, evidenceUri, address || "")

			setResult({
				success: true,
				message: "Claim submitted! AI validation in progress...",
				note: "Check backend logs for validation results",
			})
		} catch (err: any) {
			setResult({
				success: false,
				message: err.message || "Failed to submit claim",
			})
		} finally {
			setLoading(false)
		}
	}

	const handleGetEscrow = async () => {
		if (!escrowId) {
			setResult({ success: false, message: "Please create a mission first" })
			return
		}

		try {
			setLoading(true)
			setResult(null)

			const escrowData = await getEscrow(escrowId)

			setResult({
				success: true,
				message: "Escrow data fetched",
				data: escrowData,
			})
		} catch (err: any) {
			setResult({
				success: false,
				message: err.message || "Failed to fetch escrow",
			})
		} finally {
			setLoading(false)
		}
	}

	if (!isConnected) {
		return (
			<div className={styles.container}>
				<h1>Trustless Work Integration Demo</h1>
				<p className={styles.warning}>Please connect your wallet to continue</p>
			</div>
		)
	}

	return (
		<div className={styles.container}>
			<h1>Trustless Work Integration Demo</h1>
			<p className={styles.subtitle}>
				Test the complete EcoBonus mission workflow with Trustless Work escrow
			</p>

			<div className={styles.info}>
				<strong>Connected Address:</strong> {address}
			</div>

			{escrowId && (
				<div className={styles.info}>
					<strong>Escrow ID:</strong> {escrowId}
				</div>
			)}

			<div className={styles.section}>
				<h2>Step 1: Create Mission (Deploy Escrow)</h2>
				<p>Deploy a new Trustless Work escrow for a test mission</p>
				<button
					onClick={handleCreateMission}
					disabled={isDeploying || loading}
					className={styles.button}
				>
					{isDeploying ? "Creating..." : "Create Mission"}
				</button>
			</div>

			<div className={styles.section}>
				<h2>Step 2: Fund Mission</h2>
				<p>Fund the escrow with 1 XLM</p>
				<button
					onClick={handleFundMission}
					disabled={isFunding || loading || !escrowId}
					className={styles.button}
				>
					{isFunding ? "Funding..." : "Fund Mission (1 XLM)"}
				</button>
			</div>

			<div className={styles.section}>
				<h2>Step 3: Submit Claim</h2>
				<p>Submit evidence (IPFS URI) to trigger AI validation</p>
				<input
					type="text"
					placeholder="Evidence URI (e.g., ipfs://Qm...)"
					value={evidenceUri}
					onChange={(e) => setEvidenceUri(e.target.value)}
					className={styles.input}
				/>
				<button
					onClick={handleSubmitClaim}
					disabled={isSubmitting || loading || !escrowId}
					className={styles.button}
				>
					{isSubmitting ? "Submitting..." : "Submit Claim"}
				</button>
			</div>

			<div className={styles.section}>
				<h2>Step 4: Check Escrow Status</h2>
				<p>Fetch current escrow data from backend</p>
				<button
					onClick={handleGetEscrow}
					disabled={loading || !escrowId}
					className={styles.button}
				>
					{loading ? "Fetching..." : "Get Escrow Data"}
				</button>
			</div>

			{error && (
				<div className={styles.error}>
					<strong>Error:</strong> {error.message}
				</div>
			)}

			{result && (
				<div className={result.success ? styles.success : styles.error}>
					<strong>{result.success ? "✅ Success" : "❌ Error"}:</strong>{" "}
					{result.message}
					{result.data && (
						<pre className={styles.data}>{JSON.stringify(result.data, null, 2)}</pre>
					)}
					{result.note && <p className={styles.note}>{result.note}</p>}
				</div>
			)}

			<div className={styles.info}>
				<h3>How It Works:</h3>
				<ol>
					<li>
						<strong>Create Mission</strong>: Deploys a Trustless Work escrow contract with
						mission details
					</li>
					<li>
						<strong>Fund Mission</strong>: Sponsor deposits XLM into the escrow
					</li>
					<li>
						<strong>Submit Claim</strong>: User submits evidence (photo), triggering AI
						validation in backend
					</li>
					<li>
						<strong>Auto-Approval</strong>: Backend validates with AI, then auto-approves
						and releases funds
					</li>
				</ol>
			</div>

			<div className={styles.info}>
				<h3>Backend Endpoints:</h3>
				<ul>
					<li>
						<code>POST /api/validate-claim</code> - Triggered by submitClaim hook
					</li>
					<li>
						<code>GET /api/escrow/:escrowId</code> - Fetch escrow data
					</li>
				</ul>
			</div>
		</div>
	)
}

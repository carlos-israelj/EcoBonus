/**
 * Soroban Smart Contracts Integration
 * Connects EcoBonus frontend to deployed Stellar testnet contracts
 */

import {
  Contract,
  rpc,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  xdr,
  Address,
  nativeToScVal,
  scValToNative,
} from '@stellar/stellar-sdk'

// Testnet configuration
const RPC_URL = 'https://soroban-testnet.stellar.org'
const NETWORK_PASSPHRASE = Networks.TESTNET

// Contract IDs deployed on testnet
export const CONTRACT_IDS = {
  MISSION: 'CBITQYMLPOOOHZ3EXYKQFKB7XMOOLXIWH5WKTU6DAKZAJ5WFR5SFKUZK',
  REWARD: 'CDCGUCOJX4MUXSBYNPARNORJUIP5ZNTZ6HZ3T2UZANLMCZC5OZSLFF4Y',
  CERTIFICATE: 'CBJP7PQSFR7QNNKL6M4BVIXHRSIBLTD37GQBYU3GPT7FKOPEFEHTEXXW',
}

// Initialize Soroban RPC server
const server = new rpc.Server(RPC_URL)

// Contract instances
export const contracts = {
  mission: new Contract(CONTRACT_IDS.MISSION),
  reward: new Contract(CONTRACT_IDS.REWARD),
  certificate: new Contract(CONTRACT_IDS.CERTIFICATE),
}

/**
 * Build and simulate a contract transaction
 */
async function buildTransaction(
  sourceAccount: string,
  contract: Contract,
  method: string,
  ...params: xdr.ScVal[]
) {
  const account = await server.getAccount(sourceAccount)

  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...params))
    .setTimeout(30)
    .build()

  const simulated = await server.simulateTransaction(transaction)

  if ('error' in simulated) {
    throw new Error(`Simulation failed: ${simulated.error}`)
  }

  const prepared = rpc.assembleTransaction(transaction, simulated)
  return prepared.build()
}

/**
 * Submit a signed transaction to the network
 */
async function submitTransaction(signedXDR: string) {
  const transaction = TransactionBuilder.fromXdr(signedXDR, NETWORK_PASSPHRASE)

  const response = await server.sendTransaction(transaction)

  if (response.status === 'PENDING') {
    let getResponse = await server.getTransaction(response.hash)

    // Poll for transaction result
    while (getResponse.status === 'NOT_FOUND') {
      await new Promise(resolve => setTimeout(resolve, 1000))
      getResponse = await server.getTransaction(response.hash)
    }

    if (getResponse.status === 'SUCCESS') {
      return {
        success: true,
        hash: response.hash,
        result: (getResponse as any).returnValue,
      }
    }
  }

  throw new Error(`Transaction failed: ${response.status}`)
}

/**
 * REWARD CONTRACT FUNCTIONS
 */

/**
 * Submit a claim to the reward contract
 */
export async function submitClaim(
  userAddress: string,
  sponsorAddress: string,
  missionId: number,
  amount: bigint,
  proofUri: string,
  signTransaction: (xdr: string) => Promise<string>
) {
  const params = [
    new Address(userAddress).toScVal(),
    new Address(sponsorAddress).toScVal(),
    nativeToScVal(missionId, { type: 'u64' }),
    nativeToScVal(amount, { type: 'i128' }),
    nativeToScVal(proofUri, { type: 'string' }),
  ]

  const tx = await buildTransaction(
    userAddress,
    contracts.reward,
    'submit_claim',
    ...params
  )

  const signedXDR = await signTransaction(tx.toXdr())
  const result = await submitTransaction(signedXDR)

  return {
    claimId: scValToNative(result.result!),
    txHash: result.hash,
  }
}

/**
 * Get claim information
 */
export async function getClaim(claimId: number) {
  const params = [nativeToScVal(claimId, { type: 'u64' })]

  // Read-only call, no signature needed
  const account = await server.getAccount(CONTRACT_IDS.REWARD)

  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contracts.reward.call('get_claim', ...params))
    .setTimeout(30)
    .build()

  const simulated = await server.simulateTransaction(transaction)

  if ('result' in simulated && simulated.result) {
    return scValToNative((simulated.result as any).retval)
  }

  throw new Error('Failed to get claim')
}

/**
 * CERTIFICATE NFT FUNCTIONS
 */

/**
 * Mint an environmental impact certificate NFT
 */
export async function mintCertificate(
  minterAddress: string,
  ownerAddress: string,
  missionId: number,
  claimId: number,
  location: { latitude: number; longitude: number; radius: number },
  weightKg: number,
  category: 'Plastic' | 'Organic' | 'Mixed',
  proofUri: string,
  carbonOffset: number,
  signTransaction: (xdr: string) => Promise<string>
) {
  const locationScVal = xdr.ScVal.scvMap([
    new xdr.ScMapEntry({
      key: nativeToScVal('latitude', { type: 'symbol' }),
      val: nativeToScVal(location.latitude, { type: 'i64' }),
    }),
    new xdr.ScMapEntry({
      key: nativeToScVal('longitude', { type: 'symbol' }),
      val: nativeToScVal(location.longitude, { type: 'i64' }),
    }),
    new xdr.ScMapEntry({
      key: nativeToScVal('radius', { type: 'symbol' }),
      val: nativeToScVal(location.radius, { type: 'u32' }),
    }),
  ])

  const params = [
    new Address(minterAddress).toScVal(),
    new Address(ownerAddress).toScVal(),
    nativeToScVal(missionId, { type: 'u64' }),
    nativeToScVal(claimId, { type: 'u64' }),
    locationScVal,
    nativeToScVal(weightKg, { type: 'u32' }),
    nativeToScVal(category, { type: 'symbol' }),
    nativeToScVal(proofUri, { type: 'string' }),
    nativeToScVal(carbonOffset, { type: 'u32' }),
  ]

  const tx = await buildTransaction(
    minterAddress,
    contracts.certificate,
    'mint_certificate',
    ...params
  )

  const signedXDR = await signTransaction(tx.toXdr())
  const result = await submitTransaction(signedXDR)

  return {
    tokenId: scValToNative(result.result!),
    txHash: result.hash,
  }
}

/**
 * Get certificate information
 */
export async function getCertificate(tokenId: number) {
  const params = [nativeToScVal(tokenId, { type: 'u64' })]

  const account = await server.getAccount(CONTRACT_IDS.CERTIFICATE)

  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contracts.certificate.call('get_certificate', ...params))
    .setTimeout(30)
    .build()

  const simulated = await server.simulateTransaction(transaction)

  if (rpc.Api.isSimulationSuccess(simulated) && simulated.result) {
    return scValToNative(simulated.result.retval)
  }

  throw new Error('Failed to get certificate')
}

/**
 * Get total number of minted certificates
 */
export async function getTotalMinted() {
  const account = await server.getAccount(CONTRACT_IDS.CERTIFICATE)

  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contracts.certificate.call('get_total_minted'))
    .setTimeout(30)
    .build()

  const simulated = await server.simulateTransaction(transaction)

  if ('result' in simulated && simulated.result) {
    return scValToNative((simulated.result as any).retval)
  }

  return 0
}

/**
 * Check if Soroban is available and contracts are accessible
 */
export async function checkSorobanHealth() {
  try {
    const health = await server.getHealth()
    const ledger = await server.getLatestLedger()

    return {
      healthy: health.status === 'healthy',
      ledger: ledger.sequence,
      network: 'testnet',
      contracts: CONTRACT_IDS,
    }
  } catch (error) {
    console.error('Soroban health check failed:', error)
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

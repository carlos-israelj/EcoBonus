/**
 * Frontend-Blockchain Integration Test
 *
 * This script verifies that the frontend code can successfully connect
 * to and query the deployed smart contracts on Stellar testnet.
 *
 * It uses the same Stellar SDK and contract addresses as the React app.
 */

import {
  Contract,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  nativeToScVal,
  scValToNative,
} from '@stellar/stellar-sdk'
import * as StellarSDK from '@stellar/stellar-sdk'

const { rpc } = StellarSDK

// Same configuration as frontend (templates/react/src/eco/soroban.ts)
const RPC_URL = 'https://soroban-testnet.stellar.org'
const NETWORK_PASSPHRASE = Networks.TESTNET

const CONTRACT_IDS = {
  REWARD: 'CAAJQSM7LZSCWGPX6K3VTS5RWU4BYZ4C2YMWOFHCC2WDI2JYWLFZZKQD',
  CERTIFICATE: 'CBJP7PQSFR7QNNKL6M4BVIXHRSIBLTD37GQBYU3GPT7FKOPEFEHTEXXW',
}

const server = new rpc.Server(RPC_URL)
const rewardContract = new Contract(CONTRACT_IDS.REWARD)
const certificateContract = new Contract(CONTRACT_IDS.CERTIFICATE)

// Test addresses from our E2E flow
const SPONSOR_ADDRESS = 'GDUGXNI3GIFJSIHVML4DRUFXBWVVJR2PXUIHR4VB7XDT3J7ZPWZKU32W'
const CLAIMER_ADDRESS = 'GCG3NFNARUVQCYTDWKGSVTPWTI2EHAJEGRE5XI5UM6QB2ZZS5STZTRRC'

console.log('🧪 Testing Frontend-Blockchain Integration\n')
console.log('Configuration:')
console.log(`  RPC URL: ${RPC_URL}`)
console.log(`  Network: ${NETWORK_PASSPHRASE}`)
console.log(`  Reward Contract: ${CONTRACT_IDS.REWARD}`)
console.log(`  Certificate Contract: ${CONTRACT_IDS.CERTIFICATE}\n`)

// Test 1: Query reward pool (same as frontend would do)
async function testGetPool() {
  console.log('Test 1: Query Reward Pool')
  console.log('  Method: get_pool(sponsor)')
  console.log(`  Sponsor: ${SPONSOR_ADDRESS}`)

  try {
    const account = await server.getAccount(SPONSOR_ADDRESS)

    const transaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        rewardContract.call(
          'get_pool',
          nativeToScVal(SPONSOR_ADDRESS, { type: 'address' })
        )
      )
      .setTimeout(30)
      .build()

    const simulated = await server.simulateTransaction(transaction)

    if ('result' in simulated && simulated.result) {
      const pool = scValToNative(simulated.result.retval)
      console.log('  ✅ Pool data retrieved:')
      console.log(`     Total funded: ${Number(pool.total_funded) / 10_000_000} XLM`)
      console.log(`     Available: ${Number(pool.available_balance) / 10_000_000} XLM`)
      console.log(`     Distributed: ${Number(pool.total_distributed) / 10_000_000} XLM`)
      console.log(`     Active: ${pool.is_active}`)
      return pool
    } else {
      console.log('  ❌ Failed to simulate transaction')
      console.log('  Error:', simulated)
      return null
    }
  } catch (error) {
    console.log('  ❌ Error:', error.message)
    return null
  }
}

// Test 2: Query claim data (verify our E2E claim exists)
async function testGetClaim() {
  console.log('\nTest 2: Query Claim #2 (from E2E flow)')
  console.log('  Method: get_claim(claim_id)')
  console.log('  Claim ID: 2')

  try {
    const account = await server.getAccount(SPONSOR_ADDRESS)

    const transaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        rewardContract.call('get_claim', nativeToScVal(2, { type: 'u64' }))
      )
      .setTimeout(30)
      .build()

    const simulated = await server.simulateTransaction(transaction)

    if ('result' in simulated && simulated.result) {
      const claim = scValToNative(simulated.result.retval)
      console.log('  ✅ Claim data retrieved:')
      console.log(`     Mission ID: ${claim.mission_id}`)
      console.log(`     Claimer: ${claim.claimer}`)
      console.log(`     Amount: ${Number(claim.amount) / 10_000_000} XLM`)
      console.log(`     Status: ${claim.status}`)
      console.log(`     Proof URI: ${claim.proof_uri}`)
      return claim
    } else {
      console.log('  ❌ Failed to simulate transaction')
      return null
    }
  } catch (error) {
    console.log('  ❌ Error:', error.message)
    return null
  }
}

// Test 3: Query NFT certificate (verify certificate #6 exists)
async function testGetCertificate() {
  console.log('\nTest 3: Query NFT Certificate #6 (from E2E flow)')
  console.log('  Method: get_certificate(token_id)')
  console.log('  Token ID: 6')

  try {
    const account = await server.getAccount(SPONSOR_ADDRESS)

    const transaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        certificateContract.call(
          'get_certificate',
          nativeToScVal(6, { type: 'u64' })
        )
      )
      .setTimeout(30)
      .build()

    const simulated = await server.simulateTransaction(transaction)

    if ('result' in simulated && simulated.result) {
      const certificate = scValToNative(simulated.result.retval)
      console.log('  ✅ Certificate data retrieved:')
      console.log(`     Token ID: ${certificate.token_id}`)
      console.log(`     Mission ID: ${certificate.mission_id}`)
      console.log(`     Claim ID: ${certificate.claim_id}`)
      console.log(`     Owner: ${certificate.owner}`)
      console.log(`     Location: (${Number(certificate.location.latitude) / 1_000_000}, ${Number(certificate.location.longitude) / 1_000_000})`)
      console.log(`     Waste: ${certificate.weight_kg} kg (${certificate.category})`)
      console.log(`     Carbon Offset: ${certificate.carbon_offset} CO₂`)
      console.log(`     Proof: ${certificate.proof_uri}`)
      return certificate
    } else {
      console.log('  ❌ Failed to simulate transaction')
      return null
    }
  } catch (error) {
    console.log('  ❌ Error:', error.message)
    return null
  }
}

// Run all tests
async function runTests() {
  const results = {
    pool: await testGetPool(),
    claim: await testGetClaim(),
    certificate: await testGetCertificate(),
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 Integration Test Summary')
  console.log('='.repeat(60))

  const poolOk = results.pool !== null && results.pool.is_active === true
  const claimOk = results.claim !== null && Number(results.claim.mission_id) === 42
  const certOk = results.certificate !== null && Number(results.certificate.token_id) === 6

  console.log(`Reward Pool Query:    ${poolOk ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`Claim #2 Query:       ${claimOk ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`Certificate #6 Query: ${certOk ? '✅ PASS' : '❌ FAIL'}`)

  const allPass = poolOk && claimOk && certOk

  console.log('\n' + (allPass ? '✅ All tests passed!' : '❌ Some tests failed'))
  console.log('\nConclusion:')
  if (allPass) {
    console.log('  The frontend code can successfully connect to and query')
    console.log('  the deployed smart contracts on Stellar testnet.')
    console.log('  The integration is functional and ready for use.')
  } else {
    console.log('  There are issues with the frontend-blockchain integration.')
    console.log('  Review the errors above for details.')
  }
  console.log('='.repeat(60))

  process.exit(allPass ? 0 : 1)
}

runTests().catch(error => {
  console.error('\n❌ Fatal error:', error)
  process.exit(1)
})

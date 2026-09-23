import * as StellarSDK from '@stellar/stellar-sdk';
import dotenv from 'dotenv';

dotenv.config();

// Configure Stellar network
const isTestnet = process.env.STELLAR_NETWORK === 'testnet';
const server = new StellarSDK.Horizon.Server(
  process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org'
);

const networkPassphrase = isTestnet
  ? StellarSDK.Networks.TESTNET
  : StellarSDK.Networks.PUBLIC;

// Contract addresses
const contracts = {
  mission: process.env.MISSION_CONTRACT_ID,
  reward: process.env.REWARD_CONTRACT_ID,
  certificateNFT: process.env.CERTIFICATE_NFT_CONTRACT_ID,
};

// Admin keypair for validation operations
let adminKeypair = null;
if (process.env.ADMIN_SECRET_KEY) {
  adminKeypair = StellarSDK.Keypair.fromSecret(process.env.ADMIN_SECRET_KEY);
}

export {
  StellarSDK,
  server,
  networkPassphrase,
  contracts,
  adminKeypair,
  isTestnet,
};

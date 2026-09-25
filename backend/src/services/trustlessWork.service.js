/**
 * Trustless Work Service
 *
 * Handles integration with Trustless Work REST API for:
 * - Approving milestones after AI validation
 * - Releasing funds to users
 * - Querying escrow status
 */

import axios from 'axios';
import * as StellarSdk from '@stellar/stellar-sdk';
import logger from '../config/logger.js';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.TRUSTLESS_WORK_API_URL || 'https://dev.api.trustlesswork.com';
const API_KEY = process.env.TRUSTLESS_WORK_API_KEY;
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY;
const ADMIN_PUBLIC_KEY = process.env.ADMIN_PUBLIC_KEY;
const NETWORK_PASSPHRASE = process.env.STELLAR_PASSPHRASE || 'Test SDF Network ; September 2015';

class TrustlessWorkService {
  constructor() {
    this.apiUrl = API_URL;
    this.apiKey = API_KEY;

    // Initialize Stellar SDK
    this.server = new StellarSdk.Horizon.Server(
      process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org'
    );

    logger.info('TrustlessWorkService initialized', {
      apiUrl: this.apiUrl,
      network: NETWORK_PASSPHRASE
    });
  }

  /**
   * Approve a milestone after AI validation
   */
  async approveMilestone(escrowId, milestoneIndex = '0') {
    try {
      logger.info('Approving milestone', { escrowId, milestoneIndex });

      const response = await axios.post(
        `${this.apiUrl}/escrow/multi-release/approve-milestone`,
        {
          contractId: escrowId,
          milestoneIndex,
          approver: ADMIN_PUBLIC_KEY
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey
          }
        }
      );

      const { unsignedTransaction } = response.data;

      if (!unsignedTransaction) {
        throw new Error('No unsigned transaction returned from API');
      }

      // Sign transaction with admin key
      const signedXdr = await this.signTransaction(unsignedTransaction);

      // Submit to blockchain
      const result = await this.submitTransaction(signedXdr);

      logger.info('✅ Milestone approved successfully', {
        escrowId,
        milestoneIndex,
        txHash: result.hash
      });

      return {
        success: true,
        transactionHash: result.hash,
        escrowId,
        milestoneIndex
      };
    } catch (error) {
      logger.error('❌ Error approving milestone:', {
        escrowId,
        error: error.message,
        response: error.response?.data
      });
      throw error;
    }
  }

  /**
   * Release funds for an approved milestone
   */
  async releaseFunds(escrowId, milestoneIndex = '0') {
    try {
      logger.info('Releasing funds', { escrowId, milestoneIndex });

      const response = await axios.post(
        `${this.apiUrl}/escrow/multi-release/release-milestone-funds`,
        {
          contractId: escrowId,
          releaseSigner: ADMIN_PUBLIC_KEY,
          milestoneIndex
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey
          }
        }
      );

      const { unsignedTransaction } = response.data;

      if (!unsignedTransaction) {
        throw new Error('No unsigned transaction returned from API');
      }

      // Sign transaction with admin key
      const signedXdr = await this.signTransaction(unsignedTransaction);

      // Submit to blockchain
      const result = await this.submitTransaction(signedXdr);

      logger.info('✅ Funds released successfully', {
        escrowId,
        milestoneIndex,
        txHash: result.hash
      });

      return {
        success: true,
        transactionHash: result.hash,
        escrowId,
        milestoneIndex
      };
    } catch (error) {
      logger.error('❌ Error releasing funds:', {
        escrowId,
        error: error.message,
        response: error.response?.data
      });
      throw error;
    }
  }

  /**
   * Get escrow data by contract IDs
   */
  async getEscrows(contractIds) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/escrow/get-escrows-by-contract-ids`,
        { contractIds },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Error fetching escrows:', {
        contractIds,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Sign a transaction with admin private key
   */
  async signTransaction(unsignedXdr) {
    if (!ADMIN_SECRET_KEY) {
      throw new Error('ADMIN_SECRET_KEY not configured');
    }

    try {
      // Create keypair from admin secret
      const adminKeypair = StellarSdk.Keypair.fromSecret(ADMIN_SECRET_KEY);

      // Build transaction from XDR
      const transaction = StellarSdk.TransactionBuilder.fromXDR(
        unsignedXdr,
        NETWORK_PASSPHRASE
      );

      // Sign transaction
      transaction.sign(adminKeypair);

      // Return signed XDR
      return transaction.toXDR();
    } catch (error) {
      logger.error('Error signing transaction:', error);
      throw new Error(`Failed to sign transaction: ${error.message}`);
    }
  }

  /**
   * Submit a signed transaction to Stellar network
   */
  async submitTransaction(signedXdr) {
    try {
      const transaction = StellarSdk.TransactionBuilder.fromXDR(
        signedXdr,
        NETWORK_PASSPHRASE
      );

      const result = await this.server.submitTransaction(transaction);

      logger.info('Transaction submitted successfully', {
        hash: result.hash,
        ledger: result.ledger
      });

      return result;
    } catch (error) {
      logger.error('Error submitting transaction:', {
        error: error.message,
        response: error.response?.data
      });
      throw new Error(`Failed to submit transaction: ${error.message}`);
    }
  }
}

export default new TrustlessWorkService();

import { StellarSDK, server, networkPassphrase, contracts, adminKeypair } from '../config/stellar.js';
import logger from '../config/logger.js';

class StellarService {
  /**
   * Get nearby missions from MissionContract
   */
  async getNearbyMissions(latitude, longitude, radius = 5000) {
    try {
      const contract = new StellarSDK.Contract(contracts.mission);

      // Call get_active_missions from smart contract
      const result = await server.getContractData(
        contracts.mission,
        StellarSDK.xdr.ScVal.scvSymbol('active_missions')
      );

      // Filter missions by distance
      const missions = this.decodeMissions(result);
      return this.filterByDistance(missions, latitude, longitude, radius);
    } catch (error) {
      logger.error('Error fetching nearby missions:', error);
      throw error;
    }
  }

  /**
   * Get mission by ID
   */
  async getMissionById(missionId) {
    try {
      const contract = new StellarSDK.Contract(contracts.mission);

      const account = await server.loadAccount(adminKeypair.publicKey());
      const builtTx = new StellarSDK.TransactionBuilder(account, {
        fee: StellarSDK.BASE_FEE,
        networkPassphrase,
      })
        .addOperation(
          contract.call(
            'get_mission',
            StellarSDK.nativeToScVal(missionId, { type: 'u64' })
          )
        )
        .setTimeout(30)
        .build();

      const result = await server.simulateTransaction(builtTx);
      return this.decodeMission(result.result);
    } catch (error) {
      logger.error(`Error fetching mission ${missionId}:`, error);
      throw error;
    }
  }

  /**
   * Submit claim to blockchain
   */
  async submitClaim(missionId, claimerAddress, proofUri) {
    try {
      const contract = new StellarSDK.Contract(contracts.mission);
      const claimerKeypair = StellarSDK.Keypair.fromPublicKey(claimerAddress);

      const account = await server.loadAccount(claimerKeypair.publicKey());

      const transaction = new StellarSDK.TransactionBuilder(account, {
        fee: StellarSDK.BASE_FEE,
        networkPassphrase,
      })
        .addOperation(
          contract.call(
            'claim_mission',
            StellarSDK.nativeToScVal(missionId, { type: 'u64' }),
            new StellarSDK.Address(claimerAddress).toScVal(),
            StellarSDK.nativeToScVal(proofUri, { type: 'string' })
          )
        )
        .setTimeout(30)
        .build();

      // Return unsigned transaction for client to sign
      return transaction.toXDR();
    } catch (error) {
      logger.error('Error submitting claim:', error);
      throw error;
    }
  }

  /**
   * Validate and approve claim
   */
  async validateClaim(claimId, approved) {
    try {
      if (!adminKeypair) {
        throw new Error('Admin keypair not configured');
      }

      const contract = new StellarSDK.Contract(contracts.reward);
      const account = await server.loadAccount(adminKeypair.publicKey());

      const transaction = new StellarSDK.TransactionBuilder(account, {
        fee: StellarSDK.BASE_FEE,
        networkPassphrase,
      })
        .addOperation(
          contract.call(
            'validate_claim',
            StellarSDK.nativeToScVal(claimId, { type: 'u64' }),
            new StellarSDK.Address(adminKeypair.publicKey()).toScVal(),
            StellarSDK.nativeToScVal(approved, { type: 'bool' })
          )
        )
        .setTimeout(30)
        .build();

      transaction.sign(adminKeypair);

      const response = await server.submitTransaction(transaction);
      logger.info(`Claim ${claimId} validated: ${approved}`, { txHash: response.hash });

      return response;
    } catch (error) {
      logger.error(`Error validating claim ${claimId}:`, error);
      throw error;
    }
  }

  /**
   * Get user claims
   */
  async getUserClaims(userAddress) {
    try {
      const contract = new StellarSDK.Contract(contracts.reward);

      const account = await server.loadAccount(adminKeypair.publicKey());
      const builtTx = new StellarSDK.TransactionBuilder(account, {
        fee: StellarSDK.BASE_FEE,
        networkPassphrase,
      })
        .addOperation(
          contract.call(
            'get_user_claims',
            new StellarSDK.Address(userAddress).toScVal()
          )
        )
        .setTimeout(30)
        .build();

      const result = await server.simulateTransaction(builtTx);
      return this.decodeClaims(result.result);
    } catch (error) {
      logger.error(`Error fetching claims for ${userAddress}:`, error);
      throw error;
    }
  }

  /**
   * Get user certificates (NFTs)
   */
  async getUserCertificates(userAddress) {
    try {
      const contract = new StellarSDK.Contract(contracts.certificateNFT);

      const account = await server.loadAccount(adminKeypair.publicKey());
      const builtTx = new StellarSDK.TransactionBuilder(account, {
        fee: StellarSDK.BASE_FEE,
        networkPassphrase,
      })
        .addOperation(
          contract.call(
            'get_user_certificates',
            new StellarSDK.Address(userAddress).toScVal()
          )
        )
        .setTimeout(30)
        .build();

      const result = await server.simulateTransaction(builtTx);
      return this.decodeTokenIds(result.result);
    } catch (error) {
      logger.error(`Error fetching certificates for ${userAddress}:`, error);
      throw error;
    }
  }

  /**
   * Get user impact statistics
   */
  async getUserImpact(userAddress) {
    try {
      const contract = new StellarSDK.Contract(contracts.certificateNFT);

      const account = await server.loadAccount(adminKeypair.publicKey());
      const builtTx = new StellarSDK.TransactionBuilder(account, {
        fee: StellarSDK.BASE_FEE,
        networkPassphrase,
      })
        .addOperation(
          contract.call(
            'get_user_impact',
            new StellarSDK.Address(userAddress).toScVal()
          )
        )
        .setTimeout(30)
        .build();

      const result = await server.simulateTransaction(builtTx);
      const [totalWeight, totalCarbon] = this.decodeTuple(result.result);

      return {
        totalWeightKg: totalWeight,
        totalCarbonOffsetG: totalCarbon,
      };
    } catch (error) {
      logger.error(`Error fetching impact for ${userAddress}:`, error);
      throw error;
    }
  }

  // Helper methods for decoding XDR data
  decodeMissions(xdr) {
    // Implementation depends on contract return format
    return [];
  }

  decodeMission(xdr) {
    // Decode mission struct from XDR
    return {};
  }

  decodeClaims(xdr) {
    return [];
  }

  decodeTokenIds(xdr) {
    return [];
  }

  decodeTuple(xdr) {
    return [0, 0];
  }

  /**
   * Calculate distance between two GPS coordinates (Haversine formula)
   */
  filterByDistance(missions, lat, lon, maxRadius) {
    return missions.filter(mission => {
      const distance = this.calculateDistance(
        lat, lon,
        mission.location.latitude / 1e6,
        mission.location.longitude / 1e6
      );
      return distance <= maxRadius;
    });
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}

export default new StellarService();

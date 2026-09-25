import { PrivyClient } from '@privy-io/server-auth';
import dotenv from 'dotenv';
import logger from './logger.js';

dotenv.config();

const privyAppId = process.env.PRIVY_APP_ID;
const privyAppSecret = process.env.PRIVY_APP_SECRET;

if (!privyAppId || !privyAppSecret) {
  logger.warn('Privy credentials not configured. Social login will be unavailable.');
}

// Initialize Privy client
const privyClient = new PrivyClient(privyAppId || '', privyAppSecret || '');

/**
 * Verify Privy access token
 * @param {string} token - JWT token from Privy
 * @returns {Promise<object>} - Verified user data
 */
export async function verifyPrivyToken(token) {
  try {
    const verifiedClaims = await privyClient.verifyAuthToken(token);

    logger.info('Privy token verified:', {
      userId: verifiedClaims.userId,
      appId: verifiedClaims.appId,
    });

    return {
      success: true,
      userId: verifiedClaims.userId,
      claims: verifiedClaims,
    };
  } catch (error) {
    logger.error('Privy token verification failed:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get user by Privy ID
 * @param {string} privyUserId - Privy user ID
 * @returns {Promise<object>} - User data from Privy
 */
export async function getPrivyUser(privyUserId) {
  try {
    const user = await privyClient.getUser(privyUserId);
    return {
      success: true,
      user,
    };
  } catch (error) {
    logger.error('Failed to get Privy user:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

export { privyClient };
export default privyClient;

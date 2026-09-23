import { StellarSDK } from '../config/stellar.js';
import logger from '../config/logger.js';

/**
 * Verify Stellar signature middleware
 * Expects header: X-Stellar-Signature
 * Format: signature of message (address:timestamp:nonce)
 */
export const verifyStellarSignature = async (req, res, next) => {
  try {
    const signature = req.headers['x-stellar-signature'];
    const publicKey = req.headers['x-stellar-publickey'];
    const timestamp = req.headers['x-stellar-timestamp'];
    const nonce = req.headers['x-stellar-nonce'];

    if (!signature || !publicKey || !timestamp || !nonce) {
      return res.status(401).json({
        error: 'Missing authentication headers',
      });
    }

    // Check timestamp (must be within 5 minutes)
    const now = Date.now();
    const requestTime = parseInt(timestamp);
    if (Math.abs(now - requestTime) > 5 * 60 * 1000) {
      return res.status(401).json({
        error: 'Request timestamp expired',
      });
    }

    // Verify signature
    const message = `${publicKey}:${timestamp}:${nonce}`;
    const keypair = StellarSDK.Keypair.fromPublicKey(publicKey);
    const signatureBuffer = Buffer.from(signature, 'base64');

    const isValid = keypair.verify(
      Buffer.from(message),
      signatureBuffer
    );

    if (!isValid) {
      return res.status(401).json({
        error: 'Invalid signature',
      });
    }

    // Attach verified address to request
    req.verifiedAddress = publicKey;
    next();
  } catch (error) {
    logger.error('Signature verification error:', error);
    res.status(401).json({
      error: 'Authentication failed',
      message: error.message,
    });
  }
};

/**
 * Admin verification middleware
 */
export const requireAdmin = (req, res, next) => {
  const adminKey = process.env.ADMIN_PUBLIC_KEY;

  if (!req.verifiedAddress || req.verifiedAddress !== adminKey) {
    return res.status(403).json({
      error: 'Admin access required',
    });
  }

  next();
};

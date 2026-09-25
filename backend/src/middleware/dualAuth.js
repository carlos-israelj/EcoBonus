import { verifyPrivyToken } from '../config/privy.js';
import { StellarSDK } from '../config/stellar.js';
import supabase from '../config/supabase.js';
import logger from '../config/logger.js';

/**
 * Dual authentication middleware
 * Supports both Privy JWT tokens (social login) and Stellar signatures (wallet)
 */
export const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const stellarSignature = req.headers['x-stellar-signature'];

    // Option 1: Privy JWT Token (Social Login)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      return await verifyPrivyJWT(req, res, next, token);
    }

    // Option 2: Stellar Signature (Direct Wallet)
    if (stellarSignature) {
      return await verifyStellarAuth(req, res, next);
    }

    // No authentication provided
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Provide either Bearer token (Privy) or X-Stellar-Signature header',
    });
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(500).json({
      error: 'Authentication failed',
      message: error.message,
    });
  }
};

/**
 * Verify Privy JWT token and load/create user
 */
async function verifyPrivyJWT(req, res, next, token) {
  try {
    // Verify token with Privy
    const verification = await verifyPrivyToken(token);

    if (!verification.success) {
      return res.status(401).json({
        error: 'Invalid Privy token',
        message: verification.error,
      });
    }

    const privyUserId = verification.userId;

    // Find or create user in Supabase
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('privy_user_id', privyUserId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = not found, which is ok
      logger.error('Supabase fetch error:', fetchError);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to fetch user',
      });
    }

    let user = existingUser;

    // Create user if doesn't exist
    if (!user) {
      // Extract email from Privy claims if available
      const email = verification.claims.email || null;

      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          privy_user_id: privyUserId,
          email: email,
          name: email ? email.split('@')[0] : `User_${privyUserId.slice(0, 8)}`,
        })
        .select()
        .single();

      if (createError) {
        logger.error('Failed to create user:', createError);
        return res.status(500).json({
          error: 'Database error',
          message: 'Failed to create user',
        });
      }

      user = newUser;
      logger.info('New user created via Privy:', { userId: user.id, privyUserId });
    }

    // Attach user to request
    req.user = user;
    req.userId = user.id;
    req.authMethod = 'privy';

    logger.info('Privy authentication successful:', {
      userId: user.id,
      privyUserId: user.privy_user_id,
    });

    next();
  } catch (error) {
    logger.error('Privy verification error:', error);
    return res.status(401).json({
      error: 'Authentication failed',
      message: error.message,
    });
  }
}

/**
 * Verify Stellar signature and load/create user
 */
async function verifyStellarAuth(req, res, next) {
  try {
    const signature = req.headers['x-stellar-signature'];
    const publicKey = req.headers['x-stellar-publickey'];
    const timestamp = req.headers['x-stellar-timestamp'];
    const nonce = req.headers['x-stellar-nonce'];

    if (!signature || !publicKey || !timestamp || !nonce) {
      return res.status(401).json({
        error: 'Missing Stellar authentication headers',
        required: ['X-Stellar-Signature', 'X-Stellar-PublicKey', 'X-Stellar-Timestamp', 'X-Stellar-Nonce'],
      });
    }

    // Check timestamp (must be within 5 minutes)
    const now = Date.now();
    const requestTime = parseInt(timestamp);
    if (Math.abs(now - requestTime) > 5 * 60 * 1000) {
      return res.status(401).json({
        error: 'Request timestamp expired',
        message: 'Timestamp must be within 5 minutes',
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
        error: 'Invalid Stellar signature',
      });
    }

    // Find or create user in Supabase
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('stellar_address', publicKey)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      logger.error('Supabase fetch error:', fetchError);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to fetch user',
      });
    }

    let user = existingUser;

    // Create user if doesn't exist
    if (!user) {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          stellar_address: publicKey,
          name: `Stellar_${publicKey.slice(0, 8)}`,
        })
        .select()
        .single();

      if (createError) {
        logger.error('Failed to create user:', createError);
        return res.status(500).json({
          error: 'Database error',
          message: 'Failed to create user',
        });
      }

      user = newUser;
      logger.info('New user created via Stellar wallet:', { userId: user.id, stellarAddress: publicKey });
    }

    // Attach user to request
    req.user = user;
    req.userId = user.id;
    req.stellarAddress = publicKey;
    req.authMethod = 'stellar';

    logger.info('Stellar authentication successful:', {
      userId: user.id,
      stellarAddress: publicKey,
    });

    next();
  } catch (error) {
    logger.error('Stellar signature verification error:', error);
    return res.status(401).json({
      error: 'Authentication failed',
      message: error.message,
    });
  }
}

/**
 * Admin verification middleware
 * Requires authentication first
 */
export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
      });
    }

    if (!req.user.is_admin) {
      return res.status(403).json({
        error: 'Admin access required',
        message: 'You do not have permission to access this resource',
      });
    }

    next();
  } catch (error) {
    logger.error('Admin verification error:', error);
    return res.status(500).json({
      error: 'Authorization failed',
      message: error.message,
    });
  }
};

/**
 * Validator verification middleware
 * Requires authentication first
 */
export const requireValidator = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
      });
    }

    if (!req.user.is_validator && !req.user.is_admin) {
      return res.status(403).json({
        error: 'Validator access required',
        message: 'You must be a validator to access this resource',
      });
    }

    next();
  } catch (error) {
    logger.error('Validator verification error:', error);
    return res.status(500).json({
      error: 'Authorization failed',
      message: error.message,
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user if authenticated, but doesn't require it
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const stellarSignature = req.headers['x-stellar-signature'];

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      return await verifyPrivyJWT(req, res, next, token);
    }

    if (stellarSignature) {
      return await verifyStellarAuth(req, res, next);
    }

    // No auth provided, but that's ok
    req.user = null;
    req.userId = null;
    next();
  } catch (error) {
    // If optional auth fails, just continue without user
    logger.warn('Optional auth failed:', error.message);
    req.user = null;
    req.userId = null;
    next();
  }
};

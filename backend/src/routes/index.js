import express from 'express';
import missionController from '../controllers/mission.controller.js';
import claimController from '../controllers/claim.controller.js';
import userController from '../controllers/user.controller.js';
import trustlessWorkController from '../controllers/trustlessWork.controller.js';
import pointsController from '../controllers/points.controller.js';
import voucherController from '../controllers/voucher.controller.js';
import validatorController from '../controllers/validator.controller.js';
import leaderboardController from '../controllers/leaderboard.controller.js';
import { authenticateUser, requireAdmin, requireValidator, optionalAuth } from '../middleware/dualAuth.js';

const router = express.Router();

// Mission routes
router.get('/missions/nearby', missionController.getNearbyMissions);
router.get('/missions/:id', missionController.getMissionById);
router.get('/missions/:id/claims', missionController.getMissionClaims);

// Claim routes
router.post('/claims', claimController.submitClaim);
router.get('/claims/:id', claimController.getClaimById);
router.post('/claims/:id/validate', claimController.validateClaim);

// User routes
router.get('/users/:address', userController.getUserProfile);
router.put('/users/:address', userController.updateUserProfile);
router.get('/users/:address/claims', claimController.getUserClaims);
router.get('/users/:address/certificates', userController.getUserCertificates);
router.get('/users/:address/impact', userController.getUserImpact);

// Trustless Work integration routes
router.post('/trustless-work/validate-claim', trustlessWorkController.validateClaim);
router.get('/trustless-work/escrow/:escrowId', trustlessWorkController.getEscrowData);
router.post('/trustless-work/approve-milestone', trustlessWorkController.approveMilestone);
router.post('/trustless-work/release-funds', trustlessWorkController.releaseFunds);

// Backward compatibility - redirect old validate endpoint
router.post('/validate-claim', trustlessWorkController.validateClaim);
router.get('/escrow/:escrowId', trustlessWorkController.getEscrowData);

// Points routes (authenticated)
router.get('/points/balance', authenticateUser, pointsController.getBalance);
router.get('/points/history', authenticateUser, pointsController.getHistory);
router.post('/points/admin/adjust', authenticateUser, requireAdmin, pointsController.adminAdjust);

// Voucher routes
router.get('/vouchers/catalog', voucherController.getCatalog); // Public
router.get('/vouchers/products/:productId', voucherController.getProduct); // Public
router.post('/vouchers/redeem', authenticateUser, voucherController.redeemVoucher);
router.get('/vouchers/my-vouchers', authenticateUser, voucherController.getMyVouchers);
router.get('/vouchers/verify/:qrCode', voucherController.verifyVoucher); // For stores
router.post('/vouchers/redeem-qr', voucherController.redeemQR); // For stores
router.post('/vouchers/cancel/:voucherId', authenticateUser, requireAdmin, voucherController.cancelVoucher);

// Validator routes (validator/admin only)
router.get('/validator/queue', authenticateUser, requireValidator, validatorController.getValidationQueue);
router.get('/validator/my-queue', authenticateUser, requireValidator, validatorController.getMyQueue);
router.post('/validator/assign/:claimId', authenticateUser, requireValidator, validatorController.assignClaim);
router.post('/validator/approve/:claimId', authenticateUser, requireValidator, validatorController.approveClaim);
router.post('/validator/reject/:claimId', authenticateUser, requireValidator, validatorController.rejectClaim);
router.get('/validator/stats', authenticateUser, requireValidator, validatorController.getValidatorStats);

// Leaderboard routes
router.get('/leaderboard', leaderboardController.getLeaderboard); // Public
router.get('/leaderboard/my-rank', authenticateUser, leaderboardController.getMyRank);
router.get('/leaderboard/surrounding', authenticateUser, leaderboardController.getSurroundingRanks);
router.post('/leaderboard/update', authenticateUser, requireAdmin, leaderboardController.updateLeaderboard);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'EcoBonus API',
    version: '2.0.0-supabase',
    status: 'healthy',
    features: {
      auth: 'dual (Privy + Stellar)',
      database: 'Supabase (rjeerpnshosuljapunyo)',
      points: 'enabled',
      vouchers: 'enabled',
      leaderboard: 'enabled',
      validator: 'enabled',
      trustlessWork: 'integrated',
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;

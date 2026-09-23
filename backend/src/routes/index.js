import express from 'express';
import missionController from '../controllers/mission.controller.js';
import claimController from '../controllers/claim.controller.js';
import userController from '../controllers/user.controller.js';

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

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'EcoBonus API',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;

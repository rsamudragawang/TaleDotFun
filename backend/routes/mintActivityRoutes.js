// readium-fun-master/backend/routes/mintActivityRoutes.js
const express = require('express');
const {
  recordMintActivity,
  getMintActivitiesByUserWallet,
  getMintActivitiesByCandyMachine,
  getMintActivityByNftMint,
  getAllMintActivities,
  getPublicMintActivities
} = require('../controllers/mintActivityController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Record a new mint activity (user must be logged in)
router.post('/', protect, recordMintActivity);

// Get mint activities
router.get('/by-user/:walletAddress', getMintActivitiesByUserWallet); // Can be public or protected
router.get('/by-cm/:candyMachineId', getMintActivitiesByCandyMachine);   // Public
router.get('/by-nft/:nftMintAddress', getMintActivityByNftMint);     // Public

// Get all mint activities (Admin only)
router.get('/', protect, authorize('admin'), getAllMintActivities);

// Get all public/ready mint activities (public)
router.get('/public', getPublicMintActivities);

module.exports = router;

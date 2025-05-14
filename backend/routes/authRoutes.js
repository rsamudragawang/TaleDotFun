// readium-fun-master/backend/routes/authRoutes.js
const express = require('express');
const {
  // simplifiedWalletLogin, // To be deprecated/removed
  verifySignature,
  completeProfileWithSignature,
  getMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// New SIWS (Sign-In With Solana) flow
router.post('/verify-signature', verifySignature);
router.post('/complete-profile-with-signature', completeProfileWithSignature);

// Get current user (requires token)
router.get('/me', protect, getMe);

// router.post('/simplified-wallet-login', simplifiedWalletLogin); // Deprecate this

module.exports = router;

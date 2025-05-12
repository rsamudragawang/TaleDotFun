// readium-fun/backend/routes/authRoutes.js
const express = require('express');
const { simplifiedWalletLogin, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/simplified-wallet-login', simplifiedWalletLogin);
router.get('/me', protect, getMe);

module.exports = router;
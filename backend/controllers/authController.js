// readium-fun/backend/controllers/authController.js
const User = require('../models/User');

// @desc    Login/Register with wallet address (NO BACKEND SIGNATURE VERIFICATION)
// @route   POST /api/auth/simplified-wallet-login
// @access  Public
exports.simplifiedWalletLogin = async (req, res, next) => {
  const { walletAddress, name, type } = req.body;

  if (!walletAddress) {
    return res.status(400).json({ success: false, message: 'Wallet address is required.' });
  }
  // if (!name) {
  //   return res.status(400).json({ success: false, message: 'Name is required for user profile.' });
  // }

  try {
    let user = await User.findOne({ walletAddress });

    if (!user) {
      user = await User.create({
        walletAddress,
        name: name,
        type: type || 'user',
        lastLoginAt: Date.now(),
      });
    } else {
      user.lastLoginAt = Date.now();
      if (name && user.name !== name) user.name = name;
      if (type && user.type !== type) user.type = type; // Consider type change restrictions
      await user.save();
    }

    sendTokenResponse(user, 200, res);

  } catch (error) {
    console.error('Simplified Wallet Login Error:', error.message);
    if (error.code === 11000) { // Duplicate key error
        return res.status(400).json({ success: false, message: 'Wallet address already exists or concurrent registration.' });
    }
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    next(error); // Pass to global error handler
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  // req.user is populated by the 'protect' middleware
  res.status(200).json({
    success: true,
    data: req.user,
  });
};

// Helper function to send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();
  const { _id, name, walletAddress, type, createdAt, updatedAt, lastLoginAt } = user;
  res
    .status(statusCode)
    .json({
      success: true,
      token,
      data: { id: _id, name, walletAddress, type, createdAt, updatedAt, lastLoginAt },
    });
};
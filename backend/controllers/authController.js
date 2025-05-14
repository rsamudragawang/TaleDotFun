// readium-fun-master/backend/controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const nacl = require('tweetnacl');
const { PublicKey } = require('@solana/web3.js'); // For robust public key validation/conversion
const { TextEncoder } = require('util'); // Node.js TextEncoder

// Helper to generate JWT
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined.');
    throw new Error('Server configuration error: JWT_SECRET missing.');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

// @desc    Verify a signed message from the user's wallet
// @route   POST /api/auth/verify-signature
// @access  Public
exports.verifySignature = async (req, res, next) => {
  const { walletAddress, message, signature } = req.body;

  if (!walletAddress || !message || !signature) {
    return res.status(400).json({ success: false, message: 'Missing walletAddress, message, or signature.' });
  }

  try {
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = Buffer.from(signature, 'base64');
    let publicKeyBytes;

    try {
      publicKeyBytes = new PublicKey(walletAddress).toBytes();
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Invalid wallet address format.' });
    }

    const isVerified = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);

    if (!isVerified) {
      return res.status(401).json({ success: false, message: 'Signature verification failed. Wallet ownership not proven.' });
    }

    // Signature is verified, check if user exists
    let user = await User.findOne({ walletAddress });

    if (user) {
      // User exists, log them in
      const token = generateToken(user._id);
      // Sanitize user object before sending
      const userResponse = { ...user.toObject() };
      delete userResponse.password; // If you ever add password field
      
      res.status(200).json({
        success: true,
        token,
        user: userResponse,
        needsProfile: false, // User already has a profile
      });
    } else {
      // User does not exist, signature verified, needs to complete profile
      res.status(200).json({
        success: true,
        needsProfile: true,
        message: 'Wallet ownership verified. Please complete your profile.',
        walletAddress: walletAddress // Send back for profile completion step
      });
    }
  } catch (error) {
    console.error('Error in verifySignature:', error);
    // Distinguish between verification logic errors and server errors
    if (error.message.includes('verification failed')) { // Example check
        return res.status(401).json({ success: false, message: error.message });
    }
    next(error); // Pass to global error handler for other errors
  }
};

// @desc    Complete user profile after signature verification (for new users)
// @route   POST /api/auth/complete-profile-with-signature
// @access  Public (but relies on a previously verified signature)
exports.completeProfileWithSignature = async (req, res, next) => {
  const { walletAddress, name, type, message, signature } = req.body;

  if (!walletAddress || !name || !message || !signature) {
    return res.status(400).json({ success: false, message: 'Missing required fields for profile completion.' });
  }

  try {
    // CRITICAL: Re-verify signature to ensure this request is tied to the initial verification
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = Buffer.from(signature, 'base64');
    let publicKeyBytes;
    try {
      publicKeyBytes = new PublicKey(walletAddress).toBytes();
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Invalid wallet address format during profile completion.' });
    }

    const isVerified = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);

    if (!isVerified) {
      return res.status(401).json({ success: false, message: 'Signature re-verification failed. Profile completion denied.' });
    }

    // Check if user already exists (should ideally not happen if needsProfile was true, but good to double check)
    let user = await User.findOne({ walletAddress });
    if (user) {
      // User was created between verify and complete steps, or logic error. Log them in.
      console.warn(`User ${walletAddress} found during completeProfile, though needsProfile was likely true.`);
      const token = generateToken(user._id);
      const userResponse = { ...user.toObject() };
      delete userResponse.password;
      return res.status(200).json({ success: true, token, user: userResponse });
    }

    // Create new user
    user = await User.create({
      walletAddress,
      name,
      type: type || 'user', // Default to 'user' if not provided
      // Other default fields if any
    });

    const token = generateToken(user._id);
    const userResponse = { ...user.toObject() };
    delete userResponse.password;

    res.status(201).json({
      success: true,
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error('Error in completeProfileWithSignature:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    if (error.code === 11000) { // Duplicate key error (e.g. if walletAddress must be unique)
        return res.status(409).json({ success: false, message: 'User with this wallet address already exists.'})
    }
    next(error);
  }
};


// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    // req.user is set by the 'protect' middleware
    const user = await User.findById(req.user.id).select('-password'); // Exclude password if it exists

    if (!user) {
      // This case should ideally not be reached if protect middleware works correctly
      // and user hasn't been deleted after token issuance.
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error in getMe:', error);
    next(error);
  }
};


/*
// @desc    Simplified Wallet Login / Registration (Old method - to be deprecated/removed)
// @route   POST /api/auth/simplified-wallet-login
// @access  Public
exports.simplifiedWalletLogin = async (req, res, next) => {
  const { walletAddress, name, type } = req.body;

  if (!walletAddress) {
    return res.status(400).json({ success: false, message: 'Please provide a wallet address' });
  }

  try {
    let user = await User.findOne({ walletAddress });

    if (user) {
      // User exists, log them in
      const token = generateToken(user._id);
      const userResponse = { ...user.toObject() };
      delete userResponse.password;
      res.status(200).json({ success: true, token, data: userResponse, known: true });
    } else {
      // User does not exist
      if (!name) {
        // If name is not provided for a new user, indicate they are unknown and need to register
        return res.status(200).json({ success: true, known: false, message: 'New wallet. Please provide a name to register.' });
      }
      // Create new user if name is provided
      user = await User.create({
        walletAddress,
        name,
        type: type || 'user', // Default to 'user'
      });
      const token = generateToken(user._id);
      const userResponse = { ...user.toObject() };
      delete userResponse.password;
      res.status(201).json({ success: true, token, data: userResponse, known: false });
    }
  } catch (error) {
    console.error('Error in simplifiedWalletLogin:', error);
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    next(error);
  }
};
*/

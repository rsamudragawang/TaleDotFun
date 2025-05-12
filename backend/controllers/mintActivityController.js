// readium-fun-master/backend/controllers/mintActivityController.js
const MintActivity = require('../models/MintActivity');
const User = require('../models/User');
const Episode = require('../models/Episode'); // To link episode if CM ID matches
const Tale = require('../models/Tale');     // To link tale if episode is linked

// @desc    Record a new mint activity
// @route   POST /api/mint-activities
// @access  Private (User must be logged in, action performed by them)
exports.recordMintActivity = async (req, res, next) => {
  try {
    const { candyMachineId, nftMintAddress, transactionSignature, episodeId } = req.body;

    if (!candyMachineId || !nftMintAddress || !transactionSignature) {
      return res.status(400).json({ success: false, message: 'Missing required fields: candyMachineId, nftMintAddress, transactionSignature' });
    }

    // req.user is populated by the 'protect' middleware
    if (!req.user || !req.user.id || !req.user.walletAddress) {
         return res.status(401).json({ success: false, message: 'User not authenticated properly.' });
    }

    // Check if this mint activity already exists for this NFT (should be unique)
    const existingActivity = await MintActivity.findOne({ nftMintAddress });
    if (existingActivity) {
        return res.status(409).json({ success: false, message: `Mint activity for NFT ${nftMintAddress} already recorded.` });
    }

    const mintActivityData = {
      user: req.user.id,
      userWalletAddress: req.user.walletAddress,
      candyMachineId,
      nftMintAddress,
      transactionSignature,
    };

    // Optional: Try to link to an Episode and Tale if episodeId is provided
    // or if the candyMachineId is directly stored on an Episode
    let foundEpisode = null;
    if (episodeId) {
        foundEpisode = await Episode.findById(episodeId);
    } else {
        // Attempt to find an episode that has this candyMachineId
        foundEpisode = await Episode.findOne({ candyMachineId: candyMachineId });
    }

    if (foundEpisode) {
        mintActivityData.episode = foundEpisode._id;
        if (foundEpisode.tale) { // If episode is linked to a tale
            mintActivityData.tale = foundEpisode.tale;
        }
    }

    const newMintActivity = await MintActivity.create(mintActivityData);

    res.status(201).json({
      success: true,
      data: newMintActivity,
    });
  } catch (error) {
    console.error('Error recording mint activity:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    if (error.code === 11000) { // Duplicate key error for nftMintAddress
        return res.status(409).json({ success: false, message: `An activity for NFT mint ${req.body.nftMintAddress} already exists.` });
    }
    next(error);
  }
};

// @desc    Get all mint activities for a specific user by their wallet address
// @route   GET /api/mint-activities/by-user/:walletAddress
// @access  Public (or Protected if you only want users to see their own)
exports.getMintActivitiesByUserWallet = async (req, res, next) => {
  try {
    const { walletAddress } = req.params;
    const activities = await MintActivity.find({ userWalletAddress: walletAddress })
      .populate('episode', 'episodeName') // Populate some basic info
      .populate('tale', 'title')
      .sort({ mintedAt: -1 });

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities,
    });
  } catch (error) {
    console.error('Error fetching mint activities by user wallet:', error);
    next(error);
  }
};

// @desc    Get all mint activities for a specific Candy Machine ID
// @route   GET /api/mint-activities/by-cm/:candyMachineId
// @access  Public
exports.getMintActivitiesByCandyMachine = async (req, res, next) => {
  try {
    const { candyMachineId } = req.params;
    const activities = await MintActivity.find({ candyMachineId: candyMachineId })
      .populate('user', 'name walletAddress type') // Populate user info
      .populate('episode', 'episodeName')
      .sort({ mintedAt: -1 });

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities,
    });
  } catch (error) {
    console.error('Error fetching mint activities by CM ID:', error);
    next(error);
  }
};

// @desc    Get a specific mint activity by the NFT Mint Address
// @route   GET /api/mint-activities/by-nft/:nftMintAddress
// @access  Public
exports.getMintActivityByNftMint = async (req, res, next) => {
  try {
    const { nftMintAddress } = req.params;
    const activity = await MintActivity.findOne({ nftMintAddress: nftMintAddress })
      .populate('user', 'name walletAddress type')
      .populate('episode', 'episodeName')
      .populate('tale', 'title');

    if (!activity) {
      return res.status(404).json({ success: false, message: `No mint activity found for NFT mint ${nftMintAddress}` });
    }

    res.status(200).json({
      success: true,
      data: activity,
    });
  } catch (error) {
    console.error('Error fetching mint activity by NFT mint:', error);
    next(error);
  }
};

// @desc    Get all mint activities (Admin only)
// @route   GET /api/mint-activities
// @access  Private/Admin
exports.getAllMintActivities = async (req, res, next) => {
    try {
        const activities = await MintActivity.find({})
            .populate('user', 'name walletAddress type')
            .populate('episode', 'episodeName')
            .populate('tale', 'title')
            .sort({ mintedAt: -1 });

        res.status(200).json({
            success: true,
            count: activities.length,
            data: activities,
        });
    } catch (error) {
        console.error('Error fetching all mint activities:', error);
        next(error);
    }
};

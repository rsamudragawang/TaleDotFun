// readium-fun/backend/controllers/episodeController.js
const Episode = require('../models/Episode');
const Tale = require('../models/Tale'); // To verify parent tale and ownership

// @desc    Create or Update a backend link for an on-chain episode.
//          Stores images and on-chain identifiers.
//          Client calls this AFTER successfully creating/updating the episode on-chain.
// @route   POST /api/episodes/sync-onchain-data
// @access  Private (Creator who owns the Tale)
exports.syncOnChainEpisodeWithBackend = async (req, res, next) => {
  try {
    const {
        // parentTaleMongoId, // Client will now send parentTaleOnChainPda to find parentTaleDoc
        images,
        // On-chain identifiers provided by the client:
        onChainEpisodeIdSeed,   // The seed used to create the episode PDA
        parentTaleOnChainPda, // On-chain PDA of the parent Tale - THIS IS NOW THE KEY IDENTIFIER FOR PARENT
        episodeOnChainPda,    // On-chain PDA of the episode itself
        // Optional snapshot data from on-chain, sent by client:
        episodeNameSnapshot,
        orderSnapshot,
        statusSnapshot,
        isNftSnapshot,
    } = req.body;

    // Validate required on-chain identifiers
    if (!onChainEpisodeIdSeed || !parentTaleOnChainPda || !episodeOnChainPda) {
      return res.status(400).json({ success: false, message: 'Missing required on-chain identifiers for syncing episode (onChainEpisodeIdSeed, parentTaleOnChainPda, episodeOnChainPda).' });
    }

    // Find the parent Tale document in MongoDB using its onChainPda
    // This assumes your Tale model has an 'onChainPda' field that is indexed.
    const parentTaleDoc = await Tale.findOne({ onChainPda: parentTaleOnChainPda });
    if (!parentTaleDoc) {
      return res.status(404).json({ success: false, message: `Parent Tale with on-chain PDA ${parentTaleOnChainPda} not found in backend. Ensure the tale is synced first.` });
    }

    // Authorization: Ensure the user performing this action is the author of the parent tale
    if (parentTaleDoc.author.toString() !== req.user.id || req.user.type !== 'creator') {
      return res.status(403).json({ success: false, message: 'User not authorized for this tale.' });
    }

    let episodeDoc = await Episode.findOne({ episodeOnChainPda });

    if (episodeDoc) { // Episode link already exists, update it
      episodeDoc.images = images !== undefined ? images : episodeDoc.images;
      if (episodeNameSnapshot !== undefined) episodeDoc.episodeNameSnapshot = episodeNameSnapshot;
      if (orderSnapshot !== undefined) episodeDoc.orderSnapshot = Number(orderSnapshot);
      if (statusSnapshot !== undefined) episodeDoc.statusSnapshot = Number(statusSnapshot);
      if (isNftSnapshot !== undefined) episodeDoc.isNftSnapshot = isNftSnapshot;
      
      // Ensure these key identifiers are consistent (though they shouldn't change for an existing link)
      episodeDoc.onChainEpisodeIdSeed = onChainEpisodeIdSeed; // Should match if found by episodeOnChainPda
      episodeDoc.parentTaleOnChainPda = parentTaleOnChainPda; // Should match
      // taleMongoId should already be set and correct if episodeDoc exists

    } else { // No existing link, create a new one
      episodeDoc = new Episode({
        taleMongoId: parentTaleDoc._id, // Use the _id from the fetched parentTaleDoc
        images: images || [],
        onChainEpisodeIdSeed,
        parentTaleOnChainPda,
        episodeOnChainPda,
        authorMongoId: req.user.id,
        authorWalletAddress: req.user.walletAddress,
        episodeNameSnapshot: episodeNameSnapshot || `Episode (Seed: ${onChainEpisodeIdSeed.substring(0,8)})`,
        orderSnapshot: orderSnapshot !== undefined ? Number(orderSnapshot) : 0,
        statusSnapshot: statusSnapshot !== undefined ? Number(statusSnapshot) : 0,
        isNftSnapshot: isNftSnapshot || false,
      });
    }

    const savedEpisodeDoc = await episodeDoc.save();

    res.status(200).json({ // Using 200 for both create/update via this sync endpoint
      success: true,
      message: "Episode data successfully synced with backend.",
      data: savedEpisodeDoc,
    });
  } catch (error) {
    console.error('Error syncing episode with backend:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    if (error.code === 11000) { // Duplicate key error
        // Check which unique index caused the error
        if (error.message.includes('episodeOnChainPda')) {
             return res.status(409).json({ success: false, message: `An episode link for on-chain PDA ${req.body.episodeOnChainPda} already exists.`});
        } else if (error.message.includes('parentTaleOnChainPda_1_onChainEpisodeIdSeed_1')) {
             return res.status(409).json({ success: false, message: `An episode with seed ${req.body.onChainEpisodeIdSeed} for parent tale PDA ${req.body.parentTaleOnChainPda} already exists.`});
        }
        return res.status(409).json({ success: false, message: 'Duplicate key error during episode sync.'});
    }
    next(error);
  }
};

// @desc    Get images for a specific on-chain episode (identified by its PDA)
// @route   GET /api/episodes/images/:episodeOnChainPda
// @access  Public
exports.getEpisodeImagesByPda = async (req, res, next) => {
  try {
    const episodeOnChainPda = req.params.episodeOnChainPda;
    const episodeDoc = await Episode.findOne({ episodeOnChainPda }).select('images');

    if (!episodeDoc) {
      // If no backend record, it means no images are linked yet. This is not an error.
      return res.status(200).json({ success: true, data: [] }); 
    }

    res.status(200).json({
      success: true,
      data: episodeDoc.images || [], // Ensure it always returns an array
    });
  } catch (error) {
    console.error(`Error getting images for episode PDA ${req.params.episodeOnChainPda}:`, error);
    next(error);
  }
};

// @desc    Delete the backend link (and images) for an on-chain episode.
//          Client should have already handled on-chain deletion.
// @route   DELETE /api/episodes/images/:episodeOnChainPda
// @access  Private (Author of the tale)
exports.deleteEpisodeImagesByPda = async (req, res, next) => {
  try {
    const episodeOnChainPda = req.params.episodeOnChainPda;
    const episodeDoc = await Episode.findOne({ episodeOnChainPda });

    if (!episodeDoc) {
      return res.status(404).json({ success: false, message: `Backend record for episode PDA ${episodeOnChainPda} not found.` });
    }

    // Fetch the parent tale using taleMongoId from the episodeDoc to check authorship.
    const parentTaleDoc = await Tale.findById(episodeDoc.taleMongoId).select('author');
    if (!parentTaleDoc) {
        return res.status(404).json({ success: false, message: `Parent tale for episode link not found. Cannot verify authorship.`});
    }

    // Authorization
    if (parentTaleDoc.author.toString() !== req.user.id || req.user.type !== 'creator') {
      return res.status(403).json({ success: false, message: 'User not authorized to delete this episode record.' });
    }

    await episodeDoc.deleteOne();

    res.status(200).json({
      success: true,
      message: "Backend episode record (and its image links) deleted.",
      data: {},
    });
  } catch (error) {
    console.error(`Error deleting backend images for episode PDA ${req.params.episodeOnChainPda}:`, error);
    next(error);
  }
};


// @desc    Get all backend episode records for a specific tale (identified by tale's MongoDB ID)
//          Returns images and on-chain identifiers. Client fetches full on-chain data.
// @route   GET /api/tales/:taleMongoId/episodes
// @access  Public
exports.getEpisodesForTale = async (req, res, next) => {
  try {
    const taleMongoId = req.params.taleMongoId; // This is the MongoDB _id of the parent Tale

    const episodes = await Episode.find({ taleMongoId: taleMongoId })
                                  .sort({ orderSnapshot: 1, createdAt: 1 }) // Sort by snapshot or creation time
                                  .select('_id images onChainEpisodeIdSeed parentTaleOnChainPda episodeOnChainPda episodeNameSnapshot orderSnapshot statusSnapshot isNftSnapshot');

    res.status(200).json({
      success: true,
      count: episodes.length,
      data: episodes,
    });
  } catch (error) {
    console.error('Error getting backend episode records for tale:', error);
    next(error);
  }
};

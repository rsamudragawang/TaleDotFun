// readium-fun/backend/controllers/episodeController.js
const Episode = require('../models/Episode');
const Tale = require('../models/Tale'); // To verify parent tale and ownership

// @desc    Create a new episode for a specific tale
// @route   POST /api/tales/:taleId/episodes
// @access  Private (Creator who owns the Tale)
exports.createEpisode = async (req, res, next) => {
  try {
    const taleId = req.params.taleId;
    const tale = await Tale.findById(taleId);

    if (!tale) {
      return res.status(404).json({ success: false, message: `Tale not found with id ${taleId}` });
    }

    // Authorization: Only the author of the tale (who must be a 'creator') can add episodes
    if (tale.author.toString() !== req.user.id || req.user.type !== 'creator') {
      return res.status(403).json({ success: false, message: 'User not authorized to add episodes to this tale' });
    }

    const { episodeName, content, images, isNft, candyMachineId, order, status } = req.body;

    if (!episodeName) {
        return res.status(400).json({ success: false, message: 'Episode name is required.' });
    }

    const episode = await Episode.create({
      episodeName,
      content,
      images,
      isNft,
      candyMachineId: isNft ? candyMachineId : undefined, // Only set CM ID if isNft is true
      order,
      status,
      tale: taleId,
      author: req.user.id, // Logged-in user (creator of the tale)
      authorWalletAddress: req.user.walletAddress,
    });

    res.status(201).json({
      success: true,
      data: episode,
    });
  } catch (error) {
    console.error('Error creating episode:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    next(error);
  }
};

// @desc    Get all episodes for a specific tale
// @route   GET /api/tales/:taleId/episodes
// @access  Public (or based on Tale's visibility)
exports.getEpisodesForTale = async (req, res, next) => {
  try {
    const taleId = req.params.taleId;
    const tale = await Tale.findById(taleId);

    if (!tale) {
      return res.status(404).json({ success: false, message: `Tale not found with id ${taleId}` });
    }

    // Optional: Check if tale is published before showing episodes to non-authors
    // if (tale.status !== 'published' && (!req.user || tale.author.toString() !== req.user.id)) {
    //   return res.status(403).json({ success: false, message: 'Cannot access episodes for this tale.' });
    // }

    let queryOptions = { tale: taleId };
    // If user is not the author, only show published episodes
    if (!req.user || req.user.id.toString() !== tale.author.toString()) {
        queryOptions.status = 'published';
    }


    const episodes = await Episode.find(queryOptions).sort({ order: 1, createdAt: 1 }); // Sort by order, then by creation

    res.status(200).json({
      success: true,
      count: episodes.length,
      data: episodes,
    });
  } catch (error) {
    console.error('Error getting episodes for tale:', error);
    next(error);
  }
};

// @desc    Get a single episode by its ID
// @route   GET /api/episodes/:episodeId  (Note: Changed route slightly for clarity)
// @access  Public
exports.getEpisodeById = async (req, res, next) => {
  try {
    const episode = await Episode.findById(req.params.episodeId).populate({
        path: 'tale',
        select: 'title author status' // Populate some parent tale info
    });

    if (!episode) {
      return res.status(404).json({ success: false, message: `Episode not found with id ${req.params.episodeId}` });
    }

    // Optional: Visibility check based on episode status or parent tale status
    // if (episode.status !== 'published' && (!req.user || episode.author.toString() !== req.user.id)) {
    //    return res.status(404).json({ success: false, message: `Episode not found or not published` });
    // }

    res.status(200).json({
      success: true,
      data: episode,
    });
  } catch (error) {
    console.error(`Error getting episode ${req.params.episodeId}:`, error);
    if (error.name === 'CastError') {
        return res.status(400).json({ success: false, message: 'Invalid Episode ID format.' });
    }
    next(error);
  }
};


// @desc    Update an episode
// @route   PUT /api/episodes/:episodeId
// @access  Private (Author of the tale)
exports.updateEpisode = async (req, res, next) => {
  try {
    let episode = await Episode.findById(req.params.episodeId);

    if (!episode) {
      return res.status(404).json({ success: false, message: `Episode not found with id ${req.params.episodeId}` });
    }

    // Authorization: User must be the author of this episode (which is derived from tale author)
    // and must be a 'creator'
    if (episode.author.toString() !== req.user.id || req.user.type !== 'creator') {
      return res.status(403).json({ success: false, message: 'User not authorized to update this episode' });
    }

    const { episodeName, content, images, isNft, candyMachineId, order, status } = req.body;
    const updateFields = { ...req.body }; // Start with all fields

    // Ensure candyMachineId is only set if isNft is true, or cleared if isNft becomes false
    if (typeof isNft === 'boolean') {
        updateFields.isNft = isNft;
        if (!isNft) {
            updateFields.candyMachineId = ''; // Clear CM ID if not an NFT
        } else if (candyMachineId !== undefined) { // Only update CM ID if provided and isNft is true
            updateFields.candyMachineId = candyMachineId;
        } else if (isNft && !episode.candyMachineId && !candyMachineId){
            // If isNft is true, but no CM ID is provided and none exists, clear it or handle as error
            // For now, let it pass, user might set it later.
        }
    } else if (episode.isNft && candyMachineId !== undefined) { // If isNft field isn't in body, but it's an NFT and CM ID is being updated
         updateFields.candyMachineId = candyMachineId;
    }


    // Prevent changing author or tale associations directly
    delete updateFields.author;
    delete updateFields.authorWalletAddress;
    delete updateFields.tale;


    episode = await Episode.findByIdAndUpdate(req.params.episodeId, updateFields, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: episode,
    });
  } catch (error) {
    console.error(`Error updating episode ${req.params.episodeId}:`, error);
    if (error.name === 'CastError') {
        return res.status(400).json({ success: false, message: 'Invalid Episode ID format.' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    next(error);
  }
};

// @desc    Delete an episode
// @route   DELETE /api/episodes/:episodeId
// @access  Private (Author of the tale)
exports.deleteEpisode = async (req, res, next) => {
  try {
    const episode = await Episode.findById(req.params.episodeId);

    if (!episode) {
      return res.status(404).json({ success: false, message: `Episode not found with id ${req.params.episodeId}` });
    }

    // Authorization: User must be the author of this episode
    if (episode.author.toString() !== req.user.id || req.user.type !== 'creator') {
      return res.status(403).json({ success: false, message: 'User not authorized to delete this episode' });
    }

    await episode.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    console.error(`Error deleting episode ${req.params.episodeId}:`, error);
    if (error.name === 'CastError') {
        return res.status(400).json({ success: false, message: 'Invalid Episode ID format.' });
    }
    next(error);
  }
};

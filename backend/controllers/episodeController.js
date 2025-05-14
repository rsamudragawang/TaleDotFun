// readium-fun-master/backend/controllers/episodeController.js
const Episode = require('../models/Episode');
const Tale = require('../models/Tale');
const MintActivity = require('../models/MintActivity'); // <-- IMPORT MintActivity model
const { protect } = require('../middleware/authMiddleware'); // For req.user

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

    if (tale.author.toString() !== req.user.id || req.user.type !== 'creator') {
      return res.status(403).json({ success: false, message: 'User not authorized to add episodes to this tale' });
    }

    const { episodeName, content, images, isNft, candyMachineId, order, status } = req.body;

    if (!episodeName) {
        return res.status(400).json({ success: false, message: 'Episode name is required.' });
    }
    if (images && !Array.isArray(images)) {
        return res.status(400).json({ success: false, message: 'Images must be an array of strings.' });
    }

    const episode = await Episode.create({
      episodeName,
      content: content || '',
      images: images || [],
      isNft: isNft || false,
      candyMachineId: (isNft && candyMachineId) ? candyMachineId : '',
      order: order === undefined ? 0 : Number(order),
      status: status || 'draft',
      tale: taleId,
      author: req.user.id,
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
    if (error.name === 'CastError' && error.path === '_id') {
        return res.status(400).json({ success: false, message: 'Invalid Tale ID format.' });
    }
    next(error);
  }
};

// @desc    Get all episodes for a specific tale
// @route   GET /api/tales/:taleId/episodes
// @access  Public (content within episodes might be gated)
exports.getEpisodesForTale = async (req, res, next) => {
  try {
    const taleId = req.params.taleId;
    const tale = await Tale.findById(taleId);

    if (!tale) {
      return res.status(404).json({ success: false, message: `Tale not found with id ${taleId}` });
    }

    let queryOptions = { tale: taleId };
    const isAuthorViewing = req.user && (req.user.id.toString() === tale.author.toString() || req.user.type === 'admin');

    if (!isAuthorViewing) {
        queryOptions.status = 'published'; // Non-authors only see published episodes
    }

    const episodes = await Episode.find(queryOptions).sort({ order: 1, createdAt: 1 }).lean(); // Use .lean() for plain JS objects

    // Process episodes for token-gated content
    const processedEpisodes = await Promise.all(episodes.map(async (episode) => {
      let displayImages = episode.images || [];
      let displayContent = episode.content; // By default, show content

      if (episode.isNft && episode.candyMachineId) {
        const isEpisodeAuthor = req.user && (req.user.id.toString() === episode.author.toString() || req.user.type === 'admin');
        console.log(req.user)
        
        if (!isEpisodeAuthor) { // If not the author, check mint status
          let hasMinted = false;
          if (req.user && req.user.walletAddress) {
            const mintRecord = await MintActivity.findOne({
              userWalletAddress: req.user.walletAddress,
              candyMachineId: episode.candyMachineId,
              // You might also want to check for a specific nftMintAddress if the CM can mint multiple different NFTs for an episode
            });
            if (mintRecord) {
              hasMinted = true;
            }
          }

          if (!hasMinted) {
            // User has not minted this NFT episode
            displayImages = (episode.images && episode.images.length > 0) ? [episode.images[0]] : []; // Show only first image as teaser
            // displayContent = "Full content available after minting this NFT episode."; // Or a snippet, or nothing
            // For now, we'll still show content, but limit images. You can adjust content visibility here too.
          }
        }
        // If isEpisodeAuthor, they see everything by default (displayImages and displayContent remain as fetched)
      }

      return {
        ...episode,
        images: displayImages, // Return potentially modified image list
        content: displayContent, // Return potentially modified content
      };
    }));

    res.status(200).json({
      success: true,
      count: processedEpisodes.length,
      data: processedEpisodes,
    });
  } catch (error) {
    console.error('Error getting episodes for tale:', error);
     if (error.name === 'CastError' && error.path === '_id') {
        return res.status(400).json({ success: false, message: 'Invalid Tale ID format.' });
    }
    next(error);
  }
};

// @desc    Get a single episode by its ID
// @route   GET /api/episodes/:episodeId
// @access  Public (content within episode might be gated)
exports.getEpisodeById = async (req, res, next) => {
  try {
    const episode = await Episode.findById(req.params.episodeId)
        .populate({ path: 'tale', select: 'title author status authorWalletAddress' })
        .lean();

    if (!episode) {
      return res.status(404).json({ success: false, message: `Episode not found with id ${req.params.episodeId}` });
    }

    const parentTale = episode.tale; // Tale is already populated
    let displayImages = episode.images || [];
    let displayContent = episode.content;

    // Authorization for draft episodes or draft tales
    const isAuthorViewing = req.user && (
        (parentTale && req.user.id.toString() === parentTale.author.toString()) ||
        req.user.id.toString() === episode.author.toString() ||
        req.user.type === 'admin'
    );

    if (episode.status === 'draft' && !isAuthorViewing) {
        return res.status(403).json({ success: false, message: 'You are not authorized to view this draft episode.' });
    }
    if (parentTale && parentTale.status === 'draft' && !isAuthorViewing) {
        return res.status(403).json({ success: false, message: 'This episode belongs to a draft tale and is not publicly viewable.' });
    }


    if (episode.isNft && episode.candyMachineId) {
        if (!isAuthorViewing) { // If not the author, check mint status
            let hasMinted = false;
            if (req.user && req.user.walletAddress) {
                const mintRecord = await MintActivity.findOne({
                    userWalletAddress: req.user.walletAddress,
                    candyMachineId: episode.candyMachineId,
                });
                if (mintRecord) {
                    hasMinted = true;
                }
            }
            if (!hasMinted) {
                displayImages = (episode.images && episode.images.length > 0) ? [episode.images[0]] : [];
                // displayContent = "Full content available after minting this NFT episode."; // Or keep content visible
            }
        }
    }
    
    const processedEpisode = {
        ...episode,
        images: displayImages,
        content: displayContent,
    };

    res.status(200).json({
      success: true,
      data: processedEpisode,
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

    if (episode.author.toString() !== req.user.id || req.user.type !== 'creator') {
      return res.status(403).json({ success: false, message: 'User not authorized to update this episode' });
    }

    const { episodeName, content, images, isNft, candyMachineId, order, status } = req.body;
    const updateFields = {};

    if (episodeName !== undefined) updateFields.episodeName = episodeName;
    if (content !== undefined) updateFields.content = content;
    if (images !== undefined) updateFields.images = Array.isArray(images) ? images : [];
    if (order !== undefined) updateFields.order = Number(order);
    if (status !== undefined) updateFields.status = status;
    if (isNft !== undefined) updateFields.isNft = isNft;

    if (isNft === true && candyMachineId !== undefined) {
        updateFields.candyMachineId = candyMachineId;
    } else if (isNft === false) {
        updateFields.candyMachineId = '';
    } else if (isNft === undefined && episode.isNft && candyMachineId !== undefined) {
        updateFields.candyMachineId = candyMachineId;
    }

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

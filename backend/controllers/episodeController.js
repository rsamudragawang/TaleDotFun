// readium-fun/backend/controllers/episodeController.js
const EpisodeImageSet = require('../models/EpisodeImageSet');
// Tale and User models might be used by authMiddleware but not directly here for basic image set ops

// @desc    Create an episode's image set.
//          Returns the MongoDB _id of this image set (imageSetId).
// @route   POST /api/episodes/image-set
// @access  Private (Authenticated User, e.g., Creator)
exports.createImageSet = async (req, res, next) => {
  try {
    const { images } = req.body;

    if (!images || !Array.isArray(images)) {
        return res.status(400).json({ success: false, message: 'Images array is required.' });
    }

    // The author is implied by req.user from the 'protect' middleware.
    // We are not storing authorWalletAddress directly on this ultra-lean model.
    const imageSetDoc = new EpisodeImageSet({
        images,
        // authorWalletAddress: req.user.walletAddress, // Not storing as per user's strict request
    });

    const savedImageSet = await imageSetDoc.save();

    res.status(201).json({
      success: true,
      message: "Image set created successfully.",
      imageSetId: savedImageSet._id, // This ID is crucial for the client to store on-chain
      data: { // Return only what's essential
        _id: savedImageSet._id,
        images: savedImageSet.images
      }
    });

  } catch (error) {
    console.error('Error creating image set:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    next(error);
  }
};

// @desc    Update an existing episode's image set.
// @route   PUT /api/episodes/image-set/:imageSetId
// @access  Private (Authenticated User - further auth should be handled by client based on on-chain ownership)
exports.updateImageSet = async (req, res, next) => {
  try {
    const { imageSetId } = req.params;
    const { images } = req.body;

    if (!images || !Array.isArray(images)) {
      return res.status(400).json({ success: false, message: 'Images array is required for update.' });
    }

    let imageSetDoc = await EpisodeImageSet.findById(imageSetId);

    if (!imageSetDoc) {
      return res.status(404).json({ success: false, message: `Image set with ID ${imageSetId} not found.` });
    }

    // Authorization:
    // In this ultra-lean model, we don't store authorWalletAddress on the EpisodeImageSet.
    // The 'protect' middleware ensures a user is logged in.
    // The client should have already verified that the logged-in user is the author
    // of the on-chain episode that references this imageSetId before calling this endpoint.
    // If stricter backend auth is needed here, the client would need to pass the
    // on-chain episode's PDA or author, and the backend would verify against req.user.walletAddress.

    imageSetDoc.images = images;
    const savedImageSet = await imageSetDoc.save();

    res.status(200).json({
      success: true,
      message: "Image set updated successfully.",
      imageSetId: savedImageSet._id,
      data: {
        _id: savedImageSet._id,
        images: savedImageSet.images
      }
    });

  } catch (error) {
    console.error('Error updating image set:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    if (error.name === 'CastError') return res.status(400).json({ success: false, message: 'Invalid Image Set ID format.' });
    next(error);
  }
};


// @desc    Get an episode's image set by its MongoDB _id
// @route   GET /api/episodes/image-set/:imageSetId
// @access  Public
exports.getImageSetById = async (req, res, next) => {
  try {
    const imageSetId = req.params.imageSetId;
    const imageSetDoc = await EpisodeImageSet.findById(imageSetId).select('images');

    if (!imageSetDoc) {
      return res.status(404).json({ success: false, message: `Image set not found with ID ${imageSetId}` });
    }
    res.status(200).json({
      success: true,
      data: imageSetDoc.images || [],
    });
  } catch (error) {
    console.error(`Error getting image set by ID ${req.params.imageSetId}:`, error);
    if (error.name === 'CastError') return res.status(400).json({ success: false, message: 'Invalid Image Set ID format.' });
    next(error);
  }
};

// @desc    Delete an episode's image set by its MongoDB _id.
//          Called by client after corresponding on-chain episode is deleted.
// @route   DELETE /api/episodes/image-set/:imageSetId
// @access  Private (Authenticated User - client should ensure this user was the on-chain episode author)
exports.deleteImageSet = async (req, res, next) => {
    try {
        const imageSetId = req.params.imageSetId;
        const imageSetDoc = await EpisodeImageSet.findById(imageSetId);

        if (!imageSetDoc) {
            return res.status(404).json({ success: false, message: `Image set with ID ${imageSetId} not found.` });
        }

        // Authorization: Similar to update, relies on client-side pre-authorization based on on-chain data.
        // The 'protect' middleware ensures a user is logged in.
        // For stricter backend auth, client would pass on-chain episode author/PDA for verification.

        await imageSetDoc.deleteOne();
        res.status(200).json({ success: true, message: 'Image set deleted successfully.' });
    } catch (error) {
        console.error(`Error deleting image set ${req.params.imageSetId}:`, error);
        if (error.name === 'CastError') return res.status(400).json({ success: false, message: 'Invalid Image Set ID format.' });
        next(error);
    }
};

// The getImageSetsForParentTale is removed as it relied on taleMongoId in EpisodeImageSet model,
// which is not present in this ultra-lean version. If you need such functionality,
// the client would fetch all its on-chain episodes for a tale, then for each episode,
// fetch its imageSetById using the image_set_id from the on-chain data.

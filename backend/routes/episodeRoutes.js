// readium-fun/backend/routes/episodeRoutes.js
const express = require('express');
const {
  createImageSet,
  deleteImageSet,
  getImageSetById,
  updateImageSet
} = require('../controllers/episodeController');

const { protect, authorize } = require('../middleware/authMiddleware');

// Router for routes nested under /api/tales/:taleMongoId/
// This will now primarily be for listing backend image set records associated with a Tale
const taleNestedEpisodeRouter = express.Router({ mergeParams: true });

// GET /api/tales/:taleMongoId/episodes/image-sets - Get all backend image set links for a tale
// Note the path change to avoid conflict if you have other /episodes routes under tales
// taleNestedEpisodeRouter.route('/image-sets')
//   .get(protect, getImageSetsForTale); // Protect if it shows sensitive links or for admin only


// Router for individual episode image set operations, typically mounted at /api/episodes
const individualEpisodeRouter = express.Router();

// POST /api/episodes/image-set - Create or Update an image set.
// Client sends images. If existingImageSetId is provided in body, it's an update.
// Returns the MongoDB _id of the image set (imageSetId).
individualEpisodeRouter.post('/image-set', protect, authorize('creator'), createImageSet);

// GET /api/episodes/image-set/:imageSetId - Get an image set by its MongoDB _id
// This :imageSetId is the ID that was stored on-chain.
individualEpisodeRouter.get('/image-set/:imageSetId', getImageSetById);

// DELETE /api/episodes/image-set/:imageSetId - Delete an image set by its MongoDB _id
individualEpisodeRouter.delete('/image-set/:imageSetId', protect, authorize('creator'), deleteImageSet);

// Optional: Endpoint to link an existing EpisodeImageSet to an on-chain episode's PDA
// This could be a PUT request to /api/episodes/image-set/:imageSetId/link-onchain
// individualEpisodeRouter.put('/image-set/:imageSetId/link-onchain', protect, authorize('creator'), linkImageSetToOnChainEpisode);
// The controller for this would update the episodeOnChainPda, parentTaleOnChainPda, onChainEpisodeIdSeed fields.
// For simplicity, the current createOrUpdateImageSet can handle this if these fields are sent in the body.

module.exports = { taleNestedEpisodeRouter, individualEpisodeRouter };

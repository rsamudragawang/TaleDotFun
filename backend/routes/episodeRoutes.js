// readium-fun/backend/routes/episodeRoutes.js
const express = require('express');
const {
  syncOnChainEpisodeWithBackend,
  getEpisodesForTale,       // This is nested under /api/tales/:taleMongoId/episodes
  getEpisodeImagesByPda,
  // updateEpisodeByPda,    // Renamed syncOnChainEpisodeWithBackend handles updates too if doc exists
  deleteEpisodeImagesByPda
} = require('../controllers/episodeController');

const { protect, authorize } = require('../middleware/authMiddleware');

// Router for routes nested under /api/tales/:taleMongoId/episodes
const taleNestedEpisodeRouter = express.Router({ mergeParams: true });

// GET /api/tales/:taleMongoId/episodes - Get all backend episode links for a tale
taleNestedEpisodeRouter.route('/')
  .get(getEpisodesForTale); // Fetches lean backend records (images, identifiers, snapshots)


// Router for individual episode operations, typically mounted at /api/episodes
const individualEpisodeRouter = express.Router();

// POST /api/episodes/sync-onchain-data - Create or update backend link after on-chain tx
// This endpoint can also be used for updates if the client sends existing episodeOnChainPda
individualEpisodeRouter.post('/sync-onchain-data', protect, authorize('creator'), syncOnChainEpisodeWithBackend);

// GET /api/episodes/images/:episodeOnChainPda - Get images for a specific on-chain episode PDA
individualEpisodeRouter.get('/images/:episodeOnChainPda', getEpisodeImagesByPda);

// PUT /api/episodes/images/:episodeOnChainPda - Update images/snapshots for an on-chain episode PDA
// The syncOnChainEpisodeWithBackend can handle updates if an episodeDoc is found.
// If you want a dedicated PUT for updating only images/snapshots for an existing link:
// individualEpisodeRouter.put('/images/:episodeOnChainPda', protect, authorize('creator'), updateEpisodeImagesAndSnapshotsByPda);
// For simplicity, the POST /sync-onchain-data can serve as an upsert for the backend link.

// DELETE /api/episodes/images/:episodeOnChainPda - Delete backend link & images for an on-chain episode PDA
individualEpisodeRouter.delete('/images/:episodeOnChainPda', protect, authorize('creator'), deleteEpisodeImagesByPda);


module.exports = { taleNestedEpisodeRouter, individualEpisodeRouter };

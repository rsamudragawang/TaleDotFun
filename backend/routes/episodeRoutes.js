// readium-fun/backend/routes/episodeRoutes.js
const express = require('express');
const {
  createEpisode,       // POST /api/tales/:taleId/episodes
  getEpisodesForTale,  // GET  /api/tales/:taleId/episodes
  getEpisodeById,      // GET  /api/episodes/:episodeId  (Separate route for direct access)
  updateEpisode,       // PUT  /api/episodes/:episodeId
  deleteEpisode,       // DELETE /api/episodes/:episodeId
} = require('../controllers/episodeController');

const { protect, authorize } = require('../middleware/authMiddleware');

// Option 1: Merge with taleRoutes if you want /api/tales/:taleId/episodes/:episodeId for update/delete
// For this example, we'll use a separate router for /api/episodes/ for individual episode ops,
// and keep creation/listing under /api/tales/:taleId/episodes

const router = express.Router({ mergeParams: true }); // mergeParams allows access to :taleId from parent router

// Routes that are nested under a specific Tale
// e.g., POST /api/tales/:taleId/episodes
// e.g., GET  /api/tales/:taleId/episodes
router.route('/')
  .post(protect, authorize('creator'), createEpisode) // Create an episode for a tale
  .get(protect,getEpisodesForTale);                           // Get all episodes for a tale

// Routes for specific episodes (not nested under /tales/:taleId/)
// These will be mounted at /api/episodes
const individualEpisodeRouter = express.Router();
individualEpisodeRouter.route('/:episodeId')
    .get(getEpisodeById)
    .put(protect, authorize('creator'), updateEpisode)
    .delete(protect, authorize('creator'), deleteEpisode);

// Export both routers. The main router for nested routes,
// and individualEpisodeRouter to be mounted separately at /api/episodes
module.exports = { taleNestedEpisodeRouter: router, individualEpisodeRouter };

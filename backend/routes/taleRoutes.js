// readium-fun/backend/routes/taleRoutes.js
const express = require('express');
const {
  createTale,
  getAllTales,
  getTaleById,
  updateTale,
  deleteTale,
  getTalesByAuthor,
} = require('../controllers/taleController');
// --- Nested Episode Routes ---
// Re-route requests for /api/tales/:taleId/episodes to the taleNestedEpisodeRouter
router.use('/:taleId/episodes', taleNestedEpisodeRouter);
// Bring in the authentication middleware
// Assuming your authMiddleware.js is in '../middleware/authMiddleware.js'
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// --- Nested Episode Routes ---
// Re-route requests for /api/tales/:taleId/episodes to the taleNestedEpisodeRouter
router.use('/:taleId/episodes', taleNestedEpisodeRouter);

// --- Public Routes ---
// Get all published tales (or based on query params)
router.get('/', getAllTales);

// Get a single tale by its ID
router.get('/:id', getTaleById);

// Get all tales by a specific author's wallet address
router.get('/author/:walletAddress', getTalesByAuthor);


// --- Protected Routes ---
// All routes below this point will use the 'protect' middleware first
// to ensure the user is authenticated (has a valid JWT).

// Create a new tale - only users with 'creator' type can access this
router.post('/', protect, authorize('creator'), createTale);

// Update a tale - only the author of the tale or an admin can update
// The controller (updateTale) will handle the specific ownership/admin check.
router.put('/:id', protect, authorize('creator', 'admin', 'user'), updateTale); // Allow 'user' if they can edit their own drafts, creator for published. Controller logic is key.
                                                                                // For now, let's assume creator or admin.
                                                                                // The authorize middleware here checks if the user *type* is allowed.
                                                                                // The controller then checks if the user *ID* matches the tale's author.

// Delete a tale - only the author of the tale or an admin can delete
// Similar to update, controller handles specific ownership.
router.delete('/:id', protect, authorize('creator', 'admin', 'user'), deleteTale);


// --- Refined permissions for PUT and DELETE for more clarity ---
// If only creators can update/delete THEIR OWN tales, and admins can update/delete ANY tale:
// router.put('/:id', protect, authorize('creator', 'admin'), updateTale);
// router.delete('/:id', protect, authorize('creator', 'admin'), deleteTale);
// The controller logic for updateTale and deleteTale already checks:
// if (tale.author.toString() !== req.user.id && req.user.type !== 'admin')
// So, the authorize('creator', 'admin') middleware ensures the user is at least one of these types.
// If a regular 'user' (not creator) should be able to edit their 'draft' tales,
// the `authorize` middleware would need to include 'user', and the controller logic would need to be more granular.
// For simplicity, let's stick to: creators can manage their tales, admins can manage any.

module.exports = router;

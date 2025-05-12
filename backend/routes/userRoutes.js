// readium-fun/backend/routes/userRoutes.js
const express = require('express');
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes below this are protected by JWT
router.use(protect);

router.route('/')
  .get(authorize('admin'), getAllUsers); // Admin only

router.route('/:id')
  .get(authorize('admin', 'user', 'creator'), getUserById)   // Admin or self
  .put(authorize('admin', 'user', 'creator'), updateUser)    // Admin or self
  .delete(authorize('admin'), deleteUser);      // Admin only

module.exports = router;
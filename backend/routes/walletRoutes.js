// readium-fun/backend/routes/userRoutes.js
const express = require('express');
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserAvatar,
  getUserByWalletAddress,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer(); // Use memory storage for buffer

const router = express.Router();

// Public route to get user by wallet address (must be before protect)
// router.route('/address/:walletAddress').get(getUserByWalletAddress);

router.route('/address/:id').get(getUserByWalletAddress);
router.route('/address').get((req, res) => {
  res.status(200).json({ message: 'Wallet address route' });
});

// All routes below this are protected by JWT
// router.use(protect);

// router.route('/')
//   .get(getAllUsers); // Admin only

// router.route('/:id')
//   .get(authorize('admin', 'user', 'creator'), getUserById)   // Admin or self
//   .put(authorize('admin', 'user', 'creator'), updateUser)    // Admin or self
//   .delete(authorize('admin'), deleteUser);      // Admin only

// router.route('/:id/avatar')
//   .put(authorize('admin', 'user', 'creator'), upload.single('avatar'), updateUserAvatar);

module.exports = router;
// readium-fun/backend/controllers/userController.js
const User = require('../models/User');

// @desc    Get all users
// @access  Private (Admin only)
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find();
    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (err) {
    console.error('Error in getAllUsers:', err.message);
    next(err);
  }
};

// @desc    Get a single user by ID
// @access  Private (Admin or the user themselves)
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (req.user.type !== 'admin' && req.user.id !== user.id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to view this profile' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.error('Error in getUserById:', err.message);
    if (err.name === 'CastError') {
        return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }
    next(err);
  }
};

// @desc    Update user details
// @access  Private (Admin or user updating their own profile)
exports.updateUser = async (req, res, next) => {
  const { name, type } = req.body;
  const updateFields = {};

  if (name) updateFields.name = name;

  try {
    let userToUpdate = await User.findById(req.params.id);
    if (!userToUpdate) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Authorization check
    if (req.user.type !== 'admin' && req.user.id !== userToUpdate.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this user' });
    }

    // Handle 'type' update separately with stricter permissions
    if (type) {
      if (req.user.type === 'admin') { // Admin can change type
        updateFields.type = type;
      } else if (req.user.id === userToUpdate.id.toString() && userToUpdate.type !== type) {
        // User trying to change their own type to something different
        return res.status(403).json({ success: false, message: 'Users cannot change their own type.' });
      } else {
        // User is "updating" their type to the same value, or not an admin
        // If type is not changing, no need to include it in updateFields unless it came from admin
      }
    }

    if (Object.keys(updateFields).length === 0 && type && req.user.type !== 'admin' && userToUpdate.type === type) {
         // User is trying to update only their type to the same value, and no other fields.
         // This is effectively a no-op for them regarding type.
         // If only type was sent and it's the same, and they are not admin, it's a no-op for type.
    } else if (Object.keys(updateFields).length === 0) {
         return res.status(400).json({ success: false, message: 'No valid fields to update provided.' });
    }


    const updatedUser = await User.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({ success: true, data: updatedUser });
  } catch (err) {
    console.error('Error in updateUser:', err.message);
    if (err.name === 'CastError') {
        return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    next(err);
  }
};

// @desc    Delete user
// @access  Private (Admin only)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    // Add any additional checks, e.g., admin can't delete themselves
    if (req.user.id === user.id.toString() && user.type === 'admin') {
        return res.status(400).json({ success: false, message: 'Admin cannot delete their own account through this route.'});
    }
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    console.error('Error in deleteUser:', err.message);
    if (err.name === 'CastError') {
        return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }
    next(err);
  }
};
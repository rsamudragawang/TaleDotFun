// readium-fun/backend/models/User.js
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
  },
  walletAddress: {
    type: String,
    required: [true, 'Wallet address is required'],
    unique: true,
    trim: true,
  },
  type: {
    type: String,
    required: [true, 'Please specify a user type'],
    enum: ['admin', 'customer', 'user', 'creator'], // Customize as needed
    default: 'user',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLoginAt: {
    type: Date,
  }
}, { timestamps: true }); // Adds createdAt and updatedAt

UserSchema.methods.getSignedJwtToken = function () {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in your .env file');
  }
  return jwt.sign({ id: this._id, walletAddress: this.walletAddress, type: this.type }, process.env.JWT_SECRET, {
    expiresIn: '30d', // Or your preferred token expiry
  });
};

module.exports = mongoose.model('User', UserSchema);
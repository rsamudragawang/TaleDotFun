const mongoose = require('mongoose');

const NFTSchema = new mongoose.Schema({
  mintAddress: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    required: true
  },
  metadata: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  sellerWallet: {
    type: String,
    required: true
  },
  attributes: [{
    trait_type: String,
    value: String
  }],
  status: {
    type: String,
    enum: ['listed', 'sold', 'unlisted'],
    default: 'listed'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
NFTSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('NFT', NFTSchema);
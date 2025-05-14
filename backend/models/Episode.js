// readium-fun/backend/models/Episode.js
const mongoose = require('mongoose');

const EpisodeSchema = new mongoose.Schema({
  episodeName: {
    type: String,
    required: [true, 'Please add an episode name'],
    trim: true,
    maxlength: [200, 'Episode name cannot be more than 200 characters'],
  },
  tale: { // Reference to the parent Tale
    type: mongoose.Schema.ObjectId,
    ref: 'Tale', // Your Tale model name
    required: true,
  },
  author: { // Denormalized: User ID of the creator (same as Tale's author)
    type: mongoose.Schema.ObjectId,
    ref: 'User', // Your User model name
    required: true,
  },
  authorWalletAddress: { // Denormalized for convenience
    type: String,
    required: true,
    trim: true,
  },
  content: { // Optional: If episodes have textual content beyond images
    type: String,
    default: '',
  },
  images: { // Array of image URLs (e.g., from Pinata)
    type: [String],
    default: [],
    validate: [arrayLimit, '{PATH} exceeds the limit of 10 images per episode']
  },
  isNft: {
    type: Boolean,
    default: false,
  },
  candyMachineId: { // Optional, relevant if isNft is true
    type: String,
    trim: true,
    default: '',
  },
  order: { // Optional: For sequencing episodes within a tale
    type: Number,
    default: 0,
  },
  status: { // Optional: Status of the episode itself
    type: String,
    enum: ['draft', 'published'],
    default: 'draft',
  }
}, { timestamps: true });

function arrayLimit(val) {
  return val.length <= 10; // Example limit: 10 images per episode
}

// Indexing
EpisodeSchema.index({ tale: 1, order: 1 }); // For fetching episodes of a tale in order
EpisodeSchema.index({ author: 1 });
EpisodeSchema.index({ candyMachineId: 1 }, { sparse: true }); // Sparse index for optional field

module.exports = mongoose.model('Episode', EpisodeSchema);

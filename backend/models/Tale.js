// readium-fun/backend/models/Tale.js
const mongoose = require('mongoose');

const TaleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title for the tale'],
    trim: true,
    maxlength: [150, 'Title cannot be more than 150 characters'],
  },
  content: {
    type: String,
    required: [true, 'Please add the content for the tale'],
  },
  genre: {
    type: String,
    trim: true,
    default: 'General',
  },
  author: { // The User ID of the creator
    type: mongoose.Schema.ObjectId,
    ref: 'User', // Assuming your User model is named 'User'
    required: true,
  },
  authorWalletAddress: { // Denormalized for convenience, can be indexed
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  },
  coverImage: { // URL to a cover image
    type: String,
    trim: true,
    match: [
        /^(ftp|http|https):\/\/[^ "]+$/,
        'Please use a valid URL for cover image'
    ],
    default: '', // Or a default placeholder image URL
  },
  tags: {
    type: [String],
    default: [],
  },
  // Add any other fields relevant to a "tale"
  // e.g., views, likes, chapters if it's a multi-part tale, etc.
  // For simplicity, keeping it basic for now.

}, { timestamps: true }); // Adds createdAt and updatedAt automatically

// Indexing for fields that will be frequently queried
TaleSchema.index({ author: 1 });
TaleSchema.index({ authorWalletAddress: 1 });
TaleSchema.index({ status: 1 });
TaleSchema.index({ genre: 1 });
TaleSchema.index({ tags: 1 });


module.exports = mongoose.model('Tale', TaleSchema);

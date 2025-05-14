// readium-fun/backend/models/Episode.js
const mongoose = require('mongoose');

const EpisodeSchema = new mongoose.Schema({
  // --- Link to Parent Tale (MongoDB Document) ---
  taleMongoId: { // MongoDB _id of the parent Tale document
    type: mongoose.Schema.ObjectId,
    ref: 'Tale',
    required: true,
    index: true,
  },

  // --- Backend-Managed Off-Chain Data ---
  images: { // Array of image CIDs/URLs - MANAGED BY BACKEND
    type: [String],
    default: [],
    validate: [
        (val) => val.length <= 10,
        'Images array exceeds the limit of 10 images per episode'
    ]
  },

  // --- On-Chain Identifiers (Essential for linking and fetching on-chain data) ---
  onChainEpisodeIdSeed: { // The string seed (e.g., truncated UUID) used for on-chain PDA derivation
    type: String,
    required: [true, "On-chain episode ID seed is required"],
    trim: true,
    // This seed + parentTaleOnChainPda should be unique for linking purposes (see compound index)
  },
  parentTaleOnChainPda: { // The public key (as string) of the on-chain Tale account
    type: String,
    required: [true, "Parent tale's on-chain PDA is required"],
    trim: true,
  },
  episodeOnChainPda: { // The public key (as string) of this episode's on-chain account.
                        // This is the primary key for linking this backend record to the on-chain episode.
    type: String,
    required: [true, "Episode's on-chain PDA is required"],
    trim: true,
    unique: true, // Each on-chain episode should have only one corresponding backend record.
    index: true,
  },

  // --- Denormalized Author Information (for backend convenience/auth checks) ---
  authorMongoId: { // MongoDB _id of the author (User document)
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  authorWalletAddress: { // Wallet address of the author
    type: String,
    required: true,
    trim: true,
    index: true,
  },

  // --- Optional Snapshot/Mirror Fields (for backend querying/display if needed) ---
  // These fields would be populated by the client after fetching from on-chain
  // and sent during the sync/update operation.
  episodeNameSnapshot: {
    type: String,
    trim: true,
  },
  orderSnapshot: {
    type: Number,
  },
  statusSnapshot: { // 0: Draft, 1: Published, 2: Archived
    type: Number,
  },
  isNftSnapshot: {
      type: Boolean
  }
  // contentIpfsCidSnapshot: String, // Example if you decide to snapshot
  // candyMachineIdSnapshot: String, // Example if you decide to snapshot

}, { timestamps: true });

// Compound index to quickly find a backend episode record using its on-chain identifiers
// This ensures that for a given parent tale, each episode seed is unique.
EpisodeSchema.index({ parentTaleOnChainPda: 1, onChainEpisodeIdSeed: 1 }, { unique: true });

module.exports = mongoose.model('Episode', EpisodeSchema);

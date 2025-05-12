// readium-fun-master/backend/models/MintActivity.js
const mongoose = require('mongoose');

const MintActivitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  userWalletAddress: { // Denormalized for easier querying without population
    type: String,
    required: [true, 'User wallet address is required'],
    trim: true,
    index: true,
  },
  candyMachineId: {
    type: String,
    required: [true, 'Candy Machine ID is required'],
    trim: true,
    index: true,
  },
  nftMintAddress: { // The actual address of the NFT that was minted
    type: String,
    required: [true, 'NFT Mint Address is required'],
    trim: true,
    unique: true, // Each minted NFT should have a unique record
    index: true,
  },
  episode: { // Optional: Link to an episode if the CM is for a specific one
    type: mongoose.Schema.ObjectId,
    ref: 'Episode',
    default: null,
  },
  tale: { // Optional: Link to the parent tale for context
    type: mongoose.Schema.ObjectId,
    ref: 'Tale',
    default: null,
  },
  transactionSignature: { // The Solana transaction signature for the mint
    type: String,
    required: [true, 'Mint transaction signature is required'],
    trim: true,
  },
  mintedAt: {
    type: Date,
    default: Date.now,
  },
  // You can add more fields here, e.g., price paid, metadata snapshot, etc.
}, { timestamps: true });

// Compound index to quickly find if a user has minted a specific NFT from a CM
MintActivitySchema.index({ user: 1, candyMachineId: 1, nftMintAddress: 1 }, { unique: true });
MintActivitySchema.index({ episode: 1 });


module.exports = mongoose.model('MintActivity', MintActivitySchema);

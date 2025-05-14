   // models/MintedEditionInfo.js
   const mongoose = require('mongoose');
   const { Schema } = mongoose;

    const mintedEditionInfoSchema = new Schema({
        designId: { type: String, required: true, index: true }, // Links to the definition
        editionNumber: { type: Number, required: true, index: true }, // 1, 2, 3...
        metadataIpfsUri: { type: String, required: true, unique: true }, // URI for THIS specific edition's metadata
        onChainNftMint: { type: String, unique: true, sparse: true }, // Populated after minting by creator
        currentOwnerWallet: { type: String, index: true }, // Initially creator, changes on sale
        status: {
            type: String,
            enum: ['unminted', 'minted', 'listed', 'sold', 'error'],
            default: 'unminted',
             index: true,
             },
        listingStatePda: { type: String, sparse: true }, // Populated when listed on your marketplace program

    }, { timestamps: true });

    mintedEditionInfoSchema.index({ designId: 1, editionNumber: 1 }, { unique: true });
    module.exports = mongoose.model('MintedEditionInfo', mintedEditionInfoSchema);
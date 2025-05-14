// readium-fun/backend/models/EpisodeImageSet.js
// This model stores ONLY the list of images for an episode.
// Its MongoDB _id will be stored in the on-chain Episode account.
const mongoose = require('mongoose');

const EpisodeImageSetSchema = new mongoose.Schema({
  images: {
    type: [String], // Array of image CIDs or full URLs
    default: [],
    validate: [
        (val) => val.length <= 10,
        'Image list exceeds the limit of 10 images.'
    ]
  },
  // No other fields. The _id is the link.
  // Ownership/context is derived from the on-chain Episode that stores this _id.
}, { timestamps: true });

module.exports = mongoose.model('EpisodeImageSet', EpisodeImageSetSchema);

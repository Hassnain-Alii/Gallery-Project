const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  imageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Image', required: true }
}, { timestamps: true });

favoriteSchema.index({ userId: 1, imageId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);

const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  author: { type: String, required: true },
  width: { type: Number },
  height: { type: Number },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Important for indexing efficiently during search
imageSchema.index({ author: 1 });
imageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Image', imageSchema);

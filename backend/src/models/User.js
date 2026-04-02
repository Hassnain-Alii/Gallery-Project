const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String },              // Optional — not set for Google-only accounts
  googleId: { type: String, sparse: true }, // Google OAuth subject ID
  picture:  { type: String },              // Google profile picture URL
  dob:      { type: Date },                // Date of Birth
  refreshToken: { type: String },          // Store current refresh token
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

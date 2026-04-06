const express = require('express');
const router = express.Router();
const sharp = require('sharp');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');
const multer = require('multer');
const mongoose = require('mongoose');

// Google OAuth client (used to verify ID tokens that the browser sends us)
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── Rate limiter: max 10 auth attempts per 15 min per IP ───────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authLimiter);

// ─── Helper: Generate Access and Refresh Tokens ─────────────────────────────
const generateTokens = async (user) => {
  const accessToken = jwt.sign(
    { userId: user._id, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_SECRET || 'refresh_secret_fallback',
    { expiresIn: '7d' }
  );

  // Store refresh token in database (for simplicity, only store one active session per user)
  user.refreshToken = refreshToken;
  await user.save();

  return { accessToken, refreshToken };
};

// ─── POST /auth/signup ───────────────────────────────────────────────────────
router.post('/signup', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Invalid email format').normalizeEmail(),
  body('password').isStrongPassword({
    minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1
  }).withMessage('Password must be at least 8 characters and contain an uppercase, lowercase, number, and special character'),
], async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connection.asPromise();
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'An account with this email already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    const { accessToken, refreshToken } = await generateTokens(user);

    res.status(201).json({ 
      token: accessToken,
      refreshToken, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        picture: user.picture,
        googleId: user.googleId 
      } 
    });
  } catch (error) {
    res.status(500).json({ message: 'Signup failed', error: error.message });
  }
});

// ─── POST /auth/login ────────────────────────────────────────────────────────
router.post('/login', [
  body('email').isEmail().withMessage('Email and password are required').normalizeEmail(),
  body('password').notEmpty().withMessage('Email and password are required'),
], async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connection.asPromise();
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Generic error for both "not found" and "wrong password" to prevent user enumeration
    const isMatch = user && user.password ? await bcrypt.compare(password, user.password) : false;
    if (!user || !isMatch) {
      return res.status(401).json({ message: 'Email or password is incorrect' });
    }

    const { accessToken, refreshToken } = await generateTokens(user);

    res.json({ 
      token: accessToken,
      refreshToken, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        picture: user.picture,
        googleId: user.googleId 
      } 
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// ─── POST /auth/google ───────────────────────────────────────────────────────
// Receives a Google ID token (credential) from the frontend Google Sign-In button.
// Verifies it with Google's servers, then finds-or-creates a local user.
router.post('/google', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connection.asPromise();
    }
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required' });
    }

    // Verify the ID token with Google
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error('Invalid Google token payload');
    }

    const { sub: googleId, email, name, picture, email_verified } = payload;

    if (!email_verified) {
      return res.status(401).json({ message: 'Google account email is not verified' });
    }

    // Normalize email for consistent lookup (matches standard login logic)
    const normalizedEmail = email.toLowerCase().trim();

    // Find existing user by email, or create a new one
    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      // Link Google ID to an existing email/password account if not already linked
      if (!user.googleId) {
        user.googleId = googleId;
        // Update picture if they don't have one
        if (!user.picture && picture) user.picture = picture;
        await user.save();
      }
    } else {
      // Create a brand new user — use a fallback for name if somehow missing
      user = await User.create({ 
        name: name || email.split('@')[0], 
        email: normalizedEmail, 
        googleId, 
        picture 
      });
    }

    const { accessToken, refreshToken } = await generateTokens(user);

    res.json({ 
      token: accessToken,
      refreshToken, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        picture: user.picture,
        googleId: user.googleId 
      } 
    });
  } catch (error) {
    console.error(' [Google Auth Error]:', error); // Full error for backend logs
    res.status(401).json({ 
      message: 'Google authentication failed', 
      details: error.message // Helps frontend debugging
    });
  }
});

// ─── AUTHENTICATED ROUTES ────────────────────────────────────────────────────
const auth = require('../middleware/auth');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB Limit for avatars
});

// ─── POST /auth/avatar ───────────────────────────────────────────────────────
router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    
    // Optimize avatar
    const optimizedBuffer = await sharp(req.file.buffer)
      .resize(400, 400, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer();

    const fileName = `avatar-${req.user.userId}-${Date.now()}.webp`;
    const bucketName = 'gallery';

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, optimizedBuffer, { contentType: 'image/webp' });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(fileName);

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.picture = publicUrl;
    await user.save();

    res.json({ message: 'Avatar uploaded successfully', picture: publicUrl });
  } catch (error) {
    res.status(500).json({ message: 'Avatar upload failed', error: error.message });
  }
});


// ─── PUT /auth/profile ───────────────────────────────────────────────────────
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, dob, picture } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (dob) user.dob = dob;
    if (picture) user.picture = picture;

    await user.save();
    res.json({ 
      message: 'Profile updated successfully',
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        picture: user.picture,
        dob: user.dob,
        googleId: user.googleId 
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
});

// ─── PUT /auth/change-password ───────────────────────────────────────────────
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Prevent password change for Google-only accounts
    if (!user.password && user.googleId) {
      return res.status(400).json({ message: 'Accounts managed by Google do not have a password' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to change password', error: error.message });
  }
});

// ─── POST /auth/refresh ──────────────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: 'Refresh token required' });

  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connection.asPromise();
    }
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh_secret_fallback');
    const user = await User.findById(payload.userId);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(user);

    res.json({ token: accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    res.status(403).json({ message: 'Session expired, please login again' });
  }
});

// ─── POST /auth/logout ───────────────────────────────────────────────────────
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const user = await User.findOne({ refreshToken });
      if (user) {
        user.refreshToken = null;
        await user.save();
      }
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Logout failed' });
  }
});

module.exports = router;

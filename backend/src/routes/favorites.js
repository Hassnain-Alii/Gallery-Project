const express = require('express');
const router = express.Router();
const Favorite = require('../models/Favorite');
const auth = require('../middleware/auth');

// Protected routes
router.use(auth);

router.get('/', async (req, res) => {
  try {
    // Populate the Image specifically so UI can render them exactly like normal images
    const favorites = await Favorite.find({ userId: req.user.userId })
                                    .populate('imageId')
                                    .sort({ createdAt: -1 });
    // Transform data to match the standard Image object array shape
    const images = favorites.map(f => f.imageId).filter(img => img !== null);
    
    res.json(images);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching favorites', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { imageId } = req.body;
    if (!imageId) return res.status(400).json({ message: 'imageId is required' });

    const existing = await Favorite.findOne({ userId: req.user.userId, imageId });
    if (existing) return res.status(400).json({ message: 'Already favorited' });

    const favorite = new Favorite({ userId: req.user.userId, imageId });
    await favorite.save();
    res.status(201).json(favorite);
  } catch (error) {
    res.status(500).json({ message: 'Failed to favorite', error: error.message });
  }
});

router.delete('/:imageId', async (req, res) => {
  try {
    const { imageId } = req.params;
    await Favorite.findOneAndDelete({ userId: req.user.userId, imageId });
    res.json({ message: 'Favorite removed' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove favorite', error: error.message });
  }
});

// Endpoint to quickly get an array of just the Image IDs favored by this user.
// Helps UI know which hearts to fill in.
router.get('/ids', async (req, res) => {
    try {
      const favorites = await Favorite.find({ userId: req.user.userId }).select('imageId');
      const ids = favorites.map(f => f.imageId.toString());
      res.json(ids);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching favorite IDs', error: error.message });
    }
  });

module.exports = router;

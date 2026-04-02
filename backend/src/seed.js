require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Image = require('./models/Image');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gallery';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing
    await User.deleteMany({});
    await Image.deleteMany({});

    // Create a dummy user
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@gallery.com',
      password: 'hashedpassword' 
    });

    console.log('Fetching image data from picsum.photos...');
    const response = await fetch('https://picsum.photos/v2/list?page=2&limit=100');
    const picsumData = await response.json();

    for (let img of picsumData) {
      await Image.create({
        url: img.download_url,
        author: img.author,
        width: img.width,
        height: img.height,
        uploadedBy: admin._id
      });
    }

    console.log('Seed completed successfully with 100 Picsum.photos from page 2');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();

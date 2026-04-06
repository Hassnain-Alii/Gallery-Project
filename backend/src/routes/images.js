const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");
const Image = require("../models/Image");
const auth = require("../middleware/auth");
const { createClient } = require("@supabase/supabase-js");
const redisClient = require("../config/redis");
const sharp = require("sharp"); // for optimization

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// GET /images/authors
router.get("/authors", async (req, res) => {
  try {
    // Force a slightly longer wait for DB on authors route (often hit first)
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connection.asPromise();
    }

    // Use a short timeout for Redis to avoid hanging
    const cachedAuthors = await Promise.race([
      redisClient.get("gallery:authors"),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Redis Timeout")), 2000))
    ]).catch((err) => {
      console.warn("Redis Author Fetch Skipped:", err.message);
      return null;
    });

    if (cachedAuthors) return res.json(JSON.parse(cachedAuthors));
    
    const authors = await Image.distinct("author").catch(() => []);
    
    // If no authors found, it might be an empty DB, which is fine, 
    // but we should at least avoid crashing.
    await redisClient.setex("gallery:authors", 1800, JSON.stringify(authors)).catch(() => {});
    res.json(authors);
  } catch (error) {
    console.error("Authors Error:", error.message);
    // Return empty array instead of 500 to keep UI stable
    res.json([]); 
  }
});

// GET /images
router.get("/", async (req, res) => {
  try {
    // Wait for connection if it's still connecting
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connection.asPromise();
    }


    const { page = 1, limit = 15, search, author } = req.query;
    const count = await Image.countDocuments().catch(() => -1);
    
    // Seed logic only if empty and not search/filtering
    if (count === 0 && !search && (!author || author === "All")) {
      try {
        const User = require("../models/User");
        let admin = await User.findOne({ email: "admin@gallery.com" });
        if (!admin) {
          admin = await User.create({ name: "Admin", email: "admin@gallery.com", password: "root" });
        }
        
        // Use a 3-second timeout for the Picsum fetch to avoid blocking the whole request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch("https://picsum.photos/v2/list?page=1&limit=30", { signal: controller.signal });
        clearTimeout(timeoutId);
        
        const data = await response.json();
        const docs = data.map(img => {
          const optimizedUrl = `https://picsum.photos/id/${img.id}/800/1000`;
          return {
            url: optimizedUrl, 
            author: img.author, 
            width: 800, 
            height: 1000, 
            uploadedBy: admin._id
          };
        });
        await Image.insertMany(docs);
        await redisClient.del("gallery:authors").catch(() => {});
      } catch (seedErr) {
        console.warn("Seeding skipped or failed:", seedErr.message);
      }
    }


    const query = {};
    if (author && author !== "All") query.author = author;
    if (search) query.$or = [{ author: { $regex: search, $options: "i" } }];

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const images = await Image.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
    const total = await Image.countDocuments(query);

    res.json({ images, totalPages: Math.ceil(total / limit), currentPage: parseInt(page) });
  } catch (error) {
    console.error("Images Error:",  error.message);
    res.status(500).json({ message: "Error fetching images", error: error.message });
  }
});

// POST /images/upload
router.post("/upload", auth, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file" });
    
    // Optimize with sharp
    const optimizedBuffer = await sharp(req.file.buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const fileName = `${Date.now()}-${req.file.originalname.replace(/\s+/g, "_").split('.')[0]}.webp`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("gallery")
      .upload(fileName, optimizedBuffer, { contentType: 'image/webp' });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from("gallery").getPublicUrl(fileName);

    const newImage = new Image({ url: publicUrl, author: req.user.name, uploadedBy: req.user.userId });
    await newImage.save();
    await redisClient.del("gallery:authors").catch(() => {});
    res.status(201).json(newImage);
  } catch (error) {
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
});

router.get("/user", auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const query = { uploadedBy: req.user.userId };
    const images = await Image.find(query).sort({ createdAt: -1 }).skip((page-1)*limit).limit(parseInt(limit));
    const total = await Image.countDocuments(query);
    res.json({ images, totalPages: Math.ceil(total/limit), currentPage: parseInt(page) });
  } catch (error) {
    res.status(500).json({ message: "Error", error: error.message });
  }
});

module.exports = router;

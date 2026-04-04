const express = require("express");
const router = express.Router();
const multer = require("multer");
const Image = require("../models/Image");
const auth = require("../middleware/auth");
const { createClient } = require("@supabase/supabase-js");
const redisClient = require("../config/redis");

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
    const cachedAuthors = await redisClient.get("gallery:authors").catch(() => null);
    if (cachedAuthors) return res.json(JSON.parse(cachedAuthors));
    
    const authors = await Image.distinct("author");
    await redisClient.setex("gallery:authors", 3600, JSON.stringify(authors)).catch(() => {});
    res.json(authors);
  } catch (error) {
    res.status(500).json({ message: "Error fetching authors", error: error.message });
  }
});

// GET /images
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 15, search, author } = req.query;
    const count = await Image.countDocuments().catch(() => 0);
    
    if (count < 10 && !search && (author === "All" || !author)) {
      const User = require("../models/User");
      let admin = await User.findOne({ email: "admin@gallery.com" });
      if (!admin) {
        admin = await User.create({ name: "Admin", email: "admin@gallery.com", password: "root" });
      }
      const response = await fetch("https://picsum.photos/v2/list?page=1&limit=50");
      const data = await response.json();
      const docs = data.map(img => ({
        url: img.download_url, author: img.author, width: img.width, height: img.height, uploadedBy: admin._id
      }));
      await Image.insertMany(docs);
      await redisClient.del("gallery:authors").catch(() => {});
    }

    const query = {};
    if (author && author !== "All") query.author = author;
    if (search) query.$or = [{ author: { $regex: search, $options: "i" } }];

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const images = await Image.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
    const total = await Image.countDocuments(query);

    res.json({ images, totalPages: Math.ceil(total / limit), currentPage: parseInt(page) });
  } catch (error) {
    res.status(500).json({ message: "Error fetching images", error: error.message });
  }
});

// POST /images/upload
router.post("/upload", auth, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file" });
    const fileName = `${Date.now()}-${req.file.originalname.replace(/\s+/g, "_")}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("gallery")
      .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });

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

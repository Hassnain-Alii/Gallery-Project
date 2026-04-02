const express = require("express");
const router = express.Router();
const multer = require("multer");
const Image = require("../models/Image");
const auth = require("../middleware/auth");
const { minioClient } = require("../config/minio");
const redisClient = require("../config/redis");

// Configure Multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB Limit
});

// GET /images/repair - Fix existing URLs and force-seed
router.get("/repair", async (req, res) => {
  try {
    const publicPort = process.env.PUBLIC_MINIO_PORT || "9200";
    const imagesToFix = await Image.find({ url: /:9000/ });
    for (const img of imagesToFix) {
      img.url = img.url.replace(":9000", `:${publicPort}`);
      await img.save();
    }

    const count = await Image.countDocuments();
    if (count < 100) {
      const User = require("../models/User");
      let admin = await User.findOne({ email: "admin@gallery.com" });
      if (!admin) {
        admin = await User.create({
          name: "System Admin",
          email: "admin@gallery.com",
          password: "hashedpassword",
        });
      }
      const response = await fetch("https://picsum.photos/v2/list?page=1&limit=300");
      const picsumData = await response.json();
      const docs = picsumData.map((img) => ({
        url: img.download_url,
        author: img.author,
        width: img.width,
        height: img.height,
        uploadedBy: admin._id,
      }));
      await Image.insertMany(docs);
      await redisClient.del("gallery:authors");
    }
    res.json({ message: "Repair & Seed complete!", fixed: imagesToFix.length, total: await Image.countDocuments() });
  } catch (err) {
    res.status(500).json({ message: "Repair failed", error: err.message });
  }
});

// GET /images/authors - Get dynamic list of authors
router.get("/authors", async (req, res) => {
  try {
    const cachedAuthors = await redisClient.get("gallery:authors");
    if (cachedAuthors) {
      return res.json(JSON.parse(cachedAuthors));
    }
    const authors = await Image.distinct("author");
    await redisClient.setex("gallery:authors", 3600, JSON.stringify(authors)); // Cache for 1 hr
    res.json(authors);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching authors", error: error.message });
  }
});

// GET /images - Get paginated/filtered images
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 15, search, author } = req.query;
    // Auto-seed if empty
    const count = await Image.countDocuments();
    if (count < 100 && !search && (author === "All" || !author)) {
      console.log("Database empty, auto-fetching from Picsum...");
      const User = require("../models/User"); // lazy load
      let admin = await User.findOne({ email: "admin@gallery.com" });
      if (!admin) {
        admin = await User.create({
          name: "System Admin",
          email: "admin@gallery.com",
          password: "hashedpassword",
        });
      }

      const response = await fetch(
        "https://picsum.photos/v2/list?page=1&limit=400",
      );
      const picsumData = await response.json();
      const docs = picsumData.map((img) => ({
        url: img.download_url,
        author: img.author,
        width: img.width,
        height: img.height,
        uploadedBy: admin._id,
      }));
      await Image.insertMany(docs);
      await redisClient.del("gallery:authors");
    }

    const query = {};
    if (author && author !== "All") {
      query.author = author;
    }
    if (search) {
      query.$or = [{ author: { $regex: search, $options: "i" } }];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const images = await Image.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    const total = await Image.countDocuments(query);

    res.json({
      images,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching images", error: error.message });
  }
});

// GET /images/user - Get images uploaded by current user
router.get("/user", auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { uploadedBy: req.user.userId };
    const images = await Image.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    const total = await Image.countDocuments(query);

    res.json({
      images,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching your images", error: error.message });
  }
});

// POST /images/upload - Auth Required
router.post("/upload", auth, upload.single("image"), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "No image file provided" });

    const fileName = `${Date.now()}-${req.file.originalname.replace(/\s+/g, "_")}`;
    const bucketName = "images";

    // Internal MinIO access for uploading
    await minioClient.putObject(
      bucketName,
      fileName,
      req.file.buffer,
      req.file.size,
      {
        "Content-Type": req.file.mimetype,
      },
    );

    // For the UI, we need the PUBLIC accessible URL.
    // If we're in Docker, internal is minio:9000, but public is localhost:9200.
    const publicHost = process.env.PUBLIC_MINIO_ENDPOINT || "localhost";
    const publicPort = process.env.PUBLIC_MINIO_PORT || "9200";
    const fileUrl = `http://${publicHost}:${publicPort}/${bucketName}/${fileName}`;

    const newImage = new Image({
      url: fileUrl,
      author: req.user.name,
      uploadedBy: req.user.userId,
    });

    await newImage.save();

    // Invalidate authors cache
    await redisClient.del("gallery:authors");

    res.status(201).json(newImage);
  } catch (error) {
    console.error("SERVER UPLOAD ERROR:", error);
    res.status(500).json({
      message: "Upload failed",
      error: error.message,
      details:
        error.code === "ECONNREFUSED"
          ? "Could not connect to MinIO. Check if it is running."
          : "Internal Server Error",
    });
  }
});

module.exports = router;

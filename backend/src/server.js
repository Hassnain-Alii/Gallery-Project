require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const helmet = require('helmet')
const pinoHttp = require('pino-http')()
const hpp = require('hpp')
const compression = require('compression')

const authRoutes = require('./routes/auth')
const imageRoutes = require('./routes/images')
const favoriteRoutes = require('./routes/favorites')

const app = express()

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://gallery-project-frontend.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

// Middleware
app.use(helmet({
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  crossOriginEmbedderPolicy: false,
}))

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))
app.use(pinoHttp)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(hpp())
app.use(compression())

// Database Connection
console.log("Connecting to MongoDB...");
mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/gallery', {
  serverSelectionTimeoutMS: 5000, 
})
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('CRITICAL: MongoDB connection error:', err);
  });

// Routes
app.use('/auth', authRoutes)
app.use('/images', imageRoutes)
app.use('/favorites', favoriteRoutes)

// Health check
app.get('/health', (req, res) => res.json({ 
  status: 'ok', 
  db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
}))

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR caught:", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  // Ensure CORS headers are present even on errors
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  res.status(500).json({ 
    message: "Internal Server Error", 
    error: process.env.NODE_ENV === 'production' ? "Check server logs for details" : err.message 
  });
});

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5002;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app; // For Vercel

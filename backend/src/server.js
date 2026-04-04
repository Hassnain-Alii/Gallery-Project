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

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://gallery-project-frontend.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
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
  res.status(500).json({ 
    message: "Internal Server Error", 
    error: process.env.NODE_ENV === 'production' ? "Check server logs for details" : err.message 
  });
});

module.exports = app; // For Vercel

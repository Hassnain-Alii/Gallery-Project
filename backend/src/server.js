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
const { ensureBucket } = require('./config/minio')
const favoriteRoutes = require('./routes/favorites')

const app = express()

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5174',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(pinoHttp)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(hpp())
app.use(compression())

// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/gallery')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err))

// Routes
app.use('/auth', authRoutes)
app.use('/images', imageRoutes)
app.use('/favorites', favoriteRoutes)

// Basic health check route
app.get('/health', (req, res) => res.json({ status: 'ok' }))

const PORT = process.env.PORT || 5000
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`)
  ensureBucket()
})

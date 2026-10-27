
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dns from 'node:dns'

import { loadUser } from './auth.js'
import { errorHandler, notFound } from './http.js'

import authRoutes from './routes/auth.js'
import serviceRoutes from './routes/services.js'
import doctorRoutes from './routes/doctors.js'
import appointmentRoutes from './routes/appointments.js'

// DNS configuration
dns.setServers(['8.8.8.8', '1.1.1.1'])

const app = express()

// Server port
const PORT = Number(process.env.PORT || 5000)

// Allowed frontend origins
const allowedOrigins = (
  process.env.CLIENT_ORIGIN || 'http://localhost:3000'
)
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean)

// Trust Render reverse proxy
app.set('trust proxy', 1)

// Disable Express header
app.disable('x-powered-by')

// Security headers
app.use((_req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  })
  next()
})

// CORS configuration
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

// Parse JSON request bodies
app.use(express.json({ limit: '100kb' }))

// Parse cookies
app.use(cookieParser())

// Load authenticated user
app.use(loadUser)

// Root route
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Patient Booking Backend API is running',
  })
})

// Health check
app.get('/api/health', (_req, res) => {
  res.set('Cache-Control', 'no-store')

  res.status(200).json({
    ok: true,
    message: 'Patient Booking API is healthy',
    timestamp: new Date().toISOString(),
  })
})

app.get('/', (_req, res) => {
  res.set('Cache-Control', 'no-store')

  res.status(200).json({
    ok: true,
    message: 'Patient Booking API is Running Successfully',
    timestamp: new Date().toISOString(),
  })
})

// Authentication routes
app.use('/api/auth', authRoutes)

// Services routes
app.use('/api/services', serviceRoutes)

// Doctors routes
app.use('/api/doctors', doctorRoutes)

// Appointments routes
app.use('/api/appointments', appointmentRoutes)

// Handle unknown routes
app.use(notFound)

// Global error handler
app.use(errorHandler)

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('====================================')
  console.log('Patient Booking Backend Started')
  console.log(`Port: ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`Allowed Origins: ${allowedOrigins.join(', ')}`)
  console.log('====================================')
})

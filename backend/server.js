/**
 * ============================================================================
 * SRINIDHI EYE CARE & OPTICALS — BACKEND API SERVER
 * Peerzad Street, Vidya Nagar, Gangavathi, Koppal District, Karnataka - 583227
 * Phone: +91 87628 88866
 * Production-ready Express API with PostgreSQL on Render & Clinic Admin Portal
 * ============================================================================
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');

const db = require('./database/db');
const appointmentsRoutes = require('./routes/appointments');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

const defaultAllowedOrigins = [
  'https://shrihari12012007-web.github.io',
  'https://salon-perimeter-backend.onrender.com',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5000'
];

const envOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) 
  : [];

const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...envOrigins]));

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    if (origin.endsWith('.github.io') || origin.endsWith('.onrender.com')) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS policy`), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Serve static frontend assets for the Admin Dashboard
app.use('/admin', express.static(path.join(__dirname, 'public')));
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});
app.get('/admin/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Root & Health Check Endpoints
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    clinic: 'Srinidhi Eye Care & Opticals',
    facility: 'Premier Eye Examination Clinic & Precision Optical Studio',
    location: 'Peerzad Street, Vidya Nagar, Gangavathi, Koppal District, Karnataka - 583227',
    contact: '+91 87628 88866',
    admin_portal: '/admin',
    endpoints: {
      health: '/api/health',
      appointments: 'POST /api/appointments',
      auth: 'POST /api/auth/login',
      admin_appointments: 'GET/PATCH /api/admin/appointments'
    }
  });
});

app.get('/api/health', async (req, res) => {
  try {
    let dbStatus = 'healthy';
    let dbType = db.isInMemory() ? 'in-memory (dev)' : 'postgresql';
    
    const testResult = await db.query('SELECT 1 AS check');
    if (!testResult || !testResult.rows || testResult.rows.length === 0) {
      dbStatus = 'degraded';
    }

    res.status(200).json({
      status: 'healthy',
      database: dbStatus,
      database_type: dbType,
      timestamp: new Date().toISOString(),
      uptime_seconds: Math.floor(process.uptime())
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Mount Application Routes
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// 404 Handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `API route ${req.method} ${req.originalUrl} does not exist.`
  });
});

// Fallback error handler
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err);
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      error: 'CORS_ERROR',
      message: err.message
    });
  }
  res.status(500).json({
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected internal error occurred on the server.'
  });
});

async function startServer() {
  try {
    console.log('[SRINIDHI SERVER] Initializing database...');
    await db.initDatabase();

    app.listen(PORT, () => {
      console.log(`[SRINIDHI SERVER] Srinidhi Eye Care API listening on port ${PORT}`);
      console.log(`[SRINIDHI SERVER] Admin Portal live at: http://localhost:${PORT}/admin`);
    });
  } catch (err) {
    console.error('[SRINIDHI SERVER] Fatal startup error:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;

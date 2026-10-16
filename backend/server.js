/**
 * ============================================================================
 * SALON PERIMETER SHIMOGA — BACKEND API SERVER
 * Women & Children Salon • Sharavathi Nagar Main Road, Shivamogga, Karnataka
 * Production-ready Express API with PostgreSQL on Render & Owner Admin Dashboard
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

// Trust reverse proxy (Render, Cloudflare, etc.)
app.set('trust proxy', 1);

// Security Headers via Helmet (with permissive CSP for admin dashboard fonts & styles)
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows inline fonts and SVGs in admin dashboard
    crossOriginEmbedderPolicy: false
  })
);

// CORS Configuration
const defaultAllowedOrigins = [
  'https://shrihari12012007-web.github.io',
  'https://salon-perimeter-backend.onrender.com',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'http://localhost:8000',
  'http://localhost:5000'
];

const envOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...envOrigins])];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman, same-origin)
      if (!origin) return callback(null, true);

      // Check exact match, localhost, GitHub Pages, or Render domain
      const isAllowed = allowedOrigins.includes(origin) || 
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
        origin.endsWith('.github.io') ||
        origin.endsWith('.onrender.com');

      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Blocked request from unauthorized origin: ${origin}`);
        callback(new Error(`Origin ${origin} not permitted by CORS policy`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// Body Parsing Middleware (Strict 100kb limit)
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Salon Perimeter Shimoga API',
    business: "Women's & Children's Salon • Shivamogga",
    database: db.isInMemory() ? 'in-memory' : 'postgresql',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Serve Admin Dashboard Static Files at /admin
app.use('/admin', express.static(path.join(__dirname, 'public')));
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Root friendly greeting
app.get('/', (req, res) => {
  res.json({
    name: 'Salon Perimeter Shimoga Backend API',
    target: "Women's & Children's Salon",
    location: 'Sharavathi Nagar Main Road, Shivamogga, Karnataka',
    contact: '+91 95913 24243',
    demoNotice: 'Unofficial portfolio demonstration website backend',
    status: 'operational',
    adminPanel: '/admin',
    healthCheck: '/api/health'
  });
});

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `Endpoint ${req.method} ${req.originalUrl} does not exist.`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      error: 'CORS_FORBIDDEN',
      message: err.message
    });
  }

  console.error('[SERVER] Unhandled server exception:', err);
  res.status(500).json({
    success: false,
    error: 'INTERNAL_ERROR',
    message: 'An unexpected server error occurred.'
  });
});

// Start Server when run directly
if (require.main === module) {
  db.initDatabase()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`================================================================`);
        console.log(`✨ Salon Perimeter API running on port ${PORT}`);
        console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
        console.log(`🔐 Owner Admin: http://localhost:${PORT}/admin`);
        console.log(`🏬 Dedicated to: Women & Children • Shivamogga, Karnataka`);
        console.log(`================================================================`);
      });
    })
    .catch((err) => {
      console.error('[SERVER] Failed to initialize database:', err);
      process.exit(1);
    });
}

module.exports = app;

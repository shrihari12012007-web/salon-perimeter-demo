/**
 * Salon Perimeter Shimoga — In-Memory Rate Limiter Middleware
 * Provides lightweight, production-grade anti-spam and brute-force protection
 * without requiring Redis or external state stores.
 */

const crypto = require('crypto');

/**
 * Creates an in-memory rate limiting middleware
 * @param {object} options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Max requests allowed within windowMs
 * @param {string} options.message - Error message when limit exceeded
 */
function createRateLimiter({ windowMs = 15 * 60 * 1000, max = 100, message = 'Too many requests. Please try again later.' }) {
  const store = new Map();

  // Periodic cleanup of stale client records every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [key, data] of store.entries()) {
      if (now > data.resetTime) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req, res, next) => {
    // Identify client by IP (or X-Forwarded-For when behind proxy like Render)
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || req.ip || '127.0.0.1';
    const key = crypto.createHash('sha256').update(clientIp).digest('hex');

    const now = Date.now();
    let record = store.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs
      };
      store.set(key, record);
    } else {
      record.count += 1;
    }

    // Set standard RateLimit response headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message,
        retryAfter: retryAfterSeconds
      });
    }

    req.clientIpHash = key;
    next();
  };
}

// Appointment enquiry rate limiter: 10 enquiries per 15 minutes per IP
const appointmentLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many appointment enquiries submitted from this network. Please wait a few minutes before trying again or call us directly at +91 98765 43210.'
});

// Admin login brute-force limiter: 10 login attempts per 15 minutes per IP
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts. Please wait 15 minutes before trying again.'
});

module.exports = {
  appointmentLimiter,
  authLimiter
};

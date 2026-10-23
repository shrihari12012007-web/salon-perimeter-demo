/**
 * ============================================================================
 * SRINIDHI EYE CARE — CLINIC & OPTICAL STUDIO CONFIGURATION
 * Peerzad Street, Vidya Nagar (Near Chandrappa Hospital / Beside Yagna Olka Temple)
 * Gangavathi, Koppal District, Karnataka - 583227
 * Phone: +91 87628 88866
 * ============================================================================
 */

window.SRINIDHI_CONFIG = {
  CLINIC_NAME: 'Srinidhi Eye Care & Opticals',
  LOCATION: 'Peerzad Street, Vidya Nagar, Gangavathi, Karnataka',
  PINCODE: '583227',
  PHONE: '+91 87628 88866',
  EMAIL: 'care@srinidhieye.com',
  TIMINGS: 'Mon–Sat: 9:30 AM – 8:30 PM | Sun: 10:00 AM – 2:00 PM',
  // API URL for local dev vs live Render backend
  API_BASE_URL: (
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' ||
    window.location.protocol === 'file:'
  )
    ? 'http://localhost:5000'
    : 'https://salon-perimeter-backend.onrender.com'
};

// Aliases for compatibility
window.APP_CONFIG = window.SRINIDHI_CONFIG;
window.SALON_CONFIG = window.SRINIDHI_CONFIG;

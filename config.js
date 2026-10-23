/**
 * ============================================================================
 * SRINIDHI EYE CARE HOSPITAL ?" FRONTEND API CONFIGURATION
 * Super Speciality Eye Hospital & Micro-Surgery Laser Center
 * Hospital Road, Near CBS Circle, Gangavathi, Koppal District, Karnataka - 583227
 * ============================================================================
 * 
 * Configures the backend API endpoint for GitHub Pages and local development.
 */

window.SRINIDHI_CONFIG = {
  HOSPITAL_NAME: 'Srinidhi Eye Care Hospital',
  LOCATION: 'Gangavathi, Karnataka',
  PINCODE: '583227',
  OPD_PHONE: '+91 94481 23456',
  EMERGENCY_PHONE: '+91 8533 270123',
  EMAIL: 'care@srinidhieye.com',
  // Automatically detects local environment vs live Render backend deployment
  API_BASE_URL: (
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' ||
    window.location.protocol === 'file:'
  )
    ? 'http://localhost:5000'
    : 'https://salon-perimeter-backend.onrender.com'
};

// Backward-compatible alias for existing service scripts
window.SALON_CONFIG = window.SRINIDHI_CONFIG;

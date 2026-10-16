/**
 * ============================================================================
 * SALON PERIMETER SHIMOGA — FRONTEND API CONFIGURATION
 * Women & Children Salon • Sharavathi Nagar Main Road, Shivamogga, Karnataka
 * ============================================================================
 * 
 * Configures the backend API endpoint for GitHub Pages and local development.
 * 
 * Instructions for Live Render Deployment:
 * 1. Deploy your backend to Render Web Services.
 * 2. Copy your Render URL (e.g., https://salon-perimeter-backend.onrender.com).
 * 3. Replace the production fallback URL below with your actual Render URL.
 */

window.SALON_CONFIG = {
  // Automatically detects local environment vs live GitHub Pages deployment
  API_BASE_URL: (
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' ||
    window.location.protocol === 'file:'
  )
    ? 'http://localhost:5000'
    : 'https://salon-perimeter-backend.onrender.com'
};

// API Configuration
// ---------------------------------------------------------------------------
// IMPORTANT: GitHub Pages (and any static host) can only serve the frontend.
// The Express backend must run somewhere reachable by the browser. When you
// open the site locally the backend is http://localhost:5000. When the site is
// hosted online, set PROD_API_BASE_URL below to your deployed backend URL
// (e.g. https://your-backend.onrender.com/api) — otherwise account creation and
// login will fail because the browser is trying to reach a backend that isn't
// there.
// ---------------------------------------------------------------------------

// 👉 Hosted backend URL. The site is served from the same origin as the API on
//    Render, so a relative '/api' works without hardcoding the domain. (Use a full
//    https://...onrender.com/api URL instead only if the frontend is hosted elsewhere.)
const PROD_API_BASE_URL = '/api';

const _host = (typeof location !== 'undefined' && location.hostname) || '';
const _isLocal = _host === 'localhost' || _host === '127.0.0.1' || _host === '' || _host === '0.0.0.0';

const API_CONFIG = {
  // Auto-selects: localhost backend when developing, your hosted backend in prod.
  API_BASE_URL: _isLocal
    ? 'http://localhost:5000/api'
    : (PROD_API_BASE_URL || 'http://localhost:5000/api'),

  // Master OTPs for development/testing
  MASTER_OTPS: ['271839', '492716', '580317', '634928', '705231'],

  // If true, bypass API failures and use local mock login (dev only!)
  DEV_BYPASS_AUTH: false, // Set to false to show OTP form
  DEV_USER_EMAIL: 'dev@local.test',
  DEV_USER_NAME: 'Dev User',
  DEV_USER_ROLE: 'admin',
  DEV_USER_ID: 'dev-user-0001',
  DEV_USER_BALANCE: 5000,
  DEV_USER_ACCOUNT_NUMBER: 'DE000000001', // Updated: Unique account number for dev user
};

// Helper function to make API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_CONFIG.API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

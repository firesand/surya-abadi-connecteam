import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initPWAFixes, getDeviceInfo } from './utils/pwaNavigationFix.js'
import { initIOSFixes } from './utils/mobileSafariFix.js'
import { createWhiteScreenRecovery } from './utils/whiteScreenDebug.js'
import { createMobileRecovery } from './utils/mobileWhiteScreenFix.js'
import { createProductionRecovery } from './utils/productionFix.js'
import { aggressiveProductionFix } from './utils/aggressiveProductionFix.js'
import { cspErrorHandler } from './utils/cspErrorHandler.js'

// Initialize PWA fixes including white screen detection
initPWAFixes();

// Initialize iOS-specific fixes
initIOSFixes();

// Initialize white screen recovery
createWhiteScreenRecovery();

// Initialize mobile recovery
createMobileRecovery();

// Initialize production recovery
createProductionRecovery();

// Initialize aggressive production fix
console.log('🚀 AGGRESSIVE: Initializing aggressive production fix...');

// Initialize CSP error handler
console.log('🔒 CSP: Initializing CSP error handler...');

// Log device info for debugging
const deviceInfo = getDeviceInfo();
console.log('Device Info:', deviceInfo);

// Add global error handler for debugging
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initPWAFixes, getDeviceInfo } from './utils/pwaNavigationFix.js'
import { initIOSFixes } from './utils/mobileSafariFix.js'
import { createWhiteScreenRecovery } from './utils/whiteScreenDebug.js'

// Initialize PWA fixes including white screen detection
initPWAFixes();

// Initialize iOS-specific fixes
initIOSFixes();

// Initialize white screen recovery
createWhiteScreenRecovery();

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

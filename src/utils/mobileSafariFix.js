// src/utils/mobileSafariFix.js
// Special fixes for iOS Safari and PWA issues

/**
 * Detect iOS Safari
 */
export const isIOSSafari = () => {
  const ua = window.navigator.userAgent;
  const iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
  const webkit = !!ua.match(/WebKit/i);
  const iOSSafari = iOS && webkit && !ua.match(/CriOS/i) && !ua.match(/FxiOS/i);
  return iOSSafari;
};

/**
 * Detect if running as iOS PWA
 */
export const isIOSPWA = () => {
  return window.navigator.standalone === true;
};

/**
 * Fix iOS viewport issues
 */
export const fixIOSViewport = () => {
  if (isIOSSafari() || isIOSPWA()) {
    // Prevent zoom on input focus
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport) {
      viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0';
    }
    
    // Fix 100vh issue on iOS
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
  }
};

/**
 * Fix iOS navigation issues
 */
export const iOSNavigate = (path) => {
  if (isIOSSafari() || isIOSPWA()) {
    // Use replace instead of href for better iOS compatibility
    const fullPath = path.startsWith('/') ? path : `/${path}`;
    const baseUrl = window.location.origin;
    
    // Add a small delay for iOS
    setTimeout(() => {
      try {
        // Try location.replace first (better for PWA)
        window.location.replace(`${baseUrl}${fullPath}`);
      } catch (e) {
        // Fallback to href
        window.location.href = `${baseUrl}${fullPath}`;
      }
    }, 100);
  } else {
    // Non-iOS navigation
    window.location.href = path;
  }
};

/**
 * Clear iOS Safari cache
 */
export const clearIOSCache = async () => {
  if (isIOSSafari() || isIOSPWA()) {
    console.log('Clearing iOS Safari cache...');
    
    try {
      // Clear caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      // Clear storage with iOS-specific handling
      try {
        localStorage.clear();
      } catch (e) {
        // iOS might throw in private mode
        console.warn('localStorage clear failed:', e);
      }
      
      try {
        sessionStorage.clear();
      } catch (e) {
        console.warn('sessionStorage clear failed:', e);
      }
      
      // Force service worker update on iOS
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let registration of registrations) {
          registration.update();
        }
      }
      
      return true;
    } catch (error) {
      console.error('iOS cache clear error:', error);
      return false;
    }
  }
  
  return false;
};

/**
 * Fix white screen on iOS
 */
export const fixIOSWhiteScreen = () => {
  if (isIOSSafari() || isIOSPWA()) {
    console.log('Checking for iOS white screen...');
    
    const checkAndFix = () => {
      const root = document.getElementById('root');
      const hasContent = root && root.children.length > 0;
      
      if (!hasContent) {
        console.log('iOS white screen detected!');
        
        // Try to force React to re-render
        const event = new Event('visibilitychange');
        document.dispatchEvent(event);
        
        // If still no content after 1 second, reload
        setTimeout(() => {
          const stillNoContent = !root || root.children.length === 0;
          if (stillNoContent) {
            console.log('Force reloading iOS page...');
            clearIOSCache().then(() => {
              window.location.reload(true);
            });
          }
        }, 1000);
      }
    };
    
    // Check multiple times for iOS
    setTimeout(checkAndFix, 2000);
    setTimeout(checkAndFix, 4000);
    setTimeout(checkAndFix, 6000);
  }
};

/**
 * Initialize all iOS fixes
 */
export const initIOSFixes = () => {
  if (isIOSSafari() || isIOSPWA()) {
    console.log('iOS Safari/PWA detected, applying fixes...');
    
    // Fix viewport
    fixIOSViewport();
    
    // Fix white screen
    window.addEventListener('load', () => {
      fixIOSWhiteScreen();
    });
    
    // Handle iOS-specific events
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        // Page was loaded from cache
        console.log('iOS page loaded from cache');
        window.location.reload();
      }
    });
    
    // Handle iOS PWA launch
    if (isIOSPWA()) {
      console.log('Running as iOS PWA');
      
      // Clear old cache on PWA launch
      clearIOSCache();
      
      // Add iOS PWA specific styles
      document.body.classList.add('ios-pwa');
    }
    
    // Log iOS info
    console.log('iOS Info:', {
      isIOSSafari: isIOSSafari(),
      isIOSPWA: isIOSPWA(),
      userAgent: navigator.userAgent,
      standalone: window.navigator.standalone,
      viewport: window.innerHeight + 'x' + window.innerWidth
    });
  }
};

// Auto-initialize on import
if (typeof window !== 'undefined') {
  initIOSFixes();
}

export default {
  isIOSSafari,
  isIOSPWA,
  fixIOSViewport,
  iOSNavigate,
  clearIOSCache,
  fixIOSWhiteScreen,
  initIOSFixes
};
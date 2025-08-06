// src/utils/pwaNavigationFix.js
// PWA Navigation Fix for Mobile/Standalone Mode

/**
 * Check if the app is running as a PWA (standalone mode)
 */
export const isPWA = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone ||
         document.referrer.includes('android-app://') ||
         window.location.href.includes('?mode=pwa');
};

/**
 * Check if the device is mobile
 */
export const isMobileDevice = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
};

/**
 * Safe navigation for PWA/Mobile
 * Uses location.href for mobile/PWA to avoid navigation issues
 */
export const pwaNavigate = (path) => {
  // Always use location.href for mobile/PWA
  if (isPWA() || isMobileDevice()) {
    // Add a small delay to ensure state is saved
    setTimeout(() => {
      // Ensure path starts with /
      const fullPath = path.startsWith('/') ? path : `/${path}`;
      // Use full URL for better compatibility
      const baseUrl = window.location.origin;
      window.location.href = `${baseUrl}${fullPath}`;
    }, 100);
  } else {
    // For desktop, check if navigate function exists
    if (window.navigateFunction) {
      window.navigateFunction(path);
    } else {
      // Fallback to location.href
      const fullPath = path.startsWith('/') ? path : `/${path}`;
      const baseUrl = window.location.origin;
      window.location.href = `${baseUrl}${fullPath}`;
    }
  }
};

/**
 * Clear PWA cache and storage
 */
export const clearPWACache = async () => {
  try {
    // Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => {
          console.log('Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }
    
    // Save critical data before clearing
    const criticalData = {
      appVersion: localStorage.getItem('appVersion'),
      deviceId: localStorage.getItem('deviceId')
    };
    
    // Clear storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Restore critical data
    Object.keys(criticalData).forEach(key => {
      if (criticalData[key]) {
        localStorage.setItem(key, criticalData[key]);
      }
    });
    
    // Update service worker
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (let registration of registrations) {
        await registration.unregister();
      }
      
      // Re-register service worker
      await navigator.serviceWorker.register('/sw.js');
    }
    
    console.log('PWA cache cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing PWA cache:', error);
    return false;
  }
};

/**
 * Fix white screen issue
 */
export const fixWhiteScreen = () => {
  const root = document.getElementById('root');
  const hasContent = root && root.children.length > 0 && root.textContent.trim().length > 0;
  
  if (!hasContent) {
    console.log('White screen detected, attempting fix...');
    
    // Try immediate fix
    clearPWACache().then(() => {
      window.location.reload(true);
    });
  }
};

/**
 * Initialize PWA fixes
 */
export const initPWAFixes = () => {
  if (isPWA() || isMobileDevice()) {
    console.log('PWA/Mobile mode detected, initializing fixes...');
    
    // Fix white screen on load
    window.addEventListener('load', () => {
      setTimeout(fixWhiteScreen, 3000);
    });
    
    // Handle navigation errors
    window.addEventListener('error', (e) => {
      if (e.message && e.message.includes('navigation')) {
        console.error('Navigation error:', e);
        window.location.reload();
      }
    });
    
    // Handle back button
    window.addEventListener('popstate', (e) => {
      const root = document.getElementById('root');
      if (!root || !root.children.length) {
        window.location.reload();
      }
    });
    
    // Monitor for white screen periodically
    let checkCount = 0;
    const maxChecks = 3;
    
    const checkInterval = setInterval(() => {
      const root = document.getElementById('root');
      const hasContent = root && root.children.length > 0;
      
      if (!hasContent && checkCount < maxChecks) {
        checkCount++;
        console.log(`White screen check #${checkCount}`);
        
        if (checkCount === maxChecks) {
          console.log('Persistent white screen detected, forcing reload...');
          clearInterval(checkInterval);
          fixWhiteScreen();
        }
      } else if (hasContent) {
        clearInterval(checkInterval);
      }
    }, 2000);
    
    // Clear interval after 10 seconds
    setTimeout(() => clearInterval(checkInterval), 10000);
  }
};

/**
 * Device detection helper
 */
export const getDeviceInfo = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
  return {
    isMobile: isMobileDevice(),
    isPWA: isPWA(),
    isIOS: /iphone|ipad|ipod/i.test(userAgent.toLowerCase()),
    isAndroid: /android/i.test(userAgent.toLowerCase()),
    userAgent: userAgent
  };
};

// Auto-initialize on import
if (typeof window !== 'undefined') {
  initPWAFixes();
}

export default {
  isPWA,
  isMobileDevice,
  pwaNavigate,
  clearPWACache,
  fixWhiteScreen,
  initPWAFixes,
  getDeviceInfo
};

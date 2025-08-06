// src/utils/cacheManager.js
// Cache management utility untuk PWA

export const clearAllCaches = async () => {
  console.log('🗑️ Clearing all caches...');
  
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log('Found caches:', cacheNames);
      
      const deletePromises = cacheNames.map(cacheName => {
        console.log('Deleting cache:', cacheName);
        return caches.delete(cacheName);
      });
      
      await Promise.all(deletePromises);
      console.log('✅ All caches cleared successfully');
      return true;
    } else {
      console.log('❌ Caches API not supported');
      return false;
    }
  } catch (error) {
    console.error('❌ Error clearing caches:', error);
    return false;
  }
};

export const clearStorage = () => {
  console.log('🗑️ Clearing storage...');
  
  try {
    // Clear localStorage
    localStorage.clear();
    console.log('✅ localStorage cleared');
    
    // Clear sessionStorage
    sessionStorage.clear();
    console.log('✅ sessionStorage cleared');
    
    // Clear cookies (if possible)
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    console.log('✅ cookies cleared');
    
    return true;
  } catch (error) {
    console.error('❌ Error clearing storage:', error);
    return false;
  }
};

export const forceReload = () => {
  console.log('🔄 Force reloading page...');
  
  try {
    // Clear everything first
    clearStorage();
    
    // Force reload
    window.location.reload(true);
    return true;
  } catch (error) {
    console.error('❌ Error force reloading:', error);
    return false;
  }
};

export const detectWhiteScreen = () => {
  const body = document.body;
  const root = document.getElementById('root');
  
  // Check for white screen conditions
  const isWhiteScreen = (
    body.children.length === 1 && 
    (!root || !root.children.length || !root.textContent.trim())
  );
  
  console.log('🔍 White screen detection:', {
    bodyChildren: body.children.length,
    rootExists: !!root,
    rootChildren: root?.children?.length || 0,
    rootText: root?.textContent?.trim() || '',
    isWhiteScreen
  });
  
  return isWhiteScreen;
};

export const fixWhiteScreen = async () => {
  console.log('🚨 White screen detected, applying fix...');
  
  try {
    // Clear all caches
    await clearAllCaches();
    
    // Clear storage
    clearStorage();
    
    // Force reload
    setTimeout(() => {
      forceReload();
    }, 1000);
    
    return true;
  } catch (error) {
    console.error('❌ Error fixing white screen:', error);
    return false;
  }
};

export const checkServiceWorker = async () => {
  console.log('🔍 Checking service worker...');
  
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (registration) {
        console.log('✅ Service worker found:', registration);
        return registration;
      } else {
        console.log('❌ No service worker found');
        return null;
      }
    } else {
      console.log('❌ Service worker not supported');
      return null;
    }
  } catch (error) {
    console.error('❌ Error checking service worker:', error);
    return null;
  }
};

export const unregisterServiceWorker = async () => {
  console.log('🗑️ Unregistering service worker...');
  
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (registration) {
        await registration.unregister();
        console.log('✅ Service worker unregistered');
        return true;
      } else {
        console.log('❌ No service worker to unregister');
        return false;
      }
    } else {
      console.log('❌ Service worker not supported');
      return false;
    }
  } catch (error) {
    console.error('❌ Error unregistering service worker:', error);
    return false;
  }
};

export const registerServiceWorker = async () => {
  console.log('📝 Registering service worker...');
  
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service worker registered:', registration);
      return registration;
    } else {
      console.log('❌ Service worker not supported');
      return null;
    }
  } catch (error) {
    console.error('❌ Error registering service worker:', error);
    return null;
  }
};

// Auto-fix white screen on page load
export const initWhiteScreenFix = () => {
  console.log('🚀 Initializing white screen fix...');
  
  // Check for white screen after 3 seconds
  setTimeout(() => {
    if (detectWhiteScreen()) {
      console.log('🚨 White screen detected on load');
      fixWhiteScreen();
    }
  }, 3000);
  
  // Check again after 10 seconds
  setTimeout(() => {
    if (detectWhiteScreen()) {
      console.log('🚨 White screen detected after 10s');
      fixWhiteScreen();
    }
  }, 10000);
};

// Export for browser console usage
if (typeof window !== 'undefined') {
  window.cacheManager = {
    clearAllCaches,
    clearStorage,
    forceReload,
    detectWhiteScreen,
    fixWhiteScreen,
    checkServiceWorker,
    unregisterServiceWorker,
    registerServiceWorker,
    initWhiteScreenFix
  };
  
  console.log('🔧 Cache manager loaded. Use window.cacheManager.fixWhiteScreen() to fix white screen issues.');
} 
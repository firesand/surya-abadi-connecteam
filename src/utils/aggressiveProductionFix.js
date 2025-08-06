// src/utils/aggressiveProductionFix.js
// AGGRESSIVE Production Fix - Bypasses all normal navigation

export const aggressiveProductionFix = {
  // Force immediate navigation without any checks
  forceNavigate: (url = '/') => {
    console.log('🚀 AGGRESSIVE: Force navigating to:', url);
    
    // Method 1: Direct replace (most aggressive)
    try {
      window.location.replace(url);
      return true;
    } catch (e) {
      console.warn('🚀 AGGRESSIVE Method 1 failed:', e);
    }
    
    // Method 2: Direct href
    try {
      window.location.href = url;
      return true;
    } catch (e) {
      console.warn('🚀 AGGRESSIVE Method 2 failed:', e);
    }
    
    // Method 3: Direct assign
    try {
      window.location.assign(url);
      return true;
    } catch (e) {
      console.warn('🚀 AGGRESSIVE Method 3 failed:', e);
    }
    
    // Method 4: Force reload
    try {
      window.location.reload(true);
      return true;
    } catch (e) {
      console.warn('🚀 AGGRESSIVE Method 4 failed:', e);
    }
    
    // Method 5: Nuclear option - clear everything and reload
    try {
      // Clear everything
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }
      localStorage.clear();
      sessionStorage.clear();
      
      // Force reload
      window.location.reload(true);
      return true;
    } catch (e) {
      console.warn('🚀 AGGRESSIVE Method 5 failed:', e);
    }
    
    return false;
  },
  
  // Force clear all caches and storage
  forceClearAll: () => {
    console.log('🚀 AGGRESSIVE: Force clearing all caches and storage...');
    
    try {
      // Clear all caches
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            console.log('🚀 AGGRESSIVE: Deleting cache:', name);
            caches.delete(name);
          });
        });
      }
      
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear all cookies
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
      
      // Clear service worker
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
          for(let registration of registrations) {
            registration.unregister();
          }
        });
      }
      
      console.log('🚀 AGGRESSIVE: All caches and storage cleared');
      return true;
    } catch (e) {
      console.error('🚀 AGGRESSIVE: Clear failed:', e);
      return false;
    }
  },
  
  // Force page reload with cache clearing
  forceReload: () => {
    console.log('🚀 AGGRESSIVE: Force reloading page...');
    
    // Clear everything first
    this.forceClearAll();
    
    // Force reload
    setTimeout(() => {
      window.location.reload(true);
    }, 100);
  },
  
  // Nuclear option - complete page reset
  nuclearReset: () => {
    console.log('🚀 AGGRESSIVE: Nuclear reset - complete page reset...');
    
    // Clear everything
    this.forceClearAll();
    
    // Force navigation to home
    setTimeout(() => {
      window.location.replace('/');
    }, 200);
  }
};

// Auto-initialize aggressive fix
if (typeof window !== 'undefined') {
  // Check if we're in production
  const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
  
  if (isProduction) {
    console.log('🚀 AGGRESSIVE: Production detected, initializing aggressive fix...');
    
    // Make aggressive fix available globally
    window.aggressiveFix = aggressiveProductionFix;
    
    // Auto-detect white screen and apply aggressive fix
    setTimeout(() => {
      const root = document.getElementById('root');
      const hasContent = root && root.children.length > 0;
      
      if (!hasContent) {
        console.warn('🚨 AGGRESSIVE: White screen detected in production, applying nuclear fix...');
        aggressiveProductionFix.nuclearReset();
      }
    }, 3000);
    
    // Also check after any navigation
    window.addEventListener('beforeunload', () => {
      console.log('🚀 AGGRESSIVE: Page unloading, checking for white screen...');
      const root = document.getElementById('root');
      const hasContent = root && root.children.length > 0;
      
      if (!hasContent) {
        console.warn('🚨 AGGRESSIVE: White screen detected during unload, applying fix...');
        aggressiveProductionFix.forceNavigate('/');
      }
    });
  }
  
  console.log('🚀 AGGRESSIVE: Aggressive production fix loaded. Use:');
  console.log('- window.aggressiveFix.forceNavigate(url)');
  console.log('- window.aggressiveFix.forceClearAll()');
  console.log('- window.aggressiveFix.forceReload()');
  console.log('- window.aggressiveFix.nuclearReset()');
} 
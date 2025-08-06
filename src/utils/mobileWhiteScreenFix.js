// src/utils/mobileWhiteScreenFix.js
// Mobile-specific white screen detection and recovery

export const detectMobileWhiteScreen = () => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  
  const detection = {
    timestamp: new Date().toISOString(),
    isMobile,
    isIOS,
    isAndroid,
    userAgent: navigator.userAgent,
    bodyChildren: document.body.children.length,
    rootExists: !!document.getElementById('root'),
    rootChildren: document.getElementById('root')?.children?.length || 0,
    isWhiteScreen: false,
    possibleCauses: []
  };
  
  // Mobile-specific white screen detection
  if (isMobile) {
    // Check for common mobile white screen conditions
    if (document.body.children.length === 1 && (!document.getElementById('root') || !document.getElementById('root').children.length)) {
      detection.isWhiteScreen = true;
      detection.possibleCauses.push('Empty root element on mobile');
    }
    
    if (document.body.textContent.trim() === '') {
      detection.isWhiteScreen = true;
      detection.possibleCauses.push('Empty body content on mobile');
    }
    
    // iOS-specific checks
    if (isIOS) {
      if (window.innerHeight === 0 || window.innerWidth === 0) {
        detection.isWhiteScreen = true;
        detection.possibleCauses.push('iOS viewport issue');
      }
    }
    
    // Android-specific checks
    if (isAndroid) {
      if (document.readyState !== 'complete') {
        detection.isWhiteScreen = true;
        detection.possibleCauses.push('Android page not fully loaded');
      }
    }
  }
  
  console.log('📱 Mobile white screen detection:', detection);
  return detection;
};

export const mobileNavigationMethods = [
  // Method 1: Direct location change
  () => {
    console.log('📱 Method 1: window.location.href');
    window.location.href = '/';
  },
  
  // Method 2: Replace current location
  () => {
    console.log('📱 Method 2: window.location.replace');
    window.location.replace('/');
  },
  
  // Method 3: Assign new location
  () => {
    console.log('📱 Method 3: window.location.assign');
    window.location.assign('/');
  },
  
  // Method 4: History API push
  () => {
    console.log('📱 Method 4: history.pushState');
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  },
  
  // Method 5: History API replace
  () => {
    console.log('📱 Method 5: history.replaceState');
    window.history.replaceState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  },
  
  // Method 6: Force reload
  () => {
    console.log('📱 Method 6: window.location.reload');
    window.location.reload();
  },
  
  // Method 7: Hard reload
  () => {
    console.log('📱 Method 7: window.location.reload(true)');
    window.location.reload(true);
  },
  
  // Method 8: iOS-specific reload
  () => {
    console.log('📱 Method 8: iOS-specific reload');
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      window.location.href = window.location.href;
    } else {
      window.location.reload();
    }
  }
];

export const tryMobileNavigation = async (targetUrl = '/') => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (!isMobile) {
    console.log('🖥️ Not mobile, using standard navigation');
    return false;
  }
  
  console.log('📱 Trying mobile navigation to:', targetUrl);
  
  // Update URL in methods
  const methods = mobileNavigationMethods.map(method => {
    return () => {
      const methodStr = method.toString();
      if (methodStr.includes('window.location.href')) {
        window.location.href = targetUrl;
      } else if (methodStr.includes('window.location.replace')) {
        window.location.replace(targetUrl);
      } else if (methodStr.includes('window.location.assign')) {
        window.location.assign(targetUrl);
      } else if (methodStr.includes('history.pushState')) {
        window.history.pushState({}, '', targetUrl);
        window.dispatchEvent(new PopStateEvent('popstate'));
      } else if (methodStr.includes('history.replaceState')) {
        window.history.replaceState({}, '', targetUrl);
        window.dispatchEvent(new PopStateEvent('popstate'));
      } else {
        method();
      }
    };
  });
  
  // Try each method with delay
  for (let i = 0; i < methods.length; i++) {
    try {
      console.log(`📱 Trying mobile navigation method ${i + 1}...`);
      await new Promise(resolve => setTimeout(resolve, 300)); // Wait between attempts
      methods[i]();
      console.log(`✅ Mobile navigation method ${i + 1} successful`);
      return true;
    } catch (error) {
      console.warn(`❌ Mobile navigation method ${i + 1} failed:`, error);
    }
  }
  
  console.error('❌ All mobile navigation methods failed');
  return false;
};

export const clearMobileCache = async () => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (!isMobile) {
    console.log('🖥️ Not mobile, skipping mobile cache clear');
    return;
  }
  
  console.log('📱 Clearing mobile cache...');
  
  try {
    // Clear browser caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        console.log('📱 Deleting cache:', name);
        await caches.delete(name);
      }
    }
    
    // Clear storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear cookies
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    // iOS-specific cache clearing
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      console.log('📱 iOS detected, clearing iOS-specific cache...');
      // iOS Safari cache clearing
      if ('webkit' in window && 'messageHandlers' in window.webkit) {
        try {
          window.webkit.messageHandlers.clearCache.postMessage({});
        } catch (e) {
          console.warn('📱 iOS cache clear failed:', e);
        }
      }
    }
    
    // Android-specific cache clearing
    if (/Android/.test(navigator.userAgent)) {
      console.log('📱 Android detected, clearing Android-specific cache...');
      // Android Chrome cache clearing
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            await registration.unregister();
          }
        } catch (e) {
          console.warn('📱 Android service worker clear failed:', e);
        }
      }
    }
    
    console.log('✅ Mobile cache cleared successfully');
    
  } catch (error) {
    console.error('❌ Mobile cache clear failed:', error);
  }
};

export const showMobileRecoveryUI = () => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (!isMobile) {
    console.log('🖥️ Not mobile, using standard recovery UI');
    return;
  }
  
  console.log('📱 Showing mobile recovery UI...');
  
  const recoveryDiv = document.createElement('div');
  recoveryDiv.id = 'mobile-white-screen-recovery';
  recoveryDiv.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 16px;
    padding: 20px;
  `;
  
  recoveryDiv.innerHTML = `
    <div style="background: white; color: black; padding: 20px; border-radius: 12px; max-width: 350px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
      <div style="font-size: 48px; margin-bottom: 16px;">📱</div>
      <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">Aplikasi Bermasalah</h2>
      <p style="margin: 0 0 20px 0; color: #666; line-height: 1.4;">
        Aplikasi mengalami masalah di perangkat mobile Anda. Silakan coba salah satu opsi di bawah:
      </p>
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <button onclick="window.mobileRecovery.clearCacheAndReload()" style="background: #3b82f6; color: white; padding: 12px 16px; border: none; border-radius: 8px; font-size: 16px; font-weight: 500; cursor: pointer;">
          Bersihkan Cache & Muat Ulang
        </button>
        <button onclick="window.location.href='/'" style="background: #10b981; color: white; padding: 12px 16px; border: none; border-radius: 8px; font-size: 16px; font-weight: 500; cursor: pointer;">
          Kembali ke Halaman Utama
        </button>
        <button onclick="window.location.href='/login'" style="background: #8b5cf6; color: white; padding: 12px 16px; border: none; border-radius: 8px; font-size: 16px; font-weight: 500; cursor: pointer;">
          Login Sekarang
        </button>
        <button onclick="document.getElementById('mobile-white-screen-recovery').remove()" style="background: #ef4444; color: white; padding: 8px 16px; border: none; border-radius: 8px; font-size: 14px; cursor: pointer;">
          Tutup
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(recoveryDiv);
};

export const createMobileRecovery = () => {
  const recovery = {
    detect: detectMobileWhiteScreen,
    navigate: tryMobileNavigation,
    clearCache: clearMobileCache,
    showUI: showMobileRecoveryUI,
    
    // Combined clear cache and reload
    clearCacheAndReload: async () => {
      console.log('📱 Clearing cache and reloading...');
      await clearMobileCache();
      setTimeout(() => {
        window.location.reload(true);
      }, 500);
    },
    
    // Auto-detect and fix
    autoDetectAndFix: () => {
      const detection = detectMobileWhiteScreen();
      if (detection.isWhiteScreen) {
        console.warn('📱 Mobile white screen detected, showing recovery UI');
        showMobileRecoveryUI();
      }
    }
  };
  
  // Auto-detect on page load for mobile
  if (typeof window !== 'undefined') {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Check for white screen after page load
      setTimeout(() => {
        recovery.autoDetectAndFix();
      }, 3000);
      
      // Also check after registration
      window.addEventListener('beforeunload', () => {
        console.log('📱 Page unloading, checking for white screen...');
        recovery.autoDetectAndFix();
      });
    }
  }
  
  return recovery;
};

// Auto-initialize on page load
if (typeof window !== 'undefined') {
  window.mobileRecovery = createMobileRecovery();
  
  console.log('📱 Mobile recovery tools loaded. Use:');
  console.log('- window.mobileRecovery.detect()');
  console.log('- window.mobileRecovery.navigate(url)');
  console.log('- window.mobileRecovery.clearCache()');
  console.log('- window.mobileRecovery.showUI()');
  console.log('- window.mobileRecovery.clearCacheAndReload()');
  console.log('- window.mobileRecovery.autoDetectAndFix()');
} 
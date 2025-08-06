// src/utils/productionFix.js
// Production-specific fixes for white screen issues

export const detectProductionEnvironment = () => {
  const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
  const isVercel = window.location.hostname.includes('vercel.app');
  const isHttps = window.location.protocol === 'https:';
  
  const environment = {
    isProduction,
    isVercel,
    isHttps,
    hostname: window.location.hostname,
    protocol: window.location.protocol,
    userAgent: navigator.userAgent
  };
  
  console.log('🌐 Production environment detected:', environment);
  return environment;
};

export const handleProductionNavigation = async (targetUrl = '/') => {
  const env = detectProductionEnvironment();
  
  if (env.isProduction) {
    console.log('🌐 Using production-specific navigation...');
    
    // Production navigation methods
    const productionMethods = [
      // Method 1: Direct replace (most reliable for production)
      () => {
        console.log('🌐 Method 1: window.location.replace');
        window.location.replace(targetUrl);
      },
      // Method 2: Direct href
      () => {
        console.log('🌐 Method 2: window.location.href');
        window.location.href = targetUrl;
      },
      // Method 3: Direct assign
      () => {
        console.log('🌐 Method 3: window.location.assign');
        window.location.assign(targetUrl);
      },
      // Method 4: History replace
      () => {
        console.log('🌐 Method 4: history.replaceState');
        window.history.replaceState({}, '', targetUrl);
        window.dispatchEvent(new PopStateEvent('popstate'));
      },
      // Method 5: History push
      () => {
        console.log('🌐 Method 5: history.pushState');
        window.history.pushState({}, '', targetUrl);
        window.dispatchEvent(new PopStateEvent('popstate'));
      },
      // Method 6: Force reload
      () => {
        console.log('🌐 Method 6: window.location.reload');
        window.location.reload();
      },
      // Method 7: Hard reload
      () => {
        console.log('🌐 Method 7: window.location.reload(true)');
        window.location.reload(true);
      }
    ];
    
    // Try each method with delay
    for (let i = 0; i < productionMethods.length; i++) {
      try {
        console.log(`🌐 Trying production navigation method ${i + 1}...`);
        await new Promise(resolve => setTimeout(resolve, 300)); // Wait between attempts
        productionMethods[i]();
        console.log(`✅ Production navigation method ${i + 1} successful`);
        return true;
      } catch (error) {
        console.warn(`❌ Production navigation method ${i + 1} failed:`, error);
      }
    }
    
    // If all methods fail, force reload
    console.log('🌐 All production navigation methods failed, forcing reload...');
    window.location.reload(true);
    return false;
  } else {
    console.log('🖥️ Not production, using standard navigation');
    return false;
  }
};

export const clearProductionCache = async () => {
  const env = detectProductionEnvironment();
  
  if (env.isProduction) {
    console.log('🌐 Clearing production cache...');
    
    try {
      // Clear browser caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const name of cacheNames) {
          console.log('🌐 Deleting cache:', name);
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
      
      // Vercel-specific cache clearing
      if (env.isVercel) {
        console.log('🌐 Vercel detected, clearing Vercel-specific cache...');
        
        // Clear Vercel edge cache
        try {
          await fetch('/api/clear-cache', { method: 'POST' });
        } catch (e) {
          console.warn('🌐 Vercel cache clear failed:', e);
        }
      }
      
      console.log('✅ Production cache cleared successfully');
      
    } catch (error) {
      console.error('❌ Production cache clear failed:', error);
    }
  } else {
    console.log('🖥️ Not production, skipping production cache clear');
  }
};

export const showProductionRecoveryUI = () => {
  const env = detectProductionEnvironment();
  
  if (!env.isProduction) {
    console.log('🖥️ Not production, using standard recovery UI');
    return;
  }
  
  console.log('🌐 Showing production recovery UI...');
  
  const recoveryDiv = document.createElement('div');
  recoveryDiv.id = 'production-white-screen-recovery';
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
    <div style="background: white; color: black; padding: 20px; border-radius: 12px; max-width: 400px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
      <div style="font-size: 48px; margin-bottom: 16px;">🌐</div>
      <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">Aplikasi Bermasalah di Production</h2>
      <p style="margin: 0 0 20px 0; color: #666; line-height: 1.4;">
        Aplikasi mengalami masalah di environment production. Silakan coba salah satu opsi di bawah:
      </p>
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <button onclick="window.productionRecovery.clearCacheAndReload()" style="background: #3b82f6; color: white; padding: 12px 16px; border: none; border-radius: 8px; font-size: 16px; font-weight: 500; cursor: pointer;">
          Bersihkan Cache & Muat Ulang
        </button>
        <button onclick="window.location.href='/'" style="background: #10b981; color: white; padding: 12px 16px; border: none; border-radius: 8px; font-size: 16px; font-weight: 500; cursor: pointer;">
          Kembali ke Halaman Utama
        </button>
        <button onclick="window.location.href='/login'" style="background: #8b5cf6; color: white; padding: 12px 16px; border: none; border-radius: 8px; font-size: 16px; font-weight: 500; cursor: pointer;">
          Login Sekarang
        </button>
        <button onclick="document.getElementById('production-white-screen-recovery').remove()" style="background: #ef4444; color: white; padding: 8px 16px; border: none; border-radius: 8px; font-size: 14px; cursor: pointer;">
          Tutup
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(recoveryDiv);
};

export const createProductionRecovery = () => {
  const recovery = {
    detect: detectProductionEnvironment,
    navigate: handleProductionNavigation,
    clearCache: clearProductionCache,
    showUI: showProductionRecoveryUI,
    
    // Combined clear cache and reload
    clearCacheAndReload: async () => {
      console.log('🌐 Clearing production cache and reloading...');
      await clearProductionCache();
      setTimeout(() => {
        window.location.reload(true);
      }, 500);
    },
    
    // Auto-detect and fix
    autoDetectAndFix: () => {
      const env = detectProductionEnvironment();
      if (env.isProduction) {
        console.log('🌐 Production detected, setting up auto-fix...');
        
        // Monitor for white screen in production
        setTimeout(() => {
          const root = document.getElementById('root');
          const hasContent = root && root.children.length > 0;
          
          if (!hasContent) {
            console.warn('🚨 Production white screen detected, showing recovery UI');
            showProductionRecoveryUI();
          }
        }, 5000);
      }
    }
  };
  
  // Auto-detect on page load for production
  if (typeof window !== 'undefined') {
    const env = detectProductionEnvironment();
    
    if (env.isProduction) {
      // Check for white screen after page load
      setTimeout(() => {
        recovery.autoDetectAndFix();
      }, 3000);
      
      // Also check after registration
      window.addEventListener('beforeunload', () => {
        console.log('🌐 Page unloading in production, checking for white screen...');
        recovery.autoDetectAndFix();
      });
    }
  }
  
  return recovery;
};

// Auto-initialize on page load
if (typeof window !== 'undefined') {
  window.productionRecovery = createProductionRecovery();
  
  console.log('🌐 Production recovery tools loaded. Use:');
  console.log('- window.productionRecovery.detect()');
  console.log('- window.productionRecovery.navigate(url)');
  console.log('- window.productionRecovery.clearCache()');
  console.log('- window.productionRecovery.showUI()');
  console.log('- window.productionRecovery.clearCacheAndReload()');
  console.log('- window.productionRecovery.autoDetectAndFix()');
} 
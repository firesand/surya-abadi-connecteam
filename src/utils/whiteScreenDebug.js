// src/utils/whiteScreenDebug.js
// Comprehensive debugging utility untuk white screen issues

export const detectWhiteScreen = () => {
  const body = document.body;
  const root = document.getElementById('root');
  
  const detection = {
    timestamp: new Date().toISOString(),
    bodyChildren: body.children.length,
    rootExists: !!root,
    rootChildren: root?.children?.length || 0,
    rootText: root?.textContent?.trim() || '',
    bodyText: body.textContent?.trim() || '',
    isWhiteScreen: false,
    possibleCauses: []
  };
  
  // Check for white screen conditions
  if (body.children.length === 1 && (!root || !root.children.length || !root.textContent.trim())) {
    detection.isWhiteScreen = true;
    detection.possibleCauses.push('Empty root element');
  }
  
  if (body.textContent.trim() === '') {
    detection.isWhiteScreen = true;
    detection.possibleCauses.push('Empty body content');
  }
  
  if (!root) {
    detection.isWhiteScreen = true;
    detection.possibleCauses.push('Root element not found');
  }
  
  if (root && root.children.length === 0) {
    detection.isWhiteScreen = true;
    detection.possibleCauses.push('Root has no children');
  }
  
  console.log('🔍 White screen detection:', detection);
  return detection;
};

export const analyzeWhiteScreenCauses = () => {
  const analysis = {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    errors: [],
    warnings: [],
    issues: []
  };
  
  // Check for console errors
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.error = (...args) => {
    analysis.errors.push(args.join(' '));
    originalError.apply(console, args);
  };
  
  console.warn = (...args) => {
    analysis.warnings.push(args.join(' '));
    originalWarn.apply(console, args);
  };
  
  // Check for React errors
  if (window.React && window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
    analysis.issues.push('React internal error detected');
  }
  
  // Check for navigation issues
  if (window.location.pathname === '/register') {
    analysis.issues.push('User on registration page');
  }
  
  // Check for authentication state
  if (window.firebase && window.firebase.auth) {
    try {
      const currentUser = window.firebase.auth().currentUser;
      analysis.issues.push(`Auth state: ${currentUser ? 'logged in' : 'not logged in'}`);
    } catch (error) {
      analysis.issues.push(`Auth error: ${error.message}`);
    }
  }
  
  // Check for service worker issues
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then(registration => {
      if (registration) {
        analysis.issues.push('Service worker active');
      } else {
        analysis.issues.push('No service worker');
      }
    }).catch(error => {
      analysis.issues.push(`Service worker error: ${error.message}`);
    });
  }
  
  console.log('📊 White screen analysis:', analysis);
  return analysis;
};

export const forceNavigation = (url) => {
  console.log('🔄 Force navigation to:', url);
  
  const methods = [
    () => window.location.href = url,
    () => window.location.replace(url),
    () => window.location.assign(url),
    () => window.history.pushState({}, '', url),
    () => window.location.reload()
  ];
  
  for (let i = 0; i < methods.length; i++) {
    try {
      methods[i]();
      console.log(`✅ Navigation method ${i + 1} successful`);
      return true;
    } catch (error) {
      console.warn(`❌ Navigation method ${i + 1} failed:`, error);
    }
  }
  
  console.error('❌ All navigation methods failed');
  return false;
};

export const clearAndReload = () => {
  console.log('🗑️ Clearing everything and reloading...');
  
  try {
    // Clear caches
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          console.log('🗑️ Deleting cache:', name);
          caches.delete(name);
        });
      });
    }
    
    // Clear storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear cookies
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    // Force reload
    window.location.reload(true);
    
  } catch (error) {
    console.error('❌ Clear and reload failed:', error);
    // Last resort
    window.location.href = '/';
  }
};

export const checkReactApp = () => {
  const check = {
    reactLoaded: typeof React !== 'undefined',
    reactDOMLoaded: typeof ReactDOM !== 'undefined',
    rootElement: document.getElementById('root'),
    appRendered: false,
    errors: []
  };
  
  try {
    // Check if React app is rendered
    const root = document.getElementById('root');
    if (root && root.children.length > 0) {
      check.appRendered = true;
    }
    
    // Check for React errors
    if (window.React && window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
      const internal = window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
      if (internal.ReactCurrentOwner && internal.ReactCurrentOwner.current) {
        check.errors.push('React internal error detected');
      }
    }
    
  } catch (error) {
    check.errors.push(error.message);
  }
  
  console.log('⚛️ React app check:', check);
  return check;
};

export const monitorWhiteScreen = (duration = 10000) => {
  console.log('👀 Starting white screen monitoring for', duration, 'ms');
  
  const startTime = Date.now();
  const checks = [];
  
  const interval = setInterval(() => {
    const check = detectWhiteScreen();
    check.timeSinceStart = Date.now() - startTime;
    checks.push(check);
    
    if (check.isWhiteScreen) {
      console.warn('🚨 White screen detected at', check.timeSinceStart, 'ms');
      
      // Try to fix
      setTimeout(() => {
        if (detectWhiteScreen().isWhiteScreen) {
          console.error('🚨 White screen persists, attempting fix...');
          clearAndReload();
        }
      }, 2000);
    }
    
    if (Date.now() - startTime > duration) {
      clearInterval(interval);
      console.log('✅ White screen monitoring completed');
      console.log('📊 Monitoring results:', checks);
    }
  }, 1000);
  
  return interval;
};

export const createWhiteScreenRecovery = () => {
  const recovery = {
    detect: detectWhiteScreen,
    analyze: analyzeWhiteScreenCauses,
    navigate: forceNavigation,
    clear: clearAndReload,
    checkReact: checkReactApp,
    monitor: monitorWhiteScreen
  };
  
  // Auto-detect white screen on page load
  setTimeout(() => {
    const detection = detectWhiteScreen();
    if (detection.isWhiteScreen) {
      console.warn('🚨 White screen detected on page load');
      
      // Show recovery UI
      showRecoveryUI();
    }
  }, 3000);
  
  return recovery;
};

const showRecoveryUI = () => {
  const recoveryDiv = document.createElement('div');
  recoveryDiv.id = 'white-screen-recovery';
  recoveryDiv.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    color: white;
    font-family: Arial, sans-serif;
  `;
  
  recoveryDiv.innerHTML = `
    <div style="background: white; color: black; padding: 20px; border-radius: 8px; max-width: 400px; text-align: center;">
      <h2>🚨 Aplikasi Bermasalah</h2>
      <p>Aplikasi mengalami masalah. Silakan coba salah satu opsi di bawah:</p>
      <div style="margin: 20px 0;">
        <button onclick="window.whiteScreenRecovery.clear()" style="background: #3b82f6; color: white; padding: 10px 20px; border: none; border-radius: 4px; margin: 5px; cursor: pointer;">
          Bersihkan & Muat Ulang
        </button>
        <button onclick="window.location.href='/'" style="background: #10b981; color: white; padding: 10px 20px; border: none; border-radius: 4px; margin: 5px; cursor: pointer;">
          Kembali ke Halaman Utama
        </button>
        <button onclick="window.location.href='/login'" style="background: #3b82f6; color: white; padding: 10px 20px; border: none; border-radius: 4px; margin: 5px; cursor: pointer;">
          Login Sekarang
        </button>
      </div>
      <button onclick="document.getElementById('white-screen-recovery').remove()" style="background: #ef4444; color: white; padding: 5px 10px; border: none; border-radius: 4px; cursor: pointer;">
        Tutup
      </button>
    </div>
  `;
  
  document.body.appendChild(recoveryDiv);
};

// Auto-initialize on page load
if (typeof window !== 'undefined') {
  window.whiteScreenRecovery = createWhiteScreenRecovery();
  
  console.log('🔧 White screen recovery tools loaded. Use:');
  console.log('- window.whiteScreenRecovery.detect()');
  console.log('- window.whiteScreenRecovery.analyze()');
  console.log('- window.whiteScreenRecovery.navigate(url)');
  console.log('- window.whiteScreenRecovery.clear()');
  console.log('- window.whiteScreenRecovery.checkReact()');
  console.log('- window.whiteScreenRecovery.monitor(duration)');
} 
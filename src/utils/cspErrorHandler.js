// src/utils/cspErrorHandler.js
// Global CSP Error Handler

export const cspErrorHandler = {
  // Check if error is CSP-related
  isCSPError: (error) => {
    if (!error) return false;
    
    const errorMessage = error.message || error.toString();
    const errorCode = error.code || '';
    
    return (
      errorMessage.includes('CSP') ||
      errorMessage.includes('Content Security Policy') ||
      errorMessage.includes('firebasestorage.googleapis.com') ||
      errorMessage.includes('Refused to connect') ||
      errorMessage.includes('violates the following Content Security Policy') ||
      errorCode === 'storage/unauthorized' ||
      errorCode === 'storage/retry-limit-exceeded'
    );
  },
  
  // Handle CSP errors gracefully
  handleCSPError: (error, context = 'unknown') => {
    console.warn(`🚫 CSP Error in ${context}:`, error);
    
    if (cspErrorHandler.isCSPError(error)) {
      console.log('🔒 CSP violation detected, applying graceful degradation');
      
      // Log CSP violation for monitoring
      const cspViolation = {
        timestamp: new Date().toISOString(),
        context: context,
        error: error.message || error.toString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      };
      
      console.log('📊 CSP Violation Log:', cspViolation);
      
      // Store CSP violation in localStorage for debugging
      try {
        const existingViolations = JSON.parse(localStorage.getItem('cspViolations') || '[]');
        existingViolations.push(cspViolation);
        localStorage.setItem('cspViolations', JSON.stringify(existingViolations.slice(-10))); // Keep last 10
      } catch (e) {
        console.warn('Failed to log CSP violation:', e);
      }
    }
    
    return {
      isCSPError: cspErrorHandler.isCSPError(error),
      handled: true,
      shouldContinue: true // Always continue with graceful degradation
    };
  },
  
  // Wrap Firebase Storage operations with CSP error handling
  wrapStorageOperation: async (operation, fallback = null) => {
    try {
      return await operation();
    } catch (error) {
      const cspResult = cspErrorHandler.handleCSPError(error, 'storage-operation');
      
      if (cspResult.isCSPError) {
        console.log('🔄 CSP error in storage operation, using fallback');
        return fallback;
      }
      
      // Re-throw non-CSP errors
      throw error;
    }
  },
  
  // Check CSP status
  checkCSPStatus: () => {
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    const isVercel = window.location.hostname.includes('vercel.app');
    const isHttps = window.location.protocol === 'https:';
    
    const cspStatus = {
      isProduction,
      isVercel,
      isHttps,
      hostname: window.location.hostname,
      protocol: window.location.protocol,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
    
    console.log('🔍 CSP Status Check:', cspStatus);
    return cspStatus;
  },
  
  // Test Firebase Storage access
  testFirebaseStorage: async () => {
    try {
      const response = await fetch('https://firebasestorage.googleapis.com/v0/b/suryaabadi-connecteam.firebasestorage.app/o');
      console.log('✅ Firebase Storage accessible:', response.status);
      return { accessible: true, status: response.status };
    } catch (error) {
      console.error('❌ Firebase Storage blocked:', error);
      return { accessible: false, error: error.message };
    }
  },
  
  // Get CSP violations from localStorage
  getCSPViolations: () => {
    try {
      return JSON.parse(localStorage.getItem('cspViolations') || '[]');
    } catch (e) {
      console.warn('Failed to get CSP violations:', e);
      return [];
    }
  },
  
  // Clear CSP violations from localStorage
  clearCSPViolations: () => {
    try {
      localStorage.removeItem('cspViolations');
      console.log('🧹 CSP violations cleared');
    } catch (e) {
      console.warn('Failed to clear CSP violations:', e);
    }
  }
};

// Auto-initialize CSP error handler
if (typeof window !== 'undefined') {
  // Make CSP error handler available globally
  window.cspErrorHandler = cspErrorHandler;
  
  // Check CSP status on page load
  const cspStatus = cspErrorHandler.checkCSPStatus();
  
  if (cspStatus.isProduction) {
    console.log('🌐 Production environment detected, CSP error handling enabled');
    
    // Test Firebase Storage access in production
    setTimeout(() => {
      cspErrorHandler.testFirebaseStorage();
    }, 2000);
  }
  
  console.log('🔒 CSP Error Handler loaded. Use:');
  console.log('- window.cspErrorHandler.isCSPError(error)');
  console.log('- window.cspErrorHandler.handleCSPError(error, context)');
  console.log('- window.cspErrorHandler.wrapStorageOperation(operation, fallback)');
  console.log('- window.cspErrorHandler.checkCSPStatus()');
  console.log('- window.cspErrorHandler.testFirebaseStorage()');
  console.log('- window.cspErrorHandler.getCSPViolations()');
  console.log('- window.cspErrorHandler.clearCSPViolations()');
} 
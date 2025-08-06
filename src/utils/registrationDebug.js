// src/utils/registrationDebug.js
// Comprehensive debugging utility untuk registration issues

export const debugRegistrationProcess = async () => {
  console.log('🔍 Starting registration debug process...');
  
  const debugInfo = {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    online: navigator.onLine,
    cookieEnabled: navigator.cookieEnabled,
    javaEnabled: navigator.javaEnabled(),
    screenResolution: `${screen.width}x${screen.height}`,
    viewportSize: `${window.innerWidth}x${window.innerHeight}`,
    localStorage: typeof localStorage !== 'undefined',
    sessionStorage: typeof sessionStorage !== 'undefined',
    caches: typeof caches !== 'undefined',
    serviceWorker: typeof navigator.serviceWorker !== 'undefined'
  };

  console.log('📊 Debug Info:', debugInfo);

  // Test Firebase connection
  try {
    const { auth, db, storage } = await import('../config/firebase');
    console.log('✅ Firebase imports successful');
    
    // Test auth
    const currentUser = auth.currentUser;
    console.log('👤 Current user:', currentUser ? currentUser.email : 'None');
    
    // Test Firestore
    const testDoc = await db.collection('test').doc('debug').get();
    console.log('📄 Firestore connection:', testDoc.exists ? 'OK' : 'No test doc');
    
    // Test Storage
    const testRef = storage.ref('test/debug.txt');
    console.log('📦 Storage connection: OK');
    
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
  }

  // Test geolocation
  try {
    const { getCurrentLocation } = await import('./geolocation');
    const location = await getCurrentLocation();
    console.log('📍 Geolocation test:', location);
  } catch (error) {
    console.error('❌ Geolocation failed:', error);
  }

  // Test cache status
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log('🗑️ Cache names:', cacheNames);
    }
  } catch (error) {
    console.error('❌ Cache check failed:', error);
  }

  // Test service worker
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      console.log('🔧 Service worker:', registration ? 'Active' : 'None');
    }
  } catch (error) {
    console.error('❌ Service worker check failed:', error);
  }

  return debugInfo;
};

export const simulateRegistration = async (testData) => {
  console.log('🧪 Simulating registration process...');
  
  const steps = [
    'Creating Firebase user',
    'Uploading photo',
    'Creating user document',
    'Creating registration request',
    'Signing out',
    'Navigating to login'
  ];

  for (let i = 0; i < steps.length; i++) {
    console.log(`Step ${i + 1}/${steps.length}: ${steps[i]}`);
    
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate potential error
    if (Math.random() < 0.1) { // 10% chance of error
      throw new Error(`Simulated error at step: ${steps[i]}`);
    }
  }
  
  console.log('✅ Registration simulation completed successfully');
};

export const checkRegistrationStatus = async (userId) => {
  console.log('🔍 Checking registration status for:', userId);
  
  try {
    const { db } = await import('../config/firebase');
    
    // Check user document
    const userDoc = await db.collection('users').doc(userId).get();
    console.log('👤 User document:', userDoc.exists ? userDoc.data() : 'Not found');
    
    // Check registration request
    const regDoc = await db.collection('registrationRequests').doc(userId).get();
    console.log('📋 Registration request:', regDoc.exists ? regDoc.data() : 'Not found');
    
    return {
      userExists: userDoc.exists,
      registrationExists: regDoc.exists,
      userData: userDoc.exists ? userDoc.data() : null,
      registrationData: regDoc.exists ? regDoc.data() : null
    };
  } catch (error) {
    console.error('❌ Status check failed:', error);
    return { error: error.message };
  }
};

export const clearRegistrationData = async (userId) => {
  console.log('🗑️ Clearing registration data for:', userId);
  
  try {
    const { auth, db, storage } = await import('../config/firebase');
    
    // Delete user document
    await db.collection('users').doc(userId).delete();
    console.log('✅ User document deleted');
    
    // Delete registration request
    await db.collection('registrationRequests').doc(userId).delete();
    console.log('✅ Registration request deleted');
    
    // Delete user photos
    const photoRefs = await storage.ref(`profiles/${userId}`).listAll();
    await Promise.all(photoRefs.items.map(ref => ref.delete()));
    console.log('✅ User photos deleted');
    
    // Delete Firebase user
    const user = auth.currentUser;
    if (user && user.uid === userId) {
      await user.delete();
      console.log('✅ Firebase user deleted');
    }
    
    return { success: true };
  } catch (error) {
    console.error('❌ Clear data failed:', error);
    return { error: error.message };
  }
};

export const testNetworkConnectivity = async () => {
  console.log('🌐 Testing network connectivity...');
  
  const tests = [
    {
      name: 'Firebase Auth',
      url: 'https://identitytoolkit.googleapis.com',
      timeout: 5000
    },
    {
      name: 'Firestore',
      url: 'https://firestore.googleapis.com',
      timeout: 5000
    },
    {
      name: 'Storage',
      url: 'https://storage.googleapis.com',
      timeout: 5000
    }
  ];

  const results = [];

  for (const test of tests) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), test.timeout);
      
      const response = await fetch(test.url, {
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      results.push({ name: test.name, status: 'OK', response: response.status });
    } catch (error) {
      results.push({ name: test.name, status: 'FAILED', error: error.message });
    }
  }

  console.log('📊 Network test results:', results);
  return results;
};

export const getEnvironmentInfo = () => {
  return {
    nodeEnv: process.env.NODE_ENV,
    firebaseConfig: {
      apiKey: process.env.VITE_FIREBASE_API_KEY ? 'SET' : 'NOT SET',
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN ? 'SET' : 'NOT SET',
      projectId: process.env.VITE_FIREBASE_PROJECT_ID ? 'SET' : 'NOT SET',
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET ? 'SET' : 'NOT SET',
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? 'SET' : 'NOT SET',
      appId: process.env.VITE_FIREBASE_APP_ID ? 'SET' : 'NOT SET'
    },
    buildTime: process.env.VITE_BUILD_TIME || 'Unknown',
    version: process.env.VITE_APP_VERSION || 'Unknown'
  };
};

// Auto-run debug on page load in development
if (process.env.NODE_ENV === 'development') {
  window.debugRegistration = {
    debugProcess: debugRegistrationProcess,
    simulateRegistration,
    checkStatus: checkRegistrationStatus,
    clearData: clearRegistrationData,
    testNetwork: testNetworkConnectivity,
    getEnvInfo: getEnvironmentInfo
  };
  
  console.log('🔧 Registration debug tools available. Use:');
  console.log('- window.debugRegistration.debugProcess()');
  console.log('- window.debugRegistration.simulateRegistration()');
  console.log('- window.debugRegistration.checkStatus(userId)');
  console.log('- window.debugRegistration.clearData(userId)');
  console.log('- window.debugRegistration.testNetwork()');
  console.log('- window.debugRegistration.getEnvInfo()');
} 
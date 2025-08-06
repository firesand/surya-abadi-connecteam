// src/config/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Validate config
if (!firebaseConfig.apiKey) {
  console.error('Firebase configuration is missing. Please check your .env.local file');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize storage with error handling
let storage;
try {
  storage = getStorage(app);
  console.log('✅ Firebase Storage initialized successfully');
} catch (storageError) {
  console.warn('⚠️ Firebase Storage initialization failed:', storageError);
  // Create a mock storage object for graceful degradation
  storage = {
    app: app,
    bucket: firebaseConfig.storageBucket,
    // Mock methods that return rejected promises
    ref: () => Promise.reject(new Error('Storage not available')),
    uploadBytes: () => Promise.reject(new Error('Storage not available')),
    getDownloadURL: () => Promise.reject(new Error('Storage not available'))
  };
}

export { storage };

// Office configuration
export const OFFICE_CONFIG = {
  lat: parseFloat(import.meta.env.VITE_OFFICE_LAT) || -6.3693,
  lng: parseFloat(import.meta.env.VITE_OFFICE_LNG) || 106.8289,
  radius: parseInt(import.meta.env.VITE_OFFICE_RADIUS) || 50
};

export default app;

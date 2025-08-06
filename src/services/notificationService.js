// src/services/notificationService.js
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Notification System Service
 * Handles app update notifications and user preferences
 */

// Initialize Firestore collections for notifications
export const initializeNotificationSystem = async () => {
  try {
    // Initialize appConfig/version if it doesn't exist
    const versionDoc = await getDoc(doc(db, 'appConfig', 'version'));
    if (!versionDoc.exists()) {
      await setDoc(doc(db, 'appConfig', 'version'), {
        latest: '1.0.0',
        previous: '1.0.0',
        updatedAt: new Date(),
        updateMessage: 'Initial version',
        features: ['Initial release'],
        forcedUpdate: false
      });
      console.log('App version config initialized');
    }

    // Initialize global notifications
    const globalNotifDoc = await getDoc(doc(db, 'notifications', 'global'));
    if (!globalNotifDoc.exists()) {
      await setDoc(doc(db, 'notifications', 'global'), {
        active: false,
        type: 'update',
        title: '',
        message: '',
        timestamp: new Date(),
        forced: false,
        features: [],
        targetUsers: 'all'
      });
      console.log('Global notifications initialized');
    }

    console.log('Notification system initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize notification system:', error);
    return false;
  }
};

// Get current app version
export const getCurrentVersion = async () => {
  try {
    const versionDoc = await getDoc(doc(db, 'appConfig', 'version'));
    if (versionDoc.exists()) {
      return versionDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Failed to get current version:', error);
    return null;
  }
};

// Update app version
export const updateAppVersion = async (newVersion, updateMessage, features = [], forced = false) => {
  try {
    const currentVersion = await getCurrentVersion();
    
    await setDoc(doc(db, 'appConfig', 'version'), {
      latest: newVersion,
      previous: currentVersion?.latest || '1.0.0',
      updatedAt: new Date(),
      updateMessage: updateMessage,
      features: features,
      forcedUpdate: forced
    });

    // Send global notification
    await setDoc(doc(db, 'notifications', 'global'), {
      active: true,
      type: 'update',
      title: 'App Update Available',
      message: updateMessage,
      timestamp: new Date(),
      forced: forced,
      features: features,
      targetUsers: 'all'
    });

    console.log('App version updated successfully');
    return true;
  } catch (error) {
    console.error('Failed to update app version:', error);
    return false;
  }
};

// Get user notification preferences
export const getUserNotificationPreferences = (userId) => {
  try {
    const prefs = localStorage.getItem('updatePrefs');
    if (prefs) {
      return JSON.parse(prefs);
    }
    return {
      autoUpdate: true,
      showNotifications: true,
      updateCheckInterval: 5
    };
  } catch (error) {
    console.error('Failed to get user preferences:', error);
    return {
      autoUpdate: true,
      showNotifications: true,
      updateCheckInterval: 5
    };
  }
};

// Save user notification preferences
export const saveUserNotificationPreferences = (userId, preferences) => {
  try {
    localStorage.setItem('updatePrefs', JSON.stringify(preferences));
    return true;
  } catch (error) {
    console.error('Failed to save user preferences:', error);
    return false;
  }
};

// Log update action
export const logUpdateAction = async (userId, fromVersion, toVersion, method = 'manual') => {
  try {
    await setDoc(doc(db, 'updateLogs', `${userId}_${Date.now()}`), {
      userId: userId,
      fromVersion: fromVersion,
      toVersion: toVersion,
      timestamp: new Date(),
      method: method
    });
    return true;
  } catch (error) {
    console.error('Failed to log update action:', error);
    return false;
  }
};

// Get update statistics
export const getUpdateStatistics = async () => {
  try {
    const versionDoc = await getDoc(doc(db, 'appConfig', 'version'));
    if (versionDoc.exists()) {
      const versionData = versionDoc.data();
      return {
        currentVersion: versionData.latest,
        lastUpdate: versionData.updatedAt,
        updateMessage: versionData.updateMessage,
        features: versionData.features || []
      };
    }
    return null;
  } catch (error) {
    console.error('Failed to get update statistics:', error);
    return null;
  }
};

// Check if update is available
export const checkForUpdates = async (currentVersion) => {
  try {
    const versionDoc = await getDoc(doc(db, 'appConfig', 'version'));
    if (versionDoc.exists()) {
      const versionData = versionDoc.data();
      return {
        updateAvailable: versionData.latest !== currentVersion,
        latestVersion: versionData.latest,
        updateMessage: versionData.updateMessage,
        features: versionData.features || [],
        forcedUpdate: versionData.forcedUpdate || false
      };
    }
    return { updateAvailable: false };
  } catch (error) {
    console.error('Failed to check for updates:', error);
    return { updateAvailable: false };
  }
};

export default {
  initializeNotificationSystem,
  getCurrentVersion,
  updateAppVersion,
  getUserNotificationPreferences,
  saveUserNotificationPreferences,
  logUpdateAction,
  getUpdateStatistics,
  checkForUpdates
}; 
// src/services/adminPasswordReset.js
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Admin password reset service
 * Allows admins to reset user passwords manually
 */

/**
 * Get user by email for admin password reset
 */
export const getUserByEmail = async (email) => {
  try {
    // Note: This is a simplified approach. In a real app, you might want to
    // create an index on email field or use a different approach
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { success: false, message: 'User tidak ditemukan' };
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    return {
      success: true,
      user: {
        id: userDoc.id,
        ...userData
      }
    };
  } catch (error) {
    console.error('Get user by email error:', error);
    return { success: false, message: 'Terjadi kesalahan saat mencari user' };
  }
};

/**
 * Generate a new random password
 */
export const generateNewPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

/**
 * Update user password in Firestore (for admin reset)
 * Note: This updates a custom field, not the actual Firebase Auth password
 */
export const updateUserPasswordField = async (userId, newPassword) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      tempPassword: newPassword,
      passwordResetAt: new Date(),
      passwordResetBy: 'admin'
    });

    return { success: true, message: 'Password berhasil direset' };
  } catch (error) {
    console.error('Update user password error:', error);
    return { success: false, message: 'Gagal mereset password' };
  }
};

/**
 * Complete admin password reset process
 */
export const adminPasswordReset = async (email) => {
  try {
    // Get user by email
    const userResult = await getUserByEmail(email);
    
    if (!userResult.success) {
      return userResult;
    }

    const { user } = userResult;

    // Generate new password
    const newPassword = generateNewPassword();

    // Update user document with new password
    const updateResult = await updateUserPasswordField(user.id, newPassword);

    if (!updateResult.success) {
      return updateResult;
    }

    return {
      success: true,
      message: 'Password berhasil direset',
      newPassword: newPassword,
      user: user
    };

  } catch (error) {
    console.error('Admin password reset error:', error);
    return { success: false, message: 'Terjadi kesalahan saat reset password' };
  }
};

/**
 * Get password reset history for a user
 */
export const getPasswordResetHistory = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      return { success: false, message: 'User tidak ditemukan' };
    }

    const userData = userDoc.data();
    
    return {
      success: true,
      resetHistory: {
        lastReset: userData.passwordResetAt,
        resetBy: userData.passwordResetBy,
        hasTempPassword: !!userData.tempPassword
      }
    };
  } catch (error) {
    console.error('Get password reset history error:', error);
    return { success: false, message: 'Gagal mengambil riwayat reset password' };
  }
};

export default {
  getUserByEmail,
  generateNewPassword,
  updateUserPasswordField,
  adminPasswordReset,
  getPasswordResetHistory
}; 
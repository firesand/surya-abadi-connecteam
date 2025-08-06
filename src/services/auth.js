import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

// Register new employee
export const registerEmployee = async (userData) => {
  try {
    // Create auth account
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      userData.email, 
      userData.password
    );
    
    const userId = userCredential.user.uid;
    
    // Create user profile (pending status)
    await setDoc(doc(db, 'users', userId), {
      email: userData.email,
      name: userData.name,
      nik: userData.nik,
      employeeId: userData.employeeId,
      photoUrl: userData.photoUrl || '',
      role: 'employee',
      accountStatus: 'pending',
      isActive: false,
      registeredAt: serverTimestamp(),
      department: userData.department || '',
      position: userData.position || '',
      phoneNumber: userData.phoneNumber || '',
      address: userData.address || '',
      leaveBalance: {
        annual: 12,
        used: 0,
        remaining: 12
      }
    });
    
    // Create registration request for admin
    await setDoc(doc(db, 'registrationRequests', userId), {
      userId: userId,
      email: userData.email,
      name: userData.name,
      nik: userData.nik,
      employeeId: userData.employeeId,
      requestedAt: serverTimestamp(),
      status: 'pending'
    });
    
    // Sign out (can't login until approved)
    await signOut(auth);
    
    return { success: true, message: 'Registrasi berhasil! Menunggu approval admin.' };
    
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, message: 'Registrasi gagal: ' + error.message };
  }
};

// Login user
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;
    
    // Check if user account is active
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      await signOut(auth);
      throw new Error('User profile not found');
    }
    
    const userData = userDoc.data();
    if (userData.accountStatus !== 'active' || !userData.isActive) {
      await signOut(auth);
      throw new Error('Akun belum diaktivasi oleh admin');
    }
    
    return { success: true, user: userData };
    
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: error.message };
  }
};

// Logout user
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, message: error.message };
  }
};

// Get current user data
export const getCurrentUser = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
};

// Auth state listener
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
}; 
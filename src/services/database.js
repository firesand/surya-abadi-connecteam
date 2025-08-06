import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';

// Attendance functions
export const addAttendance = async (attendanceData) => {
  try {
    const docRef = await addDoc(collection(db, 'attendances'), {
      ...attendanceData,
      createdAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Add attendance error:', error);
    return { success: false, message: error.message };
  }
};

export const getTodayAttendance = async (userId) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const q = query(
      collection(db, 'attendances'),
      where('userId', '==', userId),
      where('date', '==', today)
    );
    
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs[0].data();
    }
    return null;
  } catch (error) {
    console.error('Get today attendance error:', error);
    return null;
  }
};

export const getAttendanceHistory = async (userId, limitCount = 30) => {
  try {
    const q = query(
      collection(db, 'attendances'),
      where('userId', '==', userId),
      orderBy('date', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Get attendance history error:', error);
    return [];
  }
};

// User management functions
export const getPendingRegistrations = async () => {
  try {
    const q = query(
      collection(db, 'registrationRequests'),
      where('status', '==', 'pending'),
      orderBy('requestedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Get pending registrations error:', error);
    return [];
  }
};

export const approveRegistration = async (requestId, userId) => {
  try {
    // Update registration request
    await updateDoc(doc(db, 'registrationRequests', requestId), {
      status: 'approved',
      reviewedBy: userId,
      reviewedAt: serverTimestamp()
    });
    
    // Activate user account
    await updateDoc(doc(db, 'users', requestId), {
      accountStatus: 'active',
      isActive: true,
      activatedAt: serverTimestamp(),
      activatedBy: userId
    });
    
    return { success: true };
  } catch (error) {
    console.error('Approve registration error:', error);
    return { success: false, message: error.message };
  }
};

export const rejectRegistration = async (requestId, userId, reason) => {
  try {
    await updateDoc(doc(db, 'registrationRequests', requestId), {
      status: 'rejected',
      reviewedBy: userId,
      reviewedAt: serverTimestamp(),
      rejectionReason: reason
    });
    
    return { success: true };
  } catch (error) {
    console.error('Reject registration error:', error);
    return { success: false, message: error.message };
  }
};

export const deactivateEmployee = async (employeeId, adminId, reason) => {
  try {
    await updateDoc(doc(db, 'users', employeeId), {
      accountStatus: 'resigned',
      isActive: false,
      deactivatedAt: serverTimestamp(),
      deactivatedBy: adminId,
      deactivationReason: reason
    });
    
    return { success: true };
  } catch (error) {
    console.error('Deactivate employee error:', error);
    return { success: false, message: error.message };
  }
};

export const getActiveEmployees = async () => {
  try {
    const q = query(
      collection(db, 'users'),
      where('isActive', '==', true),
      where('role', '==', 'employee')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Get active employees error:', error);
    return [];
  }
};

// Analytics functions
export const getAttendanceStats = async (date) => {
  try {
    const q = query(
      collection(db, 'attendances'),
      where('date', '==', date)
    );
    
    const snapshot = await getDocs(q);
    const attendances = snapshot.docs.map(doc => doc.data());
    
    const stats = {
      total: attendances.length,
      present: attendances.filter(a => a.checkIn).length,
      absent: 0, // Calculate based on active employees
      late: attendances.filter(a => a.status === 'late').length,
      ontime: attendances.filter(a => a.status === 'ontime').length
    };
    
    return stats;
  } catch (error) {
    console.error('Get attendance stats error:', error);
    return { total: 0, present: 0, absent: 0, late: 0, ontime: 0 };
  }
};

export const getWeeklyAttendance = async (startDate, endDate) => {
  try {
    const q = query(
      collection(db, 'attendances'),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Get weekly attendance error:', error);
    return [];
  }
}; 
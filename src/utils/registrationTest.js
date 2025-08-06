// src/utils/registrationTest.js
// Test utility untuk memverifikasi proses registrasi

import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

export const testRegistrationProcess = async () => {
  console.log('🧪 Testing Registration Process...');
  
  try {
    // Test 1: Check registration requests
    console.log('📋 Test 1: Checking registration requests...');
    const registrationsQuery = query(
      collection(db, 'registrationRequests'),
      where('status', '==', 'pending'),
      orderBy('requestedAt', 'desc')
    );
    
    const registrationsSnapshot = await getDocs(registrationsQuery);
    const registrations = registrationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('✅ Registration requests found:', registrations.length);
    registrations.forEach((reg, index) => {
      console.log(`  ${index + 1}. ${reg.name} (${reg.email}) - ${reg.status}`);
    });
    
    // Test 2: Check user documents
    console.log('👥 Test 2: Checking user documents...');
    const usersQuery = query(
      collection(db, 'users'),
      where('role', '==', 'employee')
    );
    
    const usersSnapshot = await getDocs(usersQuery);
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('✅ User documents found:', users.length);
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user.email}) - Status: ${user.accountStatus}`);
    });
    
    // Test 3: Match registrations with users
    console.log('🔗 Test 3: Matching registrations with users...');
    const pendingUsers = users.filter(user => user.accountStatus === 'pending');
    console.log('✅ Pending users:', pendingUsers.length);
    
    const registrationUserIds = registrations.map(reg => reg.userId);
    const pendingUserIds = pendingUsers.map(user => user.id);
    
    console.log('Registration User IDs:', registrationUserIds);
    console.log('Pending User IDs:', pendingUserIds);
    
    // Check for mismatches
    const orphanedRegistrations = registrations.filter(reg => 
      !pendingUserIds.includes(reg.userId)
    );
    
    const orphanedUsers = pendingUsers.filter(user => 
      !registrationUserIds.includes(user.id)
    );
    
    if (orphanedRegistrations.length > 0) {
      console.warn('⚠️ Orphaned registrations found:', orphanedRegistrations);
    }
    
    if (orphanedUsers.length > 0) {
      console.warn('⚠️ Orphaned users found:', orphanedUsers);
    }
    
    // Test 4: Check Firestore rules
    console.log('🔒 Test 4: Checking Firestore rules...');
    console.log('ℹ️ Make sure admin can read registrationRequests and users collections');
    
    return {
      success: true,
      registrations: registrations.length,
      users: users.length,
      pendingUsers: pendingUsers.length,
      orphanedRegistrations: orphanedRegistrations.length,
      orphanedUsers: orphanedUsers.length
    };
    
  } catch (error) {
    console.error('❌ Registration test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const simulateRegistration = async (testData) => {
  console.log('🧪 Simulating registration process...');
  
  const testUser = {
    email: 'test@example.com',
    name: 'Test User',
    nik: '1234567890123456',
    employeeId: 'TEST001',
    department: 'IT',
    position: 'Developer'
  };
  
  console.log('Test data:', testUser);
  console.log('ℹ️ This is a simulation. No actual data will be created.');
  
  return {
    success: true,
    message: 'Simulation completed. Check console for details.'
  };
};

// Usage in browser console:
// import { testRegistrationProcess } from './src/utils/registrationTest.js';
// testRegistrationProcess().then(result => console.log('Test result:', result)); 
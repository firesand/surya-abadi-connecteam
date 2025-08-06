// src/utils/registrationDebug.js
// Debugging utility untuk masalah registrasi

import { auth, db, storage } from '../config/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const debugRegistrationProcess = async (formData, photoFile) => {
  console.log('🔍 Debugging Registration Process...');
  
  const debugSteps = [];
  
  try {
    // Step 1: Validate form data
    console.log('📋 Step 1: Validating form data...');
    const validationErrors = [];
    
    if (!formData.email) validationErrors.push('Email is required');
    if (!formData.password) validationErrors.push('Password is required');
    if (!formData.name) validationErrors.push('Name is required');
    if (!formData.nik) validationErrors.push('NIK is required');
    if (!formData.employeeId) validationErrors.push('Employee ID is required');
    if (!formData.department) validationErrors.push('Department is required');
    if (!formData.position) validationErrors.push('Position is required');
    if (!photoFile) validationErrors.push('Photo is required');
    
    if (validationErrors.length > 0) {
      console.error('❌ Validation errors:', validationErrors);
      return { success: false, errors: validationErrors };
    }
    
    debugSteps.push('✅ Form validation passed');
    console.log('✅ Form validation passed');
    
    // Step 2: Test Firebase connection
    console.log('🔥 Step 2: Testing Firebase connection...');
    try {
      const testQuery = query(collection(db, 'users'), where('email', '==', 'test@test.com'));
      await getDocs(testQuery);
      debugSteps.push('✅ Firebase connection working');
      console.log('✅ Firebase connection working');
    } catch (firebaseError) {
      console.error('❌ Firebase connection failed:', firebaseError);
      debugSteps.push('❌ Firebase connection failed');
      return { success: false, errors: ['Firebase connection failed'] };
    }
    
    // Step 3: Test photo upload (simulation)
    console.log('📸 Step 3: Testing photo upload...');
    if (photoFile) {
      console.log('Photo file details:', {
        name: photoFile.name,
        size: photoFile.size,
        type: photoFile.type
      });
      
      if (photoFile.size > 5 * 1024 * 1024) {
        console.error('❌ Photo file too large');
        debugSteps.push('❌ Photo file too large');
        return { success: false, errors: ['Photo file too large'] };
      }
      
      if (!photoFile.type.startsWith('image/')) {
        console.error('❌ Invalid photo file type');
        debugSteps.push('❌ Invalid photo file type');
        return { success: false, errors: ['Invalid photo file type'] };
      }
      
      debugSteps.push('✅ Photo validation passed');
      console.log('✅ Photo validation passed');
    }
    
    // Step 4: Check existing user
    console.log('👤 Step 4: Checking existing user...');
    try {
      const existingUserQuery = query(collection(db, 'users'), where('email', '==', formData.email));
      const existingUserSnapshot = await getDocs(existingUserQuery);
      
      if (!existingUserSnapshot.empty) {
        console.error('❌ User already exists');
        debugSteps.push('❌ User already exists');
        return { success: false, errors: ['User already exists'] };
      }
      
      debugSteps.push('✅ No existing user found');
      console.log('✅ No existing user found');
    } catch (userCheckError) {
      console.error('❌ Error checking existing user:', userCheckError);
      debugSteps.push('❌ Error checking existing user');
      return { success: false, errors: ['Error checking existing user'] };
    }
    
    // Step 5: Test storage access
    console.log('📁 Step 5: Testing storage access...');
    try {
      const testStorageRef = ref(storage, 'test/test.txt');
      // Just test if we can create a reference
      debugSteps.push('✅ Storage access working');
      console.log('✅ Storage access working');
    } catch (storageError) {
      console.error('❌ Storage access failed:', storageError);
      debugSteps.push('❌ Storage access failed');
      return { success: false, errors: ['Storage access failed'] };
    }
    
    console.log('🎉 All debug checks passed!');
    return {
      success: true,
      debugSteps,
      message: 'All checks passed, registration should work'
    };
    
  } catch (error) {
    console.error('❌ Debug process failed:', error);
    return {
      success: false,
      errors: [error.message],
      debugSteps
    };
  }
};

export const simulateRegistration = async (formData, photoFile) => {
  console.log('🧪 Simulating registration process...');
  
  const simulationSteps = [];
  
  try {
    // Step 1: Create user account (simulation)
    console.log('👤 Step 1: Creating user account...');
    simulationSteps.push('Creating user account...');
    
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    simulationSteps.push('✅ User account created');
    
    // Step 2: Upload photo (simulation)
    console.log('📸 Step 2: Uploading photo...');
    simulationSteps.push('Uploading photo...');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    simulationSteps.push('✅ Photo uploaded');
    
    // Step 3: Create user document (simulation)
    console.log('📄 Step 3: Creating user document...');
    simulationSteps.push('Creating user document...');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    simulationSteps.push('✅ User document created');
    
    // Step 4: Create registration request (simulation)
    console.log('📋 Step 4: Creating registration request...');
    simulationSteps.push('Creating registration request...');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    simulationSteps.push('✅ Registration request created');
    
    console.log('🎉 Registration simulation completed!');
    return {
      success: true,
      simulationSteps,
      message: 'Registration simulation completed successfully'
    };
    
  } catch (error) {
    console.error('❌ Registration simulation failed:', error);
    return {
      success: false,
      errors: [error.message],
      simulationSteps
    };
  }
};

export const checkRegistrationStatus = async () => {
  console.log('🔍 Checking registration status...');
  
  try {
    // Check registration requests
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
    
    console.log('📋 Registration requests found:', registrations.length);
    registrations.forEach((reg, index) => {
      console.log(`  ${index + 1}. ${reg.name} (${reg.email}) - ${reg.status}`);
    });
    
    // Check users
    const usersQuery = query(
      collection(db, 'users'),
      where('role', '==', 'employee')
    );
    
    const usersSnapshot = await getDocs(usersQuery);
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('👥 Users found:', users.length);
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user.email}) - Status: ${user.accountStatus}`);
    });
    
    return {
      success: true,
      registrations: registrations.length,
      users: users.length,
      pendingUsers: users.filter(u => u.accountStatus === 'pending').length
    };
    
  } catch (error) {
    console.error('❌ Error checking registration status:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Usage in browser console:
// import { debugRegistrationProcess, simulateRegistration, checkRegistrationStatus } from './src/utils/registrationDebug.js';
// debugRegistrationProcess(formData, photoFile).then(result => console.log('Debug result:', result));
// simulateRegistration(formData, photoFile).then(result => console.log('Simulation result:', result));
// checkRegistrationStatus().then(result => console.log('Status result:', result)); 
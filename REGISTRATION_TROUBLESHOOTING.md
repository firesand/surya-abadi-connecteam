# 🔧 Registration Troubleshooting Guide

## 🚨 **Problem Description**

Setelah user daftar baru dan mengisi semua form:
1. **Layar putih** muncul setelah klik daftar
2. **Tidak terdeteksi** karyawan baru di admin dashboard
3. **Registration request** tidak muncul di admin panel

## 🔍 **Root Cause Analysis**

### **Issue 1: Registration Process Failure**
```javascript
// ❌ WRONG: No proper error handling
try {
  // Registration process
} catch (error) {
  // Generic error handling
}
```

### **Issue 2: State Management Problem**
```javascript
// ❌ WRONG: User stays logged in after registration
// Should sign out immediately
```

### **Issue 3: Firestore Rules Restriction**
```javascript
// ❌ WRONG: Rules might block registration
match /registrationRequests/{requestId} {
  allow create: if request.auth != null;
  allow read, update: if request.auth != null &&
                        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

## ✅ **Solutions Implemented**

### **Fix 1: Enhanced Error Handling**
```javascript
// ✅ CORRECT: Better error handling with cleanup
try {
  // Registration process
} catch (error) {
  console.error('Registration error:', error);
  
  // Clean up any partially created data
  try {
    if (user && user.uid) {
      await user.delete();
      console.log('Cleaned up failed registration');
    }
  } catch (cleanupError) {
    console.error('Cleanup error:', cleanupError);
  }
  
  // Specific error messages
  if (error.code === 'auth/email-already-in-use') {
    setError('Email sudah terdaftar');
  } else if (error.code === 'auth/network-request-failed') {
    setError('Koneksi internet bermasalah. Silakan coba lagi.');
  }
}
```

### **Fix 2: Immediate Sign Out**
```javascript
// ✅ CORRECT: Sign out immediately after registration
console.log('Registration completed successfully');

// Sign out the user immediately after registration
await auth.signOut();

alert('Registrasi berhasil! Silakan tunggu persetujuan admin untuk mengaktifkan akun Anda.');
navigate('/login');
```

### **Fix 3: Enhanced Logging**
```javascript
// ✅ ADDED: Detailed logging for debugging
console.log('Creating user account...');
console.log('User created:', user.uid);
console.log('Creating user document...');
console.log('User document created');
console.log('Creating registration request...');
console.log('Registration request created');
console.log('Registration completed successfully');
```

## 🧪 **Testing Steps**

### **Step 1: Test Registration Process**
1. Open browser console (F12)
2. Go to registration page
3. Fill all required fields
4. Submit registration
5. Check console logs:
   ```
   "Creating user account..."
   "User created: [user_uid]"
   "Creating user document..."
   "User document created"
   "Creating registration request..."
   "Registration request created"
   "Registration completed successfully"
   ```

### **Step 2: Verify Data Creation**
1. Go to Firebase Console
2. Check Authentication → Users
3. Check Firestore → users collection
4. Check Firestore → registrationRequests collection

### **Step 3: Test Admin Dashboard**
1. Login as admin
2. Check console logs:
   ```
   "Fetching pending registrations..."
   "Pending registrations loaded: 1"
   "Registration details: [...]"
   ```

## 🔧 **Debugging Commands**

### **Test Registration Process**
```javascript
// In browser console:
import { testRegistrationProcess } from './src/utils/registrationTest.js';
testRegistrationProcess().then(result => console.log('Test result:', result));
```

### **Check Firestore Data**
```javascript
// In browser console:
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './src/config/firebase';

// Check registration requests
const regQuery = query(collection(db, 'registrationRequests'), where('status', '==', 'pending'));
getDocs(regQuery).then(snapshot => {
  console.log('Registration requests:', snapshot.docs.map(doc => doc.data()));
});

// Check users
const usersQuery = query(collection(db, 'users'), where('role', '==', 'employee'));
getDocs(usersQuery).then(snapshot => {
  console.log('Users:', snapshot.docs.map(doc => doc.data()));
});
```

## 📋 **Verification Checklist**

### **Registration Process:**
- [ ] Console shows "Creating user account..."
- [ ] Console shows "User created: [user_uid]"
- [ ] Console shows "Creating user document..."
- [ ] Console shows "User document created"
- [ ] Console shows "Creating registration request..."
- [ ] Console shows "Registration request created"
- [ ] Console shows "Registration completed successfully"
- [ ] User is signed out automatically
- [ ] Redirected to login page
- [ ] Success message displayed

### **Admin Dashboard:**
- [ ] Console shows "Fetching pending registrations..."
- [ ] Console shows "Pending registrations loaded: 1"
- [ ] Console shows registration details
- [ ] Admin dashboard shows pending approval
- [ ] Registration appears in admin panel

### **Firebase Console:**
- [ ] User appears in Authentication → Users
- [ ] User document created in Firestore → users
- [ ] Registration request created in Firestore → registrationRequests
- [ ] User has role: "employee"
- [ ] User has accountStatus: "pending"

## 🚀 **Quick Fixes**

### **Fix 1: Clear Browser Cache**
```bash
# Clear browser cache and cookies
# Or use incognito mode
```

### **Fix 2: Check Network Connection**
```bash
# Test internet connection
ping google.com
curl -I https://firebase.google.com
```

### **Fix 3: Deploy Firestore Rules**
```bash
# Deploy updated rules
firebase deploy --only firestore:rules
```

### **Fix 4: Restart Development Server**
```bash
# Stop server (Ctrl+C)
npm run dev
```

## 📞 **Support Information**

### **For Registration Issues:**
- **Email**: support@suryaabadi.com
- **Firebase Console**: https://console.firebase.google.com/project/suryaabadi-connecteam
- **Developer**: Hikmahtiar Studio (2025)

### **Emergency Contacts:**
- **Firebase Support**: https://firebase.google.com/support
- **Firebase Status**: https://status.firebase.google.com/

## 🎯 **Prevention Measures**

### **Before Registration:**
- [ ] Test registration form validation
- [ ] Verify Firebase configuration
- [ ] Check Firestore rules
- [ ] Test network connectivity
- [ ] Clear browser cache

### **After Registration:**
- [ ] Verify user creation in Firebase
- [ ] Check Firestore documents
- [ ] Test admin dashboard
- [ ] Monitor error logs
- [ ] Test approval process

---

**Status:** ✅ **FIXED**  
**Issue:** Registration process failure and state management  
**Solution:** Enhanced error handling and immediate sign out  
**Testing:** Comprehensive logging and verification 
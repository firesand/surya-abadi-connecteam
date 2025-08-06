# 🔧 Troubleshooting Guide - PT Surya Abadi Connecteam

## 🚨 **Common Issues & Solutions**

### **1. Admin Dashboard Loading Error**

#### **Problem:**
```
Error: "Error loading admin dashboard"
Multiple popup errors when accessing /admin
```

#### **Causes:**
1. **Firebase Configuration Issues**
2. **Network Connectivity Problems**
3. **Firestore Rules Restrictions**
4. **Missing Environment Variables**
5. **Authentication State Issues**

#### **Solutions:**

##### **A. Check Firebase Configuration**
```bash
# Verify environment variables
cat .env.local

# Expected values:
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=suryaabadi-connecteam.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=suryaabadi-connecteam
VITE_FIREBASE_STORAGE_BUCKET=suryaabadi-connecteam.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=99008874410
VITE_FIREBASE_APP_ID=1:99008874410:web:47c7ead7950ad71dba8dd3
```

##### **B. Check Browser Console**
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for error messages
4. Check Network tab for failed requests

##### **C. Verify Admin Account**
```javascript
// Check if user has admin role in Firestore
// Collection: users
// Document: {user_uid}
// Field: role = "admin"
```

##### **D. Test Firebase Connection**
```javascript
// In browser console:
import { auth, db } from './src/config/firebase';
console.log('Auth:', auth);
console.log('DB:', db);
```

### **2. Authentication Issues**

#### **Problem:**
```
"Access denied. Admin privileges required."
"User profile not found"
```

#### **Solutions:**

##### **A. Create Admin Account**
1. Go to Firebase Console
2. Authentication → Users
3. Add user with admin email
4. Create user document in Firestore:

```javascript
// Collection: users
// Document ID: {user_uid}
{
  "email": "admin@suryaabadi.com",
  "name": "Administrator",
  "role": "admin",
  "accountStatus": "active",
  "isActive": true,
  "nik": "0000000000000000",
  "employeeId": "ADMIN001",
  "registeredAt": Timestamp.now()
}
```

##### **B. Check User Status**
```javascript
// Verify in Firestore:
// users/{uid}
{
  "role": "admin",
  "accountStatus": "active",
  "isActive": true
}
```

### **3. Network & Connectivity Issues**

#### **Problem:**
```
"Failed to fetch"
"Network error"
```

#### **Solutions:**

##### **A. Check Internet Connection**
```bash
# Test connectivity
ping google.com
curl -I https://firebase.google.com
```

##### **B. Check Firebase Status**
- Visit: https://status.firebase.google.com/
- Check if services are operational

##### **C. Clear Browser Cache**
1. Open Developer Tools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

### **4. Firestore Rules Issues**

#### **Problem:**
```
"Permission denied"
"Missing or insufficient permissions"
```

#### **Solutions:**

##### **A. Deploy Firestore Rules**
```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes
```

##### **B. Check Rules Syntax**
```javascript
// Verify rules in firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Your rules here
  }
}
```

### **5. Environment Variables Issues**

#### **Problem:**
```
"Firebase configuration is missing"
"API key not found"
```

#### **Solutions:**

##### **A. Check .env.local File**
```bash
# Verify file exists
ls -la .env.local

# Check content
cat .env.local
```

##### **B. Restart Development Server**
```bash
# Stop server (Ctrl+C)
# Restart
npm run dev
```

##### **C. Clear Vite Cache**
```bash
# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### **6. Development Server Issues**

#### **Problem:**
```
"Port already in use"
"Module not found"
```

#### **Solutions:**

##### **A. Change Port**
```bash
# Use different port
npm run dev -- --port 3001
```

##### **B. Kill Existing Process**
```bash
# Find process using port
lsof -ti:5173

# Kill process
kill -9 $(lsof -ti:5173)
```

##### **C. Clear Dependencies**
```bash
# Remove and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 🔍 **Debugging Steps**

### **Step 1: Check Console Logs**
```javascript
// Open browser console (F12)
// Look for error messages
console.log('Debug info:', {
  user: auth.currentUser,
  userData: userData,
  loading: loading
});
```

### **Step 2: Verify Firebase Connection**
```javascript
// In browser console
import { auth, db } from './src/config/firebase';
console.log('Firebase config:', {
  auth: auth,
  db: db,
  currentUser: auth.currentUser
});
```

### **Step 3: Test Firestore Access**
```javascript
// Test basic Firestore operations
import { collection, getDocs } from 'firebase/firestore';
import { db } from './src/config/firebase';

// Test query
getDocs(collection(db, 'users'))
  .then(snapshot => {
    console.log('Users count:', snapshot.size);
  })
  .catch(error => {
    console.error('Firestore error:', error);
  });
```

### **Step 4: Check Authentication State**
```javascript
// Monitor auth state changes
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/config/firebase';

onAuthStateChanged(auth, (user) => {
  console.log('Auth state changed:', user);
});
```

## 🛠️ **Quick Fixes**

### **Fix 1: Admin Dashboard Error**
```bash
# 1. Check environment variables
cat .env.local

# 2. Restart development server
npm run dev

# 3. Clear browser cache
# 4. Try incognito mode
```

### **Fix 2: Authentication Issues**
```bash
# 1. Deploy Firestore rules
firebase deploy --only firestore:rules

# 2. Check admin account in Firebase Console
# 3. Verify user document in Firestore
```

### **Fix 3: Network Issues**
```bash
# 1. Check internet connection
ping google.com

# 2. Try different network
# 3. Use VPN if needed
```

## 📞 **Support Information**

### **For Technical Issues:**
- **Email**: support@suryaabadi.com
- **Firebase Console**: https://console.firebase.google.com/project/suryaabadi-connecteam
- **Vercel Dashboard**: https://vercel.com/dashboard

### **Emergency Contacts:**
- **Developer**: Hikmahtiar Studio (2025)
- **Firebase Support**: https://firebase.google.com/support
- **Vercel Support**: https://vercel.com/support

## 📋 **Prevention Checklist**

### **Before Deployment:**
- [ ] Test all features locally
- [ ] Verify environment variables
- [ ] Deploy security rules
- [ ] Test admin functionality
- [ ] Check error boundaries

### **Regular Maintenance:**
- [ ] Update dependencies monthly
- [ ] Review security rules quarterly
- [ ] Monitor error logs
- [ ] Backup critical data
- [ ] Test authentication flow

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Status:** Active Maintenance 🔧 
# Deployment Guide - PT Surya Abadi Connecteam

## 🚀 **Production Deployment**

### **1. Vercel Deployment (Recommended)**

#### **Step 1: Prepare Repository**
```bash
# Ensure all files are committed
git add .
git commit -m "Production ready - v1.0.0"
git push origin main
```

#### **Step 2: Connect to Vercel**
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Configure project settings

#### **Step 3: Set Environment Variables**
In Vercel Dashboard → Settings → Environment Variables:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Office Location
VITE_OFFICE_LAT=-6.3693
VITE_OFFICE_LNG=106.8289
VITE_OFFICE_RADIUS=100

# EmailJS (Optional)
VITE_EMAILJS_PUBLIC_KEY=your_emailjs_key
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
```

#### **Step 4: Deploy**
- Vercel will automatically build and deploy
- Access your app at: `https://your-project.vercel.app`

### **2. Firebase Hosting (Alternative)**

#### **Step 1: Install Firebase CLI**
```bash
npm install -g firebase-tools
```

#### **Step 2: Initialize Firebase**
```bash
firebase login
firebase init hosting
```

#### **Step 3: Build and Deploy**
```bash
npm run build
firebase deploy
```

## 🔧 **Firebase Setup**

### **1. Create Firebase Project**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project: `surya-abadi-connecteam`
3. Enable Authentication, Firestore, Storage

### **2. Configure Authentication**
```javascript
// Enable Email/Password authentication
// Add your admin email for testing
```

### **3. Configure Firestore Database**
```javascript
// Create collections:
// - users
// - attendances
// - leaveRequests
// - locationUpdates
// - registrationRequests
```

### **4. Configure Storage**
```javascript
// Allow image uploads for profile photos
// Set security rules for authenticated users
```

### **5. Security Rules**

#### **Firestore Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Admins can read/write all user data
    match /users/{userId} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Attendances - users can read/write their own
    match /attendances/{docId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Leave requests - users can read/write their own
    match /leaveRequests/{docId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Admins can read/write all leave requests
    match /leaveRequests/{docId} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Location updates - users can read/write their own
    match /locationUpdates/{docId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Registration requests - admins only
    match /registrationRequests/{docId} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

#### **Storage Rules:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can upload their own profile photos
    match /profiles/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can upload attendance photos
    match /attendances/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 📧 **EmailJS Setup (Optional)**

### **1. Create EmailJS Account**
1. Go to [EmailJS](https://www.emailjs.com)
2. Create account and verify email

### **2. Configure Email Service**
1. Add your email service (Gmail, Outlook, etc.)
2. Create email templates for:
   - Registration approval/rejection
   - Leave request approval/rejection
   - Daily reminders

### **3. Get Credentials**
```bash
# Get these from EmailJS dashboard
VITE_EMAILJS_PUBLIC_KEY=your_public_key
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
```

## 🔐 **Admin Account Setup**

### **1. Create Admin User**
```javascript
// In Firebase Console → Authentication
// Add admin user manually or use this code:

// After first employee registers, update their role to 'admin'
// In Firestore: users/{userId}
{
  "role": "admin",
  "accountStatus": "active"
}
```

### **2. Admin Credentials**
- Email: `admin@suryaabadi.com`
- Password: Set in Firebase Console
- Role: `admin`

## 📱 **PWA Configuration**

### **1. Manifest File**
```json
// public/manifest.json
{
  "name": "PT Surya Abadi Connecteam",
  "short_name": "Surya Abadi",
  "description": "Sistem Absensi & HR Management",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#059669",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### **2. Service Worker (Optional)**
```javascript
// public/sw.js
// Add offline functionality
```

## 🧪 **Testing Checklist**

### **Pre-Deployment:**
- [ ] All environment variables set
- [ ] Firebase project configured
- [ ] Security rules applied
- [ ] Admin account created
- [ ] Office location coordinates correct
- [ ] EmailJS configured (if using)

### **Post-Deployment:**
- [ ] Admin can login
- [ ] Employee registration works
- [ ] GPS validation works
- [ ] Camera capture works
- [ ] Leave requests work
- [ ] Email notifications work
- [ ] Mobile responsive
- [ ] PWA installable

## 📊 **Monitoring & Analytics**

### **1. Firebase Analytics**
```javascript
// Automatically enabled with Firebase
// Track user engagement, errors, performance
```

### **2. Vercel Analytics**
```javascript
// Built-in analytics
// Monitor performance, errors, usage
```

### **3. Error Tracking**
```javascript
// Add error boundary components
// Log errors to Firebase
```

## 🔄 **Update Deployment**

### **1. Development Updates**
```bash
# Make changes locally
npm run dev
# Test thoroughly
git add .
git commit -m "Update description"
git push
# Vercel auto-deploys
```

### **2. Hot Fixes**
```bash
# Emergency fixes
git commit -m "Hot fix: description"
git push
# Immediate deployment
```

## 🛡️ **Security Checklist**

### **Firebase Security:**
- [ ] Authentication enabled
- [ ] Firestore rules configured
- [ ] Storage rules configured
- [ ] Admin role properly set
- [ ] Data validation in place

### **Application Security:**
- [ ] Environment variables secure
- [ ] API keys not exposed
- [ ] HTTPS enabled
- [ ] CORS configured
- [ ] Input validation

## 📞 **Support & Maintenance**

### **1. Regular Maintenance**
- Monitor Firebase usage
- Check Vercel analytics
- Update dependencies
- Backup data regularly

### **2. User Support**
- Create admin guide
- Train admin users
- Document common issues
- Set up support email

### **3. Backup Strategy**
```javascript
// Export Firestore data regularly
// Backup user files
// Document configuration
```

---

**Deployment Status:** ✅ Production Ready  
**Last Updated:** December 2024  
**Version:** 1.0.0 
# 🚀 Deployment Guide - Surya Abadi Connecteam

## ✅ Status: Application Ready!

Aplikasi **Surya Abadi Connecteam** sudah siap untuk deployment. Semua fitur telah diimplementasikan dan siap digunakan.

## 📋 Prerequisites Checklist

- [x] Node.js installed (v16+)
- [x] Git installed
- [ ] Firebase project created
- [ ] Vercel account created (free)

## 🚀 Step-by-Step Deployment

### Step 1: Setup Firebase Project

#### 1.1 Create Firebase Project
```bash
1. Go to https://console.firebase.google.com
2. Click "Create Project"
3. Name: suryaabadi-connecteam
4. Disable Analytics → Create Project
```

#### 1.2 Enable Services
```bash
# Authentication
1. Authentication → Get Started
2. Sign-in method → Email/Password → Enable

# Firestore
1. Firestore Database → Create Database
2. Start in production mode
3. Location: asia-southeast2 (Jakarta)

# Storage
1. Storage → Get Started
2. Start in production mode
```

#### 1.3 Get Configuration
```bash
1. Project Settings → General
2. Your apps → Add app → Web
3. App nickname: surya-abadi-web
4. Copy the config object
```

### Step 2: Environment Variables

Create `.env.local` file in project root:
```env
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=suryaabadi-connecteam.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=suryaabadi-connecteam
VITE_FIREBASE_STORAGE_BUCKET=suryaabadi-connecteam.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Step 3: Deploy to Vercel

#### Option 1: Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Build the project
npm run build

# Deploy to Vercel
vercel

# Follow prompts:
? Set up and deploy "~/surya-abadi-connecteam"? [Y/n] Y
? Which scope do you want to deploy to? (your-username)
? Link to existing project? [y/N] N
? What's your project's name? surya-abadi-connecteam
? In which directory is your code located? ./dist
? Want to override the settings? [y/N] N
```

#### Option 2: Vercel Dashboard
```bash
1. Go to https://vercel.com/dashboard
2. Click "New Project"
3. Import your Git repository
4. Set build command: npm run build
5. Set output directory: dist
6. Deploy
```

### Step 4: Set Environment Variables in Vercel

```bash
1. Go to your project in Vercel Dashboard
2. Settings → Environment Variables
3. Add all variables from .env.local
4. Click Save
5. Redeploy: vercel --prod
```

### Step 5: Create Admin Account

#### Option 1: Firebase Console (Easiest)
```bash
1. Firebase Console → Authentication → Users
2. Click "Add user"
3. Email: admin@suryaabadi.com
4. Password: (create strong password)
5. After created, copy the User UID

6. Go to Firestore → Start collection
7. Collection ID: users
8. Document ID: (paste the User UID)
9. Add fields:
   {
     "email": "admin@suryaabadi.com",
     "name": "Administrator",
     "role": "admin",
     "accountStatus": "active",
     "isActive": true,
     "nik": "0000000000000000",
     "employeeId": "ADMIN001"
   }
```

### Step 6: Configure Security Rules

#### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null && 
                     (request.auth.uid == userId || 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow write: if request.auth != null && 
                      request.auth.uid == userId && 
                      resource.data.accountStatus == 'active';
    }
    
    match /registrationRequests/{requestId} {
      allow create: if request.auth != null;
      allow read, update: if request.auth != null &&
                            get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    match /attendances/{attendanceId} {
      allow create: if request.auth != null &&
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isActive == true;
      allow read: if request.auth != null;
    }
  }
}
```

#### Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /profiles/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /attendances/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## 🧪 Testing the Application

### Test Flow
```bash
1. Access your app: https://surya-abadi-connecteam.vercel.app
2. Register new employee account
3. Login as admin
4. Approve the registration
5. Login as employee
6. Test check in/out with GPS
7. Test photo upload
```

### Demo Credentials (Development)
```bash
Email: admin@suryaabadi.com
Password: password123
```

## 📱 PWA Features

### Install as Mobile App
- **Android**: Chrome → Add to Home Screen
- **iOS**: Safari → Share → Add to Home Screen

### Offline Support
- Service Worker caches essential files
- Works without internet connection
- Syncs when connection restored

## 💰 Cost Breakdown (100% FREE)

| Service | Usage | Free Tier | Cost |
|---------|-------|-----------|------|
| **Vercel Hosting** | Frontend hosting | Unlimited sites | **Rp 0** |
| **Firebase Auth** | 20 users | Unlimited users | **Rp 0** |
| **Firestore** | ~100MB data | 1GB free | **Rp 0** |
| **Storage** | ~500MB photos | 5GB free | **Rp 0** |
| **Bandwidth** | ~2GB/month | 10GB free | **Rp 0** |
| **Domain** | suryaabadi.vercel.app | Subdomain free | **Rp 0** |
| **SSL Certificate** | HTTPS | Auto included | **Rp 0** |
| **Total Monthly** | - | - | **Rp 0** |

## 🔧 Troubleshooting

### Common Issues

**"Permission Denied" errors**
- Check Firestore security rules
- Ensure user is authenticated
- Verify accountStatus is "active"

**GPS/Location not working**
- Ensure HTTPS is enabled (automatic on Vercel)
- Check browser permissions
- Test on mobile device

**Photos not uploading**
- Check Storage rules
- Verify file size < 5MB
- Ensure correct MIME type (image/*)

**Can't login after registration**
- Check if account is approved by admin
- Verify accountStatus in Firestore
- Check Firebase Auth settings

## 📊 Monitoring

### Firebase Console
- Real-time database usage
- Authentication metrics
- Storage usage
- Performance monitoring

### Vercel Dashboard
- Deployment status
- Build logs
- Function logs
- Web vitals

## 🎯 Success Checklist

- [ ] Firebase project created
- [ ] All services enabled
- [ ] Security rules configured
- [ ] Admin account created
- [ ] App deployed to Vercel
- [ ] Environment variables set
- [ ] Test employee registered
- [ ] Check in/out tested
- [ ] GPS validation working
- [ ] Photo upload working

## 🚀 Final URL

**Your app will be live at:**
**https://surya-abadi-connecteam.vercel.app**

---

## 🎉 Congratulations!

**Surya Abadi Connecteam** siap digunakan dengan:
- ✅ **Zero Cost** - 100% free tier
- ✅ **Production Ready** - Siap deploy
- ✅ **Mobile Friendly** - PWA support
- ✅ **Secure** - Firebase security rules
- ✅ **Scalable** - Bisa handle 20+ karyawan

**Total Cost: Rp 0** ✅ 
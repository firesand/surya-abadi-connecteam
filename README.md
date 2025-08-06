# 🚀 Surya Abadi Connecteam

**Sistem Absensi & HR Management Berbasis Web** untuk PT Surya Abadi

> **Developed by Hikmahtiar Studio (2025)**

## ✨ Fitur Utama

- ✅ **Absensi dengan GPS** - Validasi lokasi dalam radius 50m
- ✅ **Foto Selfie** - Capture foto saat absensi
- ✅ **Admin Approval** - Sistem aktivasi karyawan baru
- ✅ **Dashboard Admin** - Manajemen karyawan & analytics
- ✅ **Password Reset** - Admin dan user self-service reset
- ✅ **App Update Notifications** - Sistem notifikasi update otomatis
- ✅ **Employee Deletion** - Hapus karyawan dengan konfirmasi aman
- ✅ **Leave Management** - Sistem cuti dengan approval workflow
- ✅ **Payroll System** - Request dan manajemen data payroll
- ✅ **PWA Support** - Install sebagai mobile app
- ✅ **Offline Support** - Bekerja tanpa internet
- ✅ **Responsive Design** - Optimal di desktop & mobile
- ✅ **100% FREE** - Menggunakan Firebase & Vercel free tier

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Hosting**: Vercel (Free)
- **PWA**: Service Worker + Manifest
- **Notifications**: React Hot Toast
- **Email**: EmailJS
- **WhatsApp**: Direct messaging integration

## 📋 Prerequisites

- Node.js 16+ 
- Git
- Firebase account (free)
- Vercel account (free)

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd surya-abadi-connecteam
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Firebase

#### 3.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create Project"
3. Name: `suryaabadi-connecteam`
4. Disable Analytics → Create Project

#### 3.2 Enable Services
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

#### 3.3 Get Configuration
1. Project Settings → General
2. Your apps → Add app → Web
3. App nickname: `surya-abadi-web`
4. Copy the config object

### 4. Environment Variables

Copy `env.example` to `.env.local`:
```bash
cp env.example .env.local
```

Fill in your Firebase config:
```env
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=suryaabadi-connecteam.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=suryaabadi-connecteam
VITE_FIREBASE_STORAGE_BUCKET=suryaabadi-connecteam.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 5. Run Development Server
```bash
npm run dev
```

Visit: http://localhost:5173

## 🚀 Deployment

### Deploy to Vercel (FREE)

#### Option 1: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Build & Deploy
npm run build
vercel

# Follow prompts:
# - Set up and deploy: Y
# - Which scope: (your account)
# - Link to existing project: N
# - Project name: surya-abadi-connecteam
# - Directory: ./dist
# - Override settings: N
```

#### Option 2: Vercel Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Set build command: `npm run build`
5. Set output directory: `dist`
6. Deploy

### Set Environment Variables in Vercel
1. Go to your project in Vercel Dashboard
2. Settings → Environment Variables
3. Add all variables from `.env.local`
4. Redeploy

## 👥 Create Admin Account

### Option 1: Firebase Console
1. Firebase Console → Authentication → Users
2. Click "Add user"
3. Email: `admin@suryaabadi.com`
4. Password: (create strong password)
5. Copy the User UID

6. Go to Firestore → Start collection
7. Collection ID: `users`
8. Document ID: (paste the User UID)
9. Add fields:
   ```json
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

### Option 2: Script
```bash
# Create setupAdmin.js script
node setupAdmin.js
```

## 🔒 Security Rules

### Firestore Rules
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

### Storage Rules
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

## 🧪 Testing

### Test Flow
1. Register new employee account
2. Login as admin
3. Approve the registration
4. Login as employee
5. Test check in/out with GPS
6. Test photo upload
7. Test password reset functionality
8. Test leave request system
9. Test payroll request system
10. Test employee deletion (admin only)

### Test URLs
- **Production**: https://surya-abadi-connecteam.vercel.app
- **Development**: http://localhost:5173

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

## 📈 Scaling Considerations

### When to Consider Paid Plans
- **>50 employees**: Consider Firebase Blaze plan ($0.18/GB)
- **>10GB bandwidth**: Vercel Pro ($20/month)
- **Custom domain**: Buy domain (Rp 150k/year)

### Current Capacity on Free Tier
- Users: Unlimited (easily 100+)
- Daily attendance records: 2,000+
- Photo uploads: 250 per user
- Monthly page views: 100,000+
- API calls: 50,000+ per day

## 🤝 Support

### Documentation
- [Firebase Docs](https://firebase.google.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Community
- Stack Overflow (free)
- Firebase Community (free)
- Vercel Community (free)

## 📄 License

This project is licensed under the MIT License.

---

**🎉 Surya Abadi Connecteam siap digunakan dengan BIAYA Rp 0!**

**Total Cost: Rp 0** ✅  
**Kapasitas: 20+ karyawan** ✅  
**Fitur Lengkap** ✅

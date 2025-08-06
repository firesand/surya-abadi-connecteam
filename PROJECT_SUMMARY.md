# PT Surya Abadi Connecteam - Project Summary

## 📋 **Project Overview**

**Nama Proyek:** PT Surya Abadi Connecteam - Sistem Absensi & HR Management  
**Teknologi:** React.js + Vite, Firebase, Tailwind CSS  
**Deployment:** Vercel  
**Status:** Production Ready  
**Developer:** Hikmahtiar Studio (2025)  

## 🏗️ **Tech Stack**

### **Frontend:**
- React.js 18 + Vite
- React Router DOM
- Tailwind CSS
- Progressive Web App (PWA)

### **Backend:**
- Firebase Authentication
- Firebase Firestore (Database)
- Firebase Storage (File Upload)
- Firebase Hosting (Alternative)

### **Services:**
- EmailJS (Email Notifications)
- WhatsApp Integration (Framework Ready)
- Geolocation API
- Camera API

## 📁 **Project Structure**

```
surya-abadi-connecteam/
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── Admin/
│   │   │   ├── Dashboard.jsx
│   │   │   └── LeaveManagement.jsx
│   │   ├── Employee/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── EmployeeProfile.jsx
│   │   │   ├── LeaveRequest.jsx
│   │   │   └── LocationUpdate.jsx
│   │   ├── Common/
│   │   │   └── LoadingScreen.jsx
│   │   └── Attendance/
│   │       └── CheckIn.jsx
│   ├── config/
│   │   └── firebase.js
│   ├── services/
│   │   ├── auth.js
│   │   ├── database.js
│   │   ├── storage.js
│   │   ├── emailService.js
│   │   └── whatsappService.js
│   ├── utils/
│   │   └── geolocation.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── public/
│   ├── manifest.json
│   └── vite.svg
├── package.json
├── vite.config.js
├── vercel.json
├── env.example
└── README.md
```

## 🔐 **Authentication & Authorization**

### **User Roles:**
- **Admin:** Full access to all features
- **Employee:** Limited access to personal features

### **Registration Flow:**
1. Employee registers with complete data
2. Admin approves/rejects registration
3. Employee can login after approval

## 👥 **Employee Features**

### **1. Dashboard**
- Check In/Out with GPS validation
- Camera photo capture
- Real-time attendance status
- Attendance history

### **2. Profile Management**
- **Personal Data:**
  - Name, Email, Phone
  - Marital Status (Single/Married/Widowed/Divorced)
  - Number of Children
  - Address
  - Emergency Contact
- **BPJS Information:**
  - BPJS Number
  - BPJS Card Number
- **Work Information:**
  - Join Date
  - Real-time Work Duration
  - Department & Position

### **3. Leave Request System**
- Submit leave requests
- Multiple leave types (Sick, Annual, Personal, Emergency)
- Date range selection
- Reason text box
- Emergency contact
- Request history
- Status tracking (Pending/Approved/Rejected)

### **4. Location Update**
- Update location max 4x per day
- GPS validation
- Distance from office calculation
- Location history
- Real-time tracking

### **5. Payroll Request**
- Request payroll data for specific periods
- Multiple request types (Salary, Overtime, Bonus, Deduction)
- Monthly, quarterly, and yearly periods
- Request history and status tracking
- Automatic notifications when data is sent

## 👨‍💼 **Admin Features**

### **1. Dashboard Overview**
- Total employees statistics
- Active/Suspended employees
- Today's attendance
- Pending approvals
- Late check-ins

### **2. Employee Management**
- View all employees
- Edit employee data
- Suspend/Activate employees
- Delete employees (with confirmation)
- Real-time work duration tracking

### **3. Leave Management**
- View all leave requests
- Approve/Reject requests
- Add admin comments
- Send notifications
- Filter by status

### **4. Registration Approval**
- Approve new employee registrations
- Reject with reasons
- Email/WhatsApp notifications

### **5. Payroll Management**
- View all payroll requests from employees
- Generate payroll data based on attendance
- Calculate salary, overtime, and deductions
- Send payroll data via WhatsApp and Email
- Track payroll request history and status
- Approve/Reject payroll requests with comments

## 📊 **Database Collections**

### **payrollRequests**
```javascript
{
  id: string,
  userId: string,
  userName: string,
  userEmail: string,
  userPhone: string,
  department: string,
  position: string,
  requestType: 'salary' | 'overtime' | 'bonus' | 'deduction',
  period: 'monthly' | 'quarterly' | 'yearly',
  month: number, // 1-12
  year: number,
  reason: string,
  status: 'pending' | 'approved' | 'rejected' | 'sent',
  requestedAt: Timestamp,
  reviewedBy: string,
  reviewedAt: Timestamp,
  adminComment: string,
  sentVia: 'whatsapp' | 'email' | 'both',
  sentAt: Timestamp
}
```

### **users**
```javascript
{
  uid: string,
  email: string,
  name: string,
  nik: string,
  employeeId: string,
  department: string,
  position: string,
  phoneNumber: string,
  maritalStatus: 'single' | 'married' | 'widowed' | 'divorced',
  numberOfChildren: number,
  joinDate: string,
  joinDateTimestamp: Timestamp,
  address: string,
  emergencyContact: string,
  emergencyPhone: string,
  bpjsNumber: string,
  bpjsCardNumber: string,
  photoUrl: string,
  role: 'employee' | 'admin',
  accountStatus: 'pending' | 'active' | 'suspended',
  registeredAt: Timestamp,
  updatedAt: Timestamp,
  leaveBalance: {
    annual: number,
    used: number,
    remaining: number
  }
}
```

### **attendances**
```javascript
{
  id: string,
  userId: string,
  userName: string,
  date: string,
  checkIn: Timestamp,
  checkOut: Timestamp,
  checkInPhoto: string,
  checkOutPhoto: string,
  status: 'ontime' | 'late',
  workHours: number,
  location: {
    lat: number,
    lng: number,
    accuracy: number
  }
}
```

### **leaveRequests**
```javascript
{
  id: string,
  userId: string,
  userName: string,
  userEmail: string,
  leaveType: 'sick' | 'annual' | 'personal' | 'emergency' | 'other',
  startDate: Timestamp,
  endDate: Timestamp,
  reason: string,
  emergencyContact: string,
  status: 'pending' | 'approved' | 'rejected',
  requestedAt: Timestamp,
  reviewedBy: string,
  reviewedAt: Timestamp,
  adminComment: string,
  daysRequested: number
}
```

### **locationUpdates**
```javascript
{
  id: string,
  userId: string,
  userName: string,
  userEmail: string,
  latitude: number,
  longitude: number,
  accuracy: number,
  isValid: boolean,
  distance: number,
  maxRadius: number,
  updatedAt: Timestamp,
  timestamp: string
}
```

### **registrationRequests**
```javascript
{
  id: string,
  userId: string,
  email: string,
  name: string,
  nik: string,
  employeeId: string,
  department: string,
  position: string,
  requestedAt: Timestamp,
  status: 'pending' | 'approved' | 'rejected',
  reviewedBy: string,
  reviewedAt: Timestamp
}
```

## 📍 **Office Location**

**Google Maps:** https://maps.app.goo.gl/LcoHyH8Rj9F8arQd6  
**Coordinates:** -6.3693, 106.8289  
**Radius:** 100 meters  
**Location:** Depok, Indonesia  

## 🔧 **Environment Variables**

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Office Location
VITE_OFFICE_LAT=-6.3693
VITE_OFFICE_LNG=106.8289
VITE_OFFICE_RADIUS=100

# EmailJS Configuration
VITE_EMAILJS_PUBLIC_KEY=your_emailjs_key
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
```

## 🚀 **Deployment**

### **Vercel Deployment:**
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically

### **Firebase Hosting (Alternative):**
```bash
npm run build
firebase deploy
```

## 📱 **PWA Features**

- **Manifest:** `public/manifest.json`
- **Service Worker:** Ready for implementation
- **Offline Support:** Framework ready
- **Install Prompt:** Automatic
- **App Icons:** Included

## 🔔 **Notification System**

### **Email Notifications:**
- Registration approval/rejection
- Leave request approval/rejection
- Payroll data delivery
- Daily reminders
- Late check-in alerts

### **WhatsApp Integration:**
- Framework ready
- Template messages
- Direct notifications
- Payroll data delivery

## 🛡️ **Security Features**

### **Firebase Security Rules:**
- Role-based access
- Data validation
- User authentication
- File upload restrictions

### **Geolocation Security:**
- GPS validation
- Distance calculation
- Office radius check
- Location history

## 📈 **Analytics & Reporting**

### **Admin Dashboard:**
- Real-time statistics
- Employee attendance tracking
- Leave request management
- Payroll request management
- Work duration calculation

### **Employee Dashboard:**
- Personal attendance history
- Leave request status
- Payroll request status
- Work duration display
- Location update tracking

## 🎯 **Key Features Implemented**

### ✅ **Completed Features:**
1. **Authentication System** - Login/Register with admin approval
2. **Employee Management** - Complete CRUD operations
3. **Attendance System** - GPS + Camera validation
4. **Leave Management** - Request/Approval workflow
5. **Location Tracking** - Real-time location updates
6. **Profile Management** - Complete employee data
7. **Notification System** - Email + WhatsApp ready
8. **Admin Dashboard** - Comprehensive management tools
9. **PWA Support** - Mobile-friendly design
10. **Real-time Updates** - Live data synchronization
11. **Payroll Integration** - Request/Generate/Send payroll data via WhatsApp & Email

### 🔄 **Real-time Features:**
- Work duration calculation
- Attendance status updates
- Leave request notifications
- Location tracking
- Admin approval workflow

## 📋 **Current Status**

**✅ Production Ready**  
**✅ All Core Features Implemented**  
**✅ Mobile Responsive**  
**✅ PWA Compatible**  
**✅ Real-time Updates**  
**✅ Complete Admin Panel**  
**✅ Employee Self-service**  

## 🎯 **Next Steps (Optional Enhancements)**

1. **Advanced Analytics** - Detailed reports and charts
2. **Document Management** - File upload and storage
4. **Team Management** - Department and team structures
5. **API Integration** - Third-party service connections
6. **Advanced Notifications** - Push notifications
7. **Multi-language Support** - Internationalization
8. **Advanced Security** - Two-factor authentication

## 📞 **Support Information**

**Project Type:** HR Management System  
**Target Users:** 20 employees + 1 admin  
**Budget:** Free tier (Firebase + Vercel)  
**Timeline:** Completed  
**Status:** Ready for production use  

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Status:** Production Ready ✅  
**Developed by:** Hikmahtiar Studio (2025) 
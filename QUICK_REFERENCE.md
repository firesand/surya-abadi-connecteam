# Quick Reference - PT Surya Abadi Connecteam

## 🚀 **Quick Start**

### **1. Clone & Setup**
```bash
git clone [repository-url]
cd surya-abadi-connecteam
npm install
```

### **2. Environment Setup**
```bash
cp env.example .env.local
# Fill in your Firebase and EmailJS credentials
```

### **3. Run Development**
```bash
npm run dev
# Access: http://localhost:5173
```

### **4. Deploy to Vercel**
```bash
npm run build
# Connect to Vercel and deploy
```

## 📁 **Key Files & Their Purpose**

### **Core Components:**
- `src/App.jsx` - Main routing and auth logic
- `src/components/Admin/Dashboard.jsx` - Admin panel
- `src/components/Employee/Dashboard.jsx` - Employee dashboard
- `src/components/Auth/Register.jsx` - Registration with new fields
- `src/components/Employee/EmployeeProfile.jsx` - Employee profile with work duration
- `src/components/Employee/LeaveRequest.jsx` - Leave request system
- `src/components/Employee/LocationUpdate.jsx` - Location tracking (max 4x/day)
- `src/components/Admin/LeaveManagement.jsx` - Admin leave management

### **Configuration:**
- `src/config/firebase.js` - Firebase configuration
- `src/utils/geolocation.js` - GPS validation (office: -6.3693, 106.8289)
- `src/services/` - All service functions

## 🔧 **Environment Variables Needed**

```bash
# Firebase (Required)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Office Location (Required)
VITE_OFFICE_LAT=-6.3693
VITE_OFFICE_LNG=106.8289
VITE_OFFICE_RADIUS=100

# EmailJS (Optional - for notifications)
VITE_EMAILJS_PUBLIC_KEY=
VITE_EMAILJS_SERVICE_ID=
VITE_EMAILJS_TEMPLATE_ID=
```

## 👥 **User Roles & Access**

### **Admin Access:**
- URL: `/admin`
- Features: Full access to all management tools
- Can: Approve registrations, manage employees, handle leave requests

### **Employee Access:**
- URL: `/employee`
- Features: Personal dashboard, attendance, leave requests
- Can: Check in/out, request leave, update profile

## 📊 **Database Collections**

### **Main Collections:**
1. `users` - Employee data with new fields (marital status, children, etc.)
2. `attendances` - Daily attendance records
3. `leaveRequests` - Leave request workflow
4. `locationUpdates` - GPS tracking data
5. `registrationRequests` - New employee approvals

### **Key Fields Added:**
- `maritalStatus`: 'single' | 'married' | 'widowed' | 'divorced'
- `numberOfChildren`: number
- `joinDate`: string (YYYY-MM-DD)
- `joinDateTimestamp`: Timestamp
- `address`: string
- `emergencyContact`: string
- `emergencyPhone`: string
- `bpjsNumber`: string
- `bpjsCardNumber`: string

## 🎯 **Key Features Summary**

### **✅ Implemented:**
1. **Complete Employee Data** - All personal info including marital status, children, work duration
2. **Real-time Work Duration** - Automatic calculation from join date
3. **Leave Management** - Full workflow with admin approval
4. **Location Tracking** - GPS validation with 4x/day limit
5. **Admin Management** - Complete CRUD operations
6. **PWA Support** - Mobile-friendly with offline capability
7. **Notification System** - Email + WhatsApp ready

### **🔄 Real-time Features:**
- Work duration calculation
- Attendance status
- Leave request notifications
- Location tracking
- Admin approval workflow

## 🛠️ **Common Tasks**

### **Add New Employee Field:**
1. Update `Register.jsx` form
2. Update `EmployeeProfile.jsx` display
3. Update `Admin/Dashboard.jsx` table
4. Update database schema

### **Modify Office Location:**
1. Update `src/utils/geolocation.js`
2. Update environment variables
3. Test GPS validation

### **Add New Leave Type:**
1. Update `LeaveRequest.jsx` select options
2. Update `LeaveManagement.jsx` display
3. Update database validation

### **Deploy Updates:**
```bash
git add .
git commit -m "Update description"
git push
# Vercel will auto-deploy
```

## 🐛 **Common Issues & Solutions**

### **GPS Not Working:**
- Check browser permissions
- Verify office coordinates
- Test with different devices

### **Firebase Connection:**
- Verify environment variables
- Check Firebase project settings
- Ensure proper security rules

### **Email Notifications:**
- Verify EmailJS configuration
- Check template settings
- Test with valid email addresses

## 📱 **Mobile Testing**

### **PWA Features:**
- Install prompt
- Offline capability
- Camera access
- GPS permissions

### **Responsive Design:**
- Test on different screen sizes
- Verify touch interactions
- Check form usability

## 🔐 **Security Notes**

### **Firebase Rules:**
- Role-based access control
- Data validation
- File upload restrictions
- User authentication

### **GPS Security:**
- Office radius validation
- Location history tracking
- Distance calculation
- Real-time validation

## 📈 **Performance Notes**

### **Optimizations:**
- Lazy loading for components
- Image compression
- Database indexing
- Caching strategies

### **Monitoring:**
- Firebase Analytics
- Vercel Analytics
- Error tracking
- Performance metrics

## 🎯 **Next Development Steps**

### **Immediate (Optional):**
1. Add advanced reporting
2. Implement push notifications
3. Add document management
4. Create mobile app wrapper

### **Future Enhancements:**
1. Payroll integration
2. Advanced analytics
3. Multi-language support
4. API integrations

---

**Last Updated:** December 2024  
**Status:** Production Ready ✅  
**Version:** 1.0.0 
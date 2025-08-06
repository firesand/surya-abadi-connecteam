// src/components/Admin/Dashboard.jsx
import { useState, useEffect } from 'react';
import { auth, db } from '../../config/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import MonthlyReports from './MonthlyReports';
import {
  notifyApprovalViaWhatsApp,
  sendWhatsAppDirect,
  notifyLateCheckIn,
  sendDailyReminder
} from '../../services/whatsappService';
import {
  sendApprovalEmail,
  sendLateAlert,
  sendNotification
} from '../../services/emailService';
import { adminPasswordReset } from '../../services/adminPasswordReset';
import AdminNotificationPanel from './NotificationPanel';
import DeleteEmployeeModal from './DeleteEmployeeModal';

function AdminDashboard() {
  const navigate = useNavigate();

  // Admin Configuration - UPDATE THESE WITH YOUR ACTUAL INFO!
  const ADMIN_CONFIG = {
    phone: '08118062231', // Replace with actual admin phone
    email: 'firesand@gmail.com', // Replace with actual admin email
    name: 'Admin HR' // Admin name for notifications
  };

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [todayAttendances, setTodayAttendances] = useState([]);
  const [processingId, setProcessingId] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    method: 'both', // 'whatsapp', 'email', 'both', 'none'
    sendLateAlerts: true,
    sendDailyReminders: false
  });
  const [passwordResetEmail, setPasswordResetEmail] = useState('');
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);
  const [passwordResetResult, setPasswordResetResult] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    suspendedEmployees: 0,
    presentToday: 0,
    pendingApprovals: 0,
    lateToday: 0
  });

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Starting admin dashboard data fetch...');
        
        const user = auth.currentUser;
        if (!user) {
          console.log('No authenticated user found, redirecting to login');
          navigate('/login');
          return;
        }

        console.log('User authenticated:', user.uid);

        // Get user data and verify admin role
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            console.log('User data retrieved:', data);
            if (data.role !== 'admin') {
              console.log('User is not admin, redirecting');
              alert('Access denied. Admin privileges required.');
              navigate('/');
              return;
            }
            setUserData(data);
          } else {
            console.log('User document not found');
            alert('User profile not found. Please contact administrator.');
            navigate('/login');
            return;
          }
        } catch (userError) {
          console.error('Error fetching user data:', userError);
          alert('Error loading user data. Please try again.');
          return;
        }

        // Fetch pending registrations
        let registrations = [];
        try {
          console.log('Fetching pending registrations...');
          const registrationsQuery = query(
            collection(db, 'registrationRequests'),
            where('status', '==', 'pending'),
            orderBy('requestedAt', 'desc')
          );
          const registrationsSnapshot = await getDocs(registrationsQuery);
          registrations = registrationsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setPendingRegistrations(registrations);
          console.log('Pending registrations loaded:', registrations.length);
          console.log('Registration details:', registrations.map(reg => ({
            id: reg.id,
            userId: reg.userId,
            email: reg.email,
            name: reg.name,
            status: reg.status,
            requestedAt: reg.requestedAt
          })));
        } catch (regError) {
          console.error('Error fetching registrations:', regError);
          setPendingRegistrations([]);
        }

        // Fetch all employees
        let employeesList = [];
        try {
          console.log('Fetching employees...');
          const employeesQuery = query(
            collection(db, 'users'),
            where('role', '==', 'employee')
          );
          const employeesSnapshot = await getDocs(employeesQuery);
          employeesList = employeesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setEmployees(employeesList);
          console.log('Employees loaded:', employeesList.length);
        } catch (empError) {
          console.error('Error fetching employees:', empError);
          setEmployees([]);
        }

        // Fetch today's attendances
        let attendances = [];
        try {
          console.log('Fetching today\'s attendances...');
          const today = new Date().toISOString().split('T')[0];
          const attendanceQuery = query(
            collection(db, 'attendances'),
            where('date', '==', today)
          );
          const attendanceSnapshot = await getDocs(attendanceQuery);
          attendances = attendanceSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setTodayAttendances(attendances);
          console.log('Today\'s attendances loaded:', attendances.length);
        } catch (attError) {
          console.error('Error fetching attendances:', attError);
          setTodayAttendances([]);
        }

        // Calculate stats using fetched data directly
        try {
          console.log('Calculating stats with fetched data...');
          console.log('Employees data:', employeesList);
          console.log('Employees count:', employeesList.length);
          console.log('Employee details:', employeesList.map(emp => ({
            id: emp.id,
            name: emp.name,
            email: emp.email,
            role: emp.role,
            accountStatus: emp.accountStatus
          })));
          console.log('Attendances data:', attendances);
          console.log('Registrations data:', registrations);
          
          // Use data directly from queries, not from state
          const activeEmployees = employeesList.filter(emp => emp.accountStatus === 'active');
          const suspendedEmployees = employeesList.filter(emp => emp.accountStatus === 'suspended');
          const lateAttendances = attendances.filter(att => att.status === 'late');
          
          const newStats = {
            totalEmployees: employeesList.length,
            activeEmployees: activeEmployees.length,
            suspendedEmployees: suspendedEmployees.length,
            presentToday: attendances.length,
            pendingApprovals: registrations.length,
            lateToday: lateAttendances.length
          };
          
          console.log('Stats calculated:', newStats);
          setStats(newStats);
          
        } catch (statsError) {
          console.error('Error calculating stats:', statsError);
          setStats({
            totalEmployees: 0,
            activeEmployees: 0,
            suspendedEmployees: 0,
            presentToday: 0,
            pendingApprovals: 0,
            lateToday: 0
          });
        }

        console.log('Admin dashboard data fetch completed successfully');

      } catch (error) {
        console.error('Critical error in admin dashboard:', error);
        alert(`Error loading admin dashboard: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, notificationSettings.sendLateAlerts]);

  // Handle late check-in alerts
  const handleLateAlerts = async (lateAttendances) => {
    // Only send alert for new late check-ins (within last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    for (const attendance of lateAttendances) {
      const checkInTime = attendance.checkIn?.toDate ?
      attendance.checkIn.toDate() : new Date(attendance.checkIn);

      if (checkInTime > fiveMinutesAgo) {
        // Send notifications based on settings
        if (notificationSettings.method === 'whatsapp' || notificationSettings.method === 'both') {
          notifyLateCheckIn(ADMIN_CONFIG.phone, attendance.userName,
                            checkInTime.toLocaleTimeString('id-ID'));
        }

        if (notificationSettings.method === 'email' || notificationSettings.method === 'both') {
          await sendLateAlert(ADMIN_CONFIG.email, {
            name: attendance.userName,
            checkInTime: checkInTime.toLocaleTimeString('id-ID'),
                              department: attendance.department || 'N/A'
          });
        }
      }
    }
  };

  // Send daily reminders to all active employees
  const sendDailyReminders = async () => {
    const activeEmployees = employees.filter(emp => emp.accountStatus === 'active');
    let sent = 0;

    for (const employee of activeEmployees) {
      if (employee.phoneNumber && (notificationSettings.method === 'whatsapp' || notificationSettings.method === 'both')) {
        sendDailyReminder(employee.phoneNumber, employee.name);
        sent++;
      }

      if (employee.email && (notificationSettings.method === 'email' || notificationSettings.method === 'both')) {
        await sendNotification('reminder', {
          name: employee.name,
          email: employee.email
        });
        sent++;
      }
    }

    alert(`Daily reminders sent to ${sent} employees!`);
  };

  // Approve registration with notifications
  const approveRegistration = async (registration) => {
    setProcessingId(registration.id);
    try {
      // Update user status to active
      await updateDoc(doc(db, 'users', registration.userId), {
        accountStatus: 'active',
        isActive: true,
        approvedAt: Timestamp.now(),
                      approvedBy: auth.currentUser.uid
      });

      // Update registration request
      await updateDoc(doc(db, 'registrationRequests', registration.id), {
        status: 'approved',
        reviewedBy: auth.currentUser.uid,
        reviewedAt: Timestamp.now()
      });

      // Remove from pending list
      setPendingRegistrations(prev => prev.filter(r => r.id !== registration.id));

      // Get full user data for notifications
      const userDoc = await getDoc(doc(db, 'users', registration.userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setEmployees(prev => [...prev, { id: registration.userId, ...userData }]);

        // Send notifications based on selected method
        let notificationsSent = [];

        // WhatsApp notification
        if ((notificationSettings.method === 'whatsapp' || notificationSettings.method === 'both')
          && userData.phoneNumber) {
          try {
            notifyApprovalViaWhatsApp({
              name: userData.name,
              email: userData.email,
              phoneNumber: userData.phoneNumber
            }, 'approved');
            notificationsSent.push('WhatsApp');
            console.log('WhatsApp notification opened');
          } catch (waError) {
            console.error('WhatsApp notification failed:', waError);
          }
          }

          // Email notification
          if (notificationSettings.method === 'email' || notificationSettings.method === 'both') {
            try {
              const emailResult = await sendApprovalEmail({
                name: userData.name,
                email: userData.email
              }, 'approved');
              if (emailResult.success) {
                notificationsSent.push('Email');
                console.log('Email notification sent');
              }
            } catch (emailError) {
              console.error('Email notification failed:', emailError);
            }
          }

          // Update stats
          setStats(prev => ({
            ...prev,
            activeEmployees: prev.activeEmployees + 1,
            pendingApprovals: prev.pendingApprovals - 1
          }));

          // Show success message
          const notifMessage = notificationsSent.length > 0
          ? `\n📱 Notifications sent via: ${notificationsSent.join(' & ')}`
          : '\n⚠️ No notifications configured';

          alert(`✅ Registration approved for ${registration.name}${notifMessage}`);
      }
    } catch (error) {
      console.error('Error approving registration:', error);
      alert('Failed to approve registration');
    } finally {
      setProcessingId(null);
    }
  };

  // Reject registration with notifications
  const rejectRegistration = async (registration) => {
    if (!window.confirm(`Are you sure you want to reject ${registration.name}'s registration?`)) {
      return;
    }

    setProcessingId(registration.id);
    try {
      // Update registration request
      await updateDoc(doc(db, 'registrationRequests', registration.id), {
        status: 'rejected',
        reviewedBy: auth.currentUser.uid,
        reviewedAt: Timestamp.now()
      });

      // Get user data for notification
      const userDoc = await getDoc(doc(db, 'users', registration.userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();

        // Send rejection notifications
        if ((notificationSettings.method === 'whatsapp' || notificationSettings.method === 'both')
          && userData.phoneNumber) {
          notifyApprovalViaWhatsApp({
            name: userData.name,
            email: userData.email,
            phoneNumber: userData.phoneNumber
          }, 'rejected');
          }

          if (notificationSettings.method === 'email' || notificationSettings.method === 'both') {
            await sendApprovalEmail({
              name: userData.name,
              email: userData.email
            }, 'rejected');
          }
      }

      // Remove from pending list
      setPendingRegistrations(prev => prev.filter(r => r.id !== registration.id));

      alert(`Registration rejected for ${registration.name}`);
    } catch (error) {
      console.error('Error rejecting registration:', error);
      alert('Failed to reject registration');
    } finally {
      setProcessingId(null);
    }
  };

  // Toggle employee status
  const toggleEmployeeStatus = async (employee) => {
    const newStatus = employee.accountStatus === 'active' ? 'suspended' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'suspend';

    if (!window.confirm(`Are you sure you want to ${action} ${employee.name}'s account?`)) {
      return;
    }

    try {
      await updateDoc(doc(db, 'users', employee.id), {
        accountStatus: newStatus,
        isActive: newStatus === 'active'
      });

      // Update local state
      setEmployees(prev => prev.map(emp =>
      emp.id === employee.id
      ? { ...emp, accountStatus: newStatus, isActive: newStatus === 'active' }
      : emp
      ));

      alert(`Account ${newStatus === 'active' ? 'activated' : 'suspended'} for ${employee.name}`);
    } catch (error) {
      console.error('Error updating employee status:', error);
      alert('Failed to update employee status');
    }
  };

  // Edit employee data
  const editEmployee = async (employeeData) => {
    try {
      setProcessingId(employeeData.id);
      
      // Update employee data in Firestore
      await updateDoc(doc(db, 'users', employeeData.id), {
        name: employeeData.name,
        email: employeeData.email,
        employeeId: employeeData.employeeId,
        department: employeeData.department,
        position: employeeData.position,
        phoneNumber: employeeData.phoneNumber,
        maritalStatus: employeeData.maritalStatus,
        numberOfChildren: parseInt(employeeData.numberOfChildren) || 0,
        joinDate: employeeData.joinDate,
        address: employeeData.address,
        emergencyContact: employeeData.emergencyContact,
        emergencyPhone: employeeData.emergencyPhone,
        updatedAt: Timestamp.now(),
        updatedBy: auth.currentUser.uid
      });

      // Update local state
      setEmployees(prev => prev.map(emp =>
        emp.id === employeeData.id
          ? { ...emp, ...employeeData }
          : emp
      ));

      alert(`✅ Employee ${employeeData.name} has been updated successfully!`);
      setShowEditModal(false);
      setEditingEmployee(null);
      
    } catch (error) {
      console.error('Error updating employee:', error);
      alert('❌ Failed to update employee. Please try again.\n\nError: ' + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  // Open edit modal
  const openEditModal = (employee) => {
    setEditingEmployee({
      id: employee.id,
      name: employee.name || '',
      email: employee.email || '',
      employeeId: employee.employeeId || '',
      department: employee.department || '',
      position: employee.position || '',
      phoneNumber: employee.phoneNumber || '',
      maritalStatus: employee.maritalStatus || 'single',
      numberOfChildren: employee.numberOfChildren || 0,
      joinDate: employee.joinDate || '',
      address: employee.address || '',
      emergencyContact: employee.emergencyContact || '',
      emergencyPhone: employee.emergencyPhone || ''
    });
    setShowEditModal(true);
  };

  // Open delete employee modal
  const openDeleteModal = (employee) => {
    setEmployeeToDelete(employee);
    setShowDeleteModal(true);
  };

  // Handle successful deletion
  const handleDeleteSuccess = (employeeId) => {
    // Update local state
    setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
    
    // Update stats
    const deletedEmployee = employees.find(emp => emp.id === employeeId);
    if (deletedEmployee) {
      setStats(prev => ({
        ...prev,
        totalEmployees: prev.totalEmployees - 1,
        activeEmployees: prev.activeEmployees - (deletedEmployee.accountStatus === 'active' ? 1 : 0),
        suspendedEmployees: prev.suspendedEmployees - (deletedEmployee.accountStatus === 'suspended' ? 1 : 0)
      }));
    }

    // Close modal
    setShowDeleteModal(false);
    setEmployeeToDelete(null);
  };

  // Format time
  const formatTime = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  // Calculate work duration
  const calculateWorkDuration = (joinDate) => {
    if (!joinDate) return 'Not available';
    
    const join = new Date(joinDate);
    const now = new Date();
    
    const diffTime = Math.abs(now - join);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    
    if (years > 0) {
      return `${years}y ${months}m`;
    } else {
      return `${months}m`;
    }
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Export attendance to CSV
  const exportAttendance = () => {
    const csvContent = [
      ['Name', 'Date', 'Check In', 'Check Out', 'Status', 'Work Hours'],
      ...todayAttendances.map(att => [
        att.userName,
        att.date,
        formatTime(att.checkIn),
          formatTime(att.checkOut),
            att.status,
            att.workHours || '-'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Admin password reset function
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setPasswordResetLoading(true);
    setPasswordResetResult(null);

    try {
      const result = await adminPasswordReset(passwordResetEmail);
      setPasswordResetResult(result);
      
      if (result.success) {
        setPasswordResetEmail('');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setPasswordResetResult({
        success: false,
        message: 'Terjadi kesalahan saat reset password'
      });
    } finally {
      setPasswordResetLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we fetch your data...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Error</h2>
          <p className="text-gray-600 mb-4">Unable to load admin data. Please try logging in again.</p>
          <button 
            onClick={() => navigate('/login')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 pb-20">
    {/* Header */}
    <div className="bg-white shadow-sm border-b border-gray-200">
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
    <div className="flex items-center space-x-3">
    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
    <span className="text-white font-bold">SA</span>
    </div>
    <div>
    <h1 className="text-lg sm:text-xl font-bold text-gray-800">Surya Abadi Admin</h1>
    <p className="text-xs sm:text-sm text-gray-600">Management Dashboard</p>
    </div>
    </div>
    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
    {/* Notification Settings */}
    <div className="flex items-center space-x-2">
    <label className="text-xs sm:text-sm text-gray-600">Notifications:</label>
    <select
    value={notificationSettings.method}
    onChange={(e) => setNotificationSettings(prev => ({ ...prev, method: e.target.value }))}
    className="text-xs sm:text-sm px-2 py-1 border rounded-lg focus:ring-2 focus:ring-green-500"
    >
    <option value="both">Both</option>
    <option value="whatsapp">WhatsApp Only</option>
    <option value="email">Email Only</option>
    <option value="none">Disabled</option>
    </select>
    </div>

    <span className="text-xs sm:text-sm text-gray-600">Admin: {userData?.name}</span>
    <button
    onClick={handleLogout}
    className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
    >
    Logout
    </button>
    </div>
    </div>
    </div>
    </div>

    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-6">
    {/* Stats Overview */}
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 sm:gap-4 mb-6">
    <div className="bg-white rounded-xl shadow-md p-3 sm:p-6">
    <div className="flex items-center justify-between">
    <div>
    <p className="text-xs sm:text-sm text-gray-600">Total Employees</p>
    <p className="text-xl sm:text-3xl font-bold text-gray-800">{stats.totalEmployees}</p>
    </div>
    <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
    <svg className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
    </div>
    </div>
    </div>

    <div className="bg-white rounded-xl shadow-md p-3 sm:p-6">
    <div className="flex items-center justify-between">
    <div>
    <p className="text-xs sm:text-sm text-gray-600">Active Employees</p>
    <p className="text-xl sm:text-3xl font-bold text-green-600">{stats.activeEmployees}</p>
    </div>
    <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
    <svg className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    </div>
    </div>
    </div>

    <div className="bg-white rounded-xl shadow-md p-3 sm:p-6">
    <div className="flex items-center justify-between">
    <div>
    <p className="text-xs sm:text-sm text-gray-600">Suspended Employees</p>
    <p className="text-xl sm:text-3xl font-bold text-red-600">{stats.suspendedEmployees}</p>
    </div>
    <div className="w-8 h-8 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center">
    <svg className="w-4 h-4 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
    </div>
    </div>
    </div>

    <div className="bg-white rounded-xl shadow-md p-3 sm:p-6">
    <div className="flex items-center justify-between">
    <div>
    <p className="text-xs sm:text-sm text-gray-600">Present Today</p>
    <p className="text-xl sm:text-3xl font-bold text-purple-600">{stats.presentToday}</p>
    </div>
    <div className="w-8 h-8 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
    <svg className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
    </div>
    </div>
    </div>

    <div className="bg-white rounded-xl shadow-md p-3 sm:p-6">
    <div className="flex items-center justify-between">
    <div>
    <p className="text-xs sm:text-sm text-gray-600">Late Today</p>
    <p className="text-xl sm:text-3xl font-bold text-yellow-600">{stats.lateToday}</p>
    </div>
    <div className="w-8 h-8 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
    <svg className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    </div>
    </div>
    </div>

    <div className="bg-white rounded-xl shadow-md p-3 sm:p-6">
    <div className="flex items-center justify-between">
    <div>
    <p className="text-xs sm:text-sm text-gray-600">Pending Approvals</p>
    <p className="text-xl sm:text-3xl font-bold text-orange-600">{stats.pendingApprovals}</p>
    </div>
    <div className="w-8 h-8 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center">
    <svg className="w-4 h-4 sm:w-6 sm:h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    </div>
    </div>
    </div>
    </div>

    {/* Quick Actions */}
    {notificationSettings.method !== 'none' && (
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
      <h3 className="text-base sm:text-lg font-semibold text-gray-800">Quick Actions</h3>
      <button
      onClick={sendDailyReminders}
      className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm flex items-center"
      >
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      Send Daily Reminders
      </button>
      </div>
      </div>
    )}

    {/* Employee Management Tips */}
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 sm:p-4 mb-6">
      <div className="flex items-start space-x-2 sm:space-x-3">
        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h4 className="text-xs sm:text-sm font-semibold text-yellow-800 mb-1">Employee Management Tips</h4>
          <ul className="text-xs text-yellow-700 space-y-1">
            <li>• <strong>Edit</strong> employee data anytime using the blue Edit button</li>
            <li>• <strong>Suspend</strong> employees first before deleting them permanently</li>
            <li>• <strong>Delete</strong> button only appears for suspended employees</li>
            <li>• Deleting an employee removes all their data permanently</li>
            <li>• You can reactivate suspended employees anytime</li>
          </ul>
        </div>
      </div>
    </div>

    {/* Tabs */}
    <div className="bg-white rounded-xl shadow-md mb-6">
    <div className="border-b border-gray-200">
    <nav className="flex -mb-px overflow-x-auto">
    <button
    onClick={() => setActiveTab('overview')}
    className={`py-3 px-3 md:px-6 font-medium text-xs md:text-sm border-b-2 transition-colors whitespace-nowrap ${
      activeTab === 'overview'
      ? 'border-green-500 text-green-600'
      : 'border-transparent text-gray-500 hover:text-gray-700'
    }`}
    >
    Today's Attendance
    </button>
    <button
    onClick={() => setActiveTab('approvals')}
    className={`py-3 px-3 md:px-6 font-medium text-xs md:text-sm border-b-2 transition-colors relative whitespace-nowrap ${
      activeTab === 'approvals'
      ? 'border-green-500 text-green-600'
      : 'border-transparent text-gray-500 hover:text-gray-700'
    }`}
    >
    Pending Approvals
    {pendingRegistrations.length > 0 && (
      <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
    )}
    </button>
    <button
    onClick={() => setActiveTab('employees')}
    className={`py-3 px-3 md:px-6 font-medium text-xs md:text-sm border-b-2 transition-colors whitespace-nowrap ${
      activeTab === 'employees'
      ? 'border-green-500 text-green-600'
      : 'border-transparent text-gray-500 hover:text-gray-700'
    }`}
    >
    Employee Management
    </button>
    <button
    onClick={() => setActiveTab('leave-management')}
    className={`py-3 px-3 md:px-6 font-medium text-xs md:text-sm border-b-2 transition-colors whitespace-nowrap ${
      activeTab === 'leave-management'
      ? 'border-green-500 text-green-600'
      : 'border-transparent text-gray-500 hover:text-gray-700'
    }`}
    >
    Leave Management
    </button>
    <button
    onClick={() => setActiveTab('payroll-management')}
    className={`py-3 px-3 md:px-6 font-medium text-xs md:text-sm border-b-2 transition-colors whitespace-nowrap ${
      activeTab === 'payroll-management'
      ? 'border-green-500 text-green-600'
      : 'border-transparent text-gray-500 hover:text-gray-700'
    }`}
    >
    💰 Payroll
    </button>
    <button
    onClick={() => setActiveTab('password-reset')}
    className={`py-3 px-3 md:px-6 font-medium text-xs md:text-sm border-b-2 transition-colors whitespace-nowrap ${
      activeTab === 'password-reset'
      ? 'border-green-500 text-green-600'
      : 'border-transparent text-gray-500 hover:text-gray-700'
    }`}
    >
    🔐 Password Reset
    </button>
    <button
    onClick={() => setActiveTab('notifications')}
    className={`py-3 px-3 md:px-6 font-medium text-xs md:text-sm border-b-2 transition-colors whitespace-nowrap ${
      activeTab === 'notifications'
      ? 'border-green-500 text-green-600'
      : 'border-transparent text-gray-500 hover:text-gray-700'
    }`}
    >
    🔔 App Updates
    </button>
    <button
    onClick={() => setActiveTab('reports')}
    className={`py-3 px-3 md:px-6 font-medium text-xs md:text-sm border-b-2 transition-colors whitespace-nowrap ${
      activeTab === 'reports'
      ? 'border-green-500 text-green-600'
      : 'border-transparent text-gray-500 hover:text-gray-700'
    }`}
    >
    📊 Reports
    </button>
    </nav>
    </div>

    <div className="p-3 sm:p-6">
    {/* Today's Attendance Tab */}
    {activeTab === 'overview' && (
      <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0">
      <h3 className="text-base sm:text-lg font-semibold text-gray-800">Today's Attendance Record</h3>
      {todayAttendances.length > 0 && (
        <button
        onClick={exportAttendance}
        className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm flex items-center"
        >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export CSV
        </button>
      )}
      </div>

      <div className="overflow-x-auto -mx-6 px-6">
      <table className="w-full min-w-[800px]">
      <thead>
      <tr className="border-b bg-gray-50">
      <th className="text-left py-3 px-2 text-xs font-medium text-gray-700">Employee</th>
      <th className="text-left py-3 px-2 text-xs font-medium text-gray-700">Check In</th>
      <th className="text-left py-3 px-2 text-xs font-medium text-gray-700">Check Out</th>
      <th className="text-left py-3 px-2 text-xs font-medium text-gray-700">Status</th>
      <th className="text-left py-3 px-2 text-xs font-medium text-gray-700">Hours</th>
      <th className="text-left py-3 px-2 text-xs font-medium text-gray-700">Photos</th>
      </tr>
      </thead>
      <tbody>
      {todayAttendances.length > 0 ? (
        todayAttendances.map((attendance) => (
          <tr key={attendance.id} className="border-b hover:bg-gray-50">
          <td className="py-3 px-2">
          <p className="font-medium text-gray-800 text-xs">{attendance.userName}</p>
          </td>
          <td className="py-3 px-2 text-xs text-gray-600">
          {formatTime(attendance.checkIn)}
          </td>
          <td className="py-3 px-2 text-xs text-gray-600">
          {formatTime(attendance.checkOut)}
          </td>
          <td className="py-3 px-2">
          <span className={`inline-block px-1 py-1 text-xs rounded-full ${
            attendance.status === 'ontime'
            ? 'bg-green-100 text-green-800'
            : 'bg-yellow-100 text-yellow-800'
          }`}>
          {attendance.status === 'ontime' ? 'On Time' : 'Late'}
          </span>
          </td>
          <td className="py-3 px-2 text-xs text-gray-600">
          {attendance.workHours ? `${attendance.workHours}h` : '-'}
          </td>
          <td className="py-3 px-2">
          <div className="flex space-x-2">
          {attendance.checkInPhoto && (
            <a
            href={attendance.checkInPhoto}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-xs"
            >
            In
            </a>
          )}
          {attendance.checkOutPhoto && (
            <a
            href={attendance.checkOutPhoto}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-xs"
            >
            Out
            </a>
          )}
          </div>
          </td>
          </tr>
        ))
      ) : (
        <tr>
        <td colSpan="6" className="text-center py-8 text-gray-500">
        No attendance records for today
        </td>
        </tr>
      )}
      </tbody>
      </table>
      </div>
      </div>
    )}

    {/* Pending Approvals Tab */}
    {activeTab === 'approvals' && (
      <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Pending Registration Approvals</h3>

      {pendingRegistrations.length > 0 ? (
        <div className="grid gap-4">
        {pendingRegistrations.map((registration) => (
          <div key={registration.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
          <div className="flex-1">
          <h4 className="font-semibold text-gray-800">{registration.name}</h4>
          <p className="text-sm text-gray-600 mt-1">Email: {registration.email}</p>
          <p className="text-sm text-gray-600">Phone: {registration.phoneNumber || 'Not provided'}</p>
          <p className="text-sm text-gray-600">NIK: {registration.nik}</p>
          <p className="text-sm text-gray-600">
          Requested: {formatDate(registration.requestedAt)}
          </p>
          </div>
          <div className="flex space-x-2">
          <button
          onClick={() => approveRegistration(registration)}
          disabled={processingId === registration.id}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
          {processingId === registration.id ? 'Processing...' : 'Approve'}
          </button>
          <button
          onClick={() => rejectRegistration(registration)}
          disabled={processingId === registration.id}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
          Reject
          </button>
          </div>
          </div>
          </div>
        ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
        No pending registration approvals
        </div>
      )}
      </div>
    )}

    {/* Employee Management Tab */}
    {activeTab === 'employees' && (
      <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Employee Management</h3>

      <div className="overflow-x-auto">
      <table className="w-full">
      <thead>
      <tr className="border-b bg-gray-50">
      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Employee</th>
      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Email</th>
      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Department</th>
      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Position</th>
      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Marital Status</th>
      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Work Duration</th>
      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Last Updated</th>
      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
      </tr>
      </thead>
      <tbody>
      {employees.length > 0 ? (
        employees.map((employee) => (
          <tr key={employee.id} className="border-b hover:bg-gray-50">
          <td className="py-3 px-4">
          <div className="flex items-center space-x-3">
          {employee.photoUrl ? (
            <img
            src={employee.photoUrl}
            alt={employee.name}
            className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-600 font-semibold">
            {employee.name?.charAt(0).toUpperCase()}
            </span>
            </div>
          )}
          <div>
          <p className="font-medium text-gray-800">{employee.name}</p>
          <p className="text-xs text-gray-500">{employee.employeeId}</p>
          </div>
          </div>
          </td>
          <td className="py-3 px-4 text-sm text-gray-600">
          {employee.email}
          </td>
          <td className="py-3 px-4 text-sm text-gray-600">
          {employee.department || '-'}
          </td>
          <td className="py-3 px-4 text-sm text-gray-600">
          {employee.position || '-'}
          </td>
          <td className="py-3 px-4 text-sm text-gray-600">
          {employee.maritalStatus === 'single' ? 'Single' :
           employee.maritalStatus === 'married' ? 'Married' :
           employee.maritalStatus === 'widowed' ? 'Widowed' :
           employee.maritalStatus === 'divorced' ? 'Divorced' : '-'}
          </td>
          <td className="py-3 px-4 text-sm text-gray-600">
          {calculateWorkDuration(employee.joinDate)}
          </td>
          <td className="py-3 px-4">
          <span className={`inline-block px-2 py-1 text-xs rounded-full ${
            employee.accountStatus === 'active'
            ? 'bg-green-100 text-green-800'
            : employee.accountStatus === 'suspended'
            ? 'bg-red-100 text-red-800'
            : 'bg-gray-100 text-gray-800'
          }`}>
          {employee.accountStatus}
          </span>
          </td>
          <td className="py-3 px-4 text-sm text-gray-600">
          {employee.updatedAt ? formatDate(employee.updatedAt) : formatDate(employee.registeredAt)}
          </td>
          <td className="py-3 px-4">
          <div className="flex space-x-2">
          <button
          onClick={() => openEditModal(employee)}
          disabled={processingId === employee.id}
          className={`px-3 py-1 text-xs rounded-lg transition-colors bg-blue-600 text-white hover:bg-blue-700 ${
            processingId === employee.id ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title="Edit employee data"
          >
          Edit
          </button>
          
          <button
          onClick={() => toggleEmployeeStatus(employee)}
          disabled={processingId === employee.id}
          className={`px-3 py-1 text-xs rounded-lg transition-colors ${
            employee.accountStatus === 'active'
            ? 'bg-red-100 text-red-700 hover:bg-red-200'
            : 'bg-green-100 text-green-700 hover:bg-green-200'
          } ${processingId === employee.id ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
          {employee.accountStatus === 'active' ? 'Suspend' : 'Activate'}
          </button>
          
          {/* Only show delete button for suspended employees */}
          {employee.accountStatus === 'suspended' && (
            <button
            onClick={() => openDeleteModal(employee)}
            disabled={processingId === employee.id}
            className={`px-3 py-1 text-xs rounded-lg transition-colors bg-red-600 text-white hover:bg-red-700 ${
              processingId === employee.id ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title="Permanently delete employee (only available for suspended employees)"
            >
            Delete
            </button>
          )}
          
          {/* Show info for active employees */}
          {employee.accountStatus === 'active' && (
            <span className="px-3 py-1 text-xs text-gray-500 bg-gray-100 rounded-lg">
              Suspend first
            </span>
          )}
          </div>
          </td>
          </tr>
        ))
      ) : (
        <tr>
        <td colSpan="9" className="text-center py-8 text-gray-500">
        No employees registered yet
        </td>
        </tr>
      )}
      </tbody>
      </table>
      </div>
      </div>
    )}

    {/* Leave Management Tab */}
    {activeTab === 'leave-management' && (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Leave Management</h3>
          <button
            onClick={() => window.open('/admin/leave-management', '_blank')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open Full View
          </button>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">Leave Management Features</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• View all leave requests from employees</li>
            <li>• Approve or reject leave requests</li>
            <li>• Send notifications via email and WhatsApp</li>
            <li>• Track leave history and statistics</li>
            <li>• Filter requests by status (pending, approved, rejected)</li>
          </ul>
        </div>

        <div className="text-center py-8">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500">Click "Open Full View" to manage leave requests</p>
        </div>
      </div>
    )}

    {/* Payroll Management Tab */}
    {activeTab === 'payroll-management' && (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Payroll Management</h3>
          <button
            onClick={() => window.open('/admin/payroll-management', '_blank')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open Full View
          </button>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-semibold text-green-800 mb-2">Payroll Management Features</h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• View all payroll requests from employees</li>
            <li>• Generate payroll data based on attendance</li>
            <li>• Send payroll data via WhatsApp and Email</li>
            <li>• Calculate salary, overtime, and deductions</li>
            <li>• Track payroll request history and status</li>
          </ul>
        </div>

        <div className="text-center py-8">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500">Click "Open Full View" to manage payroll requests</p>
        </div>
      </div>
    )}

    {/* Password Reset Tab */}
    {activeTab === 'password-reset' && (
      <div className="p-3 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">Admin Password Reset</h3>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">Password Reset Features</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Reset password untuk karyawan yang lupa password</li>
            <li>• Generate password baru secara otomatis</li>
            <li>• Kirim password baru via WhatsApp/Email</li>
            <li>• Track riwayat reset password</li>
            <li>• Hanya admin yang dapat reset password</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Reset Password Karyawan</h4>
          
          {passwordResetResult && (
            <div className={`mb-4 p-3 rounded-lg ${
              passwordResetResult.success 
                ? 'bg-green-100 border border-green-400 text-green-700' 
                : 'bg-red-100 border border-red-400 text-red-700'
            }`}>
              <p className="text-sm">{passwordResetResult.message}</p>
              {passwordResetResult.success && passwordResetResult.newPassword && (
                <div className="mt-2 p-2 bg-white rounded border">
                  <p className="text-xs font-mono">Password Baru: <strong>{passwordResetResult.newPassword}</strong></p>
                  <p className="text-xs text-gray-600 mt-1">
                    Silakan kirim password ini ke karyawan via WhatsApp atau Email
                  </p>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div>
              <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700 mb-2">
                Email Karyawan
              </label>
              <input
                type="email"
                id="resetEmail"
                value={passwordResetEmail}
                onChange={(e) => setPasswordResetEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="nama@perusahaan.com"
                disabled={passwordResetLoading}
              />
            </div>

            <button
              type="submit"
              disabled={passwordResetLoading}
              className={`w-full py-2 px-4 rounded-lg text-white font-medium transition-colors ${
                passwordResetLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              }`}
            >
              {passwordResetLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h5 className="text-sm font-semibold text-yellow-800 mb-2">⚠️ Penting</h5>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>• Password baru akan digenerate secara otomatis</li>
              <li>• Pastikan email karyawan sudah terdaftar di sistem</li>
              <li>• Kirim password baru ke karyawan dengan aman</li>
              <li>• Karyawan harus ganti password setelah login pertama</li>
              <li>• Track semua aktivitas reset password</li>
            </ul>
          </div>
        </div>
      </div>
    )}

    {/* App Updates Tab */}
    {activeTab === 'notifications' && (
      <AdminNotificationPanel />
    )}

    {/* Monthly Reports Tab */}
    {activeTab === 'reports' && (
      <MonthlyReports />
    )}

    {/* Edit Employee Modal */}
    {showEditModal && editingEmployee && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Edit Employee</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingEmployee(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              editEmployee(editingEmployee);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingEmployee.name}
                    onChange={(e) => setEditingEmployee(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={editingEmployee.email}
                    onChange={(e) => setEditingEmployee(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingEmployee.employeeId}
                    onChange={(e) => setEditingEmployee(prev => ({ ...prev, employeeId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter employee ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={editingEmployee.department}
                    onChange={(e) => setEditingEmployee(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter department"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position
                  </label>
                  <input
                    type="text"
                    value={editingEmployee.position}
                    onChange={(e) => setEditingEmployee(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter position"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={editingEmployee.phoneNumber}
                    onChange={(e) => setEditingEmployee(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marital Status
                  </label>
                  <select
                    value={editingEmployee.maritalStatus}
                    onChange={(e) => setEditingEmployee(prev => ({ ...prev, maritalStatus: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="single">Belum Menikah</option>
                    <option value="married">Menikah</option>
                    <option value="widowed">Duda/Janda</option>
                    <option value="divorced">Cerai</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Children
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={editingEmployee.numberOfChildren}
                    onChange={(e) => setEditingEmployee(prev => ({ ...prev, numberOfChildren: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter number of children"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Join Date
                  </label>
                  <input
                    type="date"
                    value={editingEmployee.joinDate}
                    onChange={(e) => setEditingEmployee(prev => ({ ...prev, joinDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    value={editingEmployee.address}
                    onChange={(e) => setEditingEmployee(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    placeholder="Enter address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Emergency Contact (Name)
                  </label>
                  <input
                    type="text"
                    value={editingEmployee.emergencyContact}
                    onChange={(e) => setEditingEmployee(prev => ({ ...prev, emergencyContact: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter emergency contact name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Emergency Contact (Phone)
                  </label>
                  <input
                    type="tel"
                    value={editingEmployee.emergencyPhone}
                    onChange={(e) => setEditingEmployee(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter emergency contact phone"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingEmployee(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingId === editingEmployee.id}
                  className={`flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
                    processingId === editingEmployee.id ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {processingId === editingEmployee.id ? 'Updating...' : 'Update Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )}

    {/* Delete Employee Modal */}
    <DeleteEmployeeModal
      employee={employeeToDelete}
      isOpen={showDeleteModal}
      onClose={() => {
        setShowDeleteModal(false);
        setEmployeeToDelete(null);
      }}
      onDeleteSuccess={handleDeleteSuccess}
    />
    </div>
    </div>
    </div>
    </div>
  );
}

export default AdminDashboard;

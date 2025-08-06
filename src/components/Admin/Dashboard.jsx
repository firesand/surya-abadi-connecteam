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

function AdminDashboard() {
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [todayAttendances, setTodayAttendances] = useState([]);
  const [processingId, setProcessingId] = useState(null);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    presentToday: 0,
    pendingApprovals: 0
  });

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate('/login');
          return;
        }

        // Get user data and verify admin role
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.role !== 'admin') {
            alert('Access denied. Admin privileges required.');
            navigate('/');
            return;
          }
          setUserData(data);
        }

        // Fetch pending registrations
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
        setPendingRegistrations(registrations);

        // Fetch all employees
        const employeesQuery = query(
          collection(db, 'users'),
                                     where('role', '==', 'employee'),
                                     orderBy('registeredAt', 'desc')
        );
        const employeesSnapshot = await getDocs(employeesQuery);
        const employeesList = employeesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setEmployees(employeesList);

        // Fetch today's attendances
        const today = new Date().toISOString().split('T')[0];
        const attendanceQuery = query(
          collection(db, 'attendances'),
                                      where('date', '==', today),
                                      orderBy('checkIn', 'desc')
        );
        const attendanceSnapshot = await getDocs(attendanceQuery);
        const attendances = attendanceSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTodayAttendances(attendances);

        // Calculate stats
        const activeEmployees = employeesList.filter(emp => emp.accountStatus === 'active');
        setStats({
          totalEmployees: employeesList.length,
          activeEmployees: activeEmployees.length,
          presentToday: attendances.length,
          pendingApprovals: registrations.length
        });

      } catch (error) {
        console.error('Error fetching data:', error);
        alert('Error loading admin dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // Approve registration
  const approveRegistration = async (registration) => {
    setProcessingId(registration.id);
    try {
      // Update user status to active
      await updateDoc(doc(db, 'users', registration.userId), {
        accountStatus: 'active',
        isActive: true
      });

      // Update registration request
      await updateDoc(doc(db, 'registrationRequests', registration.id), {
        status: 'approved',
        reviewedBy: auth.currentUser.uid,
        reviewedAt: Timestamp.now()
      });

      // Remove from pending list
      setPendingRegistrations(prev => prev.filter(r => r.id !== registration.id));

      // Update employee list
      const userDoc = await getDoc(doc(db, 'users', registration.userId));
      if (userDoc.exists()) {
        setEmployees(prev => [...prev, { id: registration.userId, ...userDoc.data() }]);
      }

      alert(`Registration approved for ${registration.name}`);
    } catch (error) {
      console.error('Error approving registration:', error);
      alert('Failed to approve registration');
    } finally {
      setProcessingId(null);
    }
  };

  // Reject registration
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

      // Optionally delete the user account
      // await deleteDoc(doc(db, 'users', registration.userId));

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

  // Format time
  const formatTime = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
      <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
      </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 pb-20">
    {/* Header */}
    <div className="bg-white shadow-sm border-b border-gray-200">
    <div className="max-w-7xl mx-auto px-4 py-4">
    <div className="flex justify-between items-center">
    <div className="flex items-center space-x-3">
    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
    <span className="text-white font-bold">SA</span>
    </div>
    <div>
    <h1 className="text-xl font-bold text-gray-800">Surya Abadi Admin</h1>
    <p className="text-sm text-gray-600">Management Dashboard</p>
    </div>
    </div>
    <div className="flex items-center space-x-4">
    <span className="text-sm text-gray-600">Admin: {userData?.name}</span>
    <button
    onClick={handleLogout}
    className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
    >
    Logout
    </button>
    </div>
    </div>
    </div>
    </div>

    <div className="max-w-7xl mx-auto px-4 py-6">
    {/* Stats Overview */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
    <div className="bg-white rounded-xl shadow-md p-6">
    <div className="flex items-center justify-between">
    <div>
    <p className="text-sm text-gray-600">Total Employees</p>
    <p className="text-3xl font-bold text-gray-800">{stats.totalEmployees}</p>
    </div>
    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
    </div>
    </div>
    </div>

    <div className="bg-white rounded-xl shadow-md p-6">
    <div className="flex items-center justify-between">
    <div>
    <p className="text-sm text-gray-600">Active Employees</p>
    <p className="text-3xl font-bold text-green-600">{stats.activeEmployees}</p>
    </div>
    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    </div>
    </div>
    </div>

    <div className="bg-white rounded-xl shadow-md p-6">
    <div className="flex items-center justify-between">
    <div>
    <p className="text-sm text-gray-600">Present Today</p>
    <p className="text-3xl font-bold text-purple-600">{stats.presentToday}</p>
    </div>
    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
    </div>
    </div>
    </div>

    <div className="bg-white rounded-xl shadow-md p-6">
    <div className="flex items-center justify-between">
    <div>
    <p className="text-sm text-gray-600">Pending Approvals</p>
    <p className="text-3xl font-bold text-orange-600">{stats.pendingApprovals}</p>
    </div>
    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    </div>
    </div>
    </div>
    </div>

    {/* Tabs */}
    <div className="bg-white rounded-xl shadow-md mb-6">
    <div className="border-b border-gray-200">
    <nav className="flex -mb-px">
    <button
    onClick={() => setActiveTab('overview')}
    className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${
      activeTab === 'overview'
      ? 'border-green-500 text-green-600'
      : 'border-transparent text-gray-500 hover:text-gray-700'
    }`}
    >
    Today's Attendance
    </button>
    <button
    onClick={() => setActiveTab('approvals')}
    className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors relative ${
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
    className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${
      activeTab === 'employees'
      ? 'border-green-500 text-green-600'
      : 'border-transparent text-gray-500 hover:text-gray-700'
    }`}
    >
    Employee Management
    </button>
    </nav>
    </div>

    <div className="p-6">
    {/* Today's Attendance Tab */}
    {activeTab === 'overview' && (
      <div>
      <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold text-gray-800">Today's Attendance Record</h3>
      {todayAttendances.length > 0 && (
        <button
        onClick={exportAttendance}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center"
        >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export CSV
        </button>
      )}
      </div>

      <div className="overflow-x-auto">
      <table className="w-full">
      <thead>
      <tr className="border-b bg-gray-50">
      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Employee</th>
      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Check In</th>
      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Check Out</th>
      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Work Hours</th>
      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Photos</th>
      </tr>
      </thead>
      <tbody>
      {todayAttendances.length > 0 ? (
        todayAttendances.map((attendance) => (
          <tr key={attendance.id} className="border-b hover:bg-gray-50">
          <td className="py-3 px-4">
          <p className="font-medium text-gray-800">{attendance.userName}</p>
          </td>
          <td className="py-3 px-4 text-sm text-gray-600">
          {formatTime(attendance.checkIn)}
          </td>
          <td className="py-3 px-4 text-sm text-gray-600">
          {formatTime(attendance.checkOut)}
          </td>
          <td className="py-3 px-4">
          <span className={`inline-block px-2 py-1 text-xs rounded-full ${
            attendance.status === 'ontime'
            ? 'bg-green-100 text-green-800'
            : 'bg-yellow-100 text-yellow-800'
          }`}>
          {attendance.status === 'ontime' ? 'On Time' : 'Late'}
          </span>
          </td>
          <td className="py-3 px-4 text-sm text-gray-600">
          {attendance.workHours ? `${attendance.workHours}h` : '-'}
          </td>
          <td className="py-3 px-4">
          <div className="flex space-x-2">
          {attendance.checkInPhoto && (
            <a
            href={attendance.checkInPhoto}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm"
            >
            In
            </a>
          )}
          {attendance.checkOutPhoto && (
            <a
            href={attendance.checkOutPhoto}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm"
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
      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
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
          <td className="py-3 px-4">
          <button
          onClick={() => toggleEmployeeStatus(employee)}
          className={`px-3 py-1 text-xs rounded-lg transition-colors ${
            employee.accountStatus === 'active'
            ? 'bg-red-100 text-red-700 hover:bg-red-200'
            : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
          >
          {employee.accountStatus === 'active' ? 'Suspend' : 'Activate'}
          </button>
          </td>
          </tr>
        ))
      ) : (
        <tr>
        <td colSpan="6" className="text-center py-8 text-gray-500">
        No employees registered yet
        </td>
        </tr>
      )}
      </tbody>
      </table>
      </div>
      </div>
    )}
    </div>
    </div>
    </div>
    </div>
  );
}

export default AdminDashboard;

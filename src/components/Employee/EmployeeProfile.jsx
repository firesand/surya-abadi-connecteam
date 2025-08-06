// src/components/Employee/EmployeeProfile.jsx
import { useState, useEffect } from 'react';
import { auth, db } from '../../config/firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';

function EmployeeProfile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    bpjsNumber: '',
    bpjsCardNumber: '',
    emergencyContact: '',
    address: '',
    maritalStatus: '',
    numberOfChildren: 0,
    joinDate: '',
    emergencyPhone: ''
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setFormData({
            bpjsNumber: data.bpjsNumber || '',
            bpjsCardNumber: data.bpjsCardNumber || '',
            emergencyContact: data.emergencyContact || '',
            address: data.address || ''
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Calculate work duration
  const calculateWorkDuration = (joinDate) => {
    if (!joinDate) return { years: 0, months: 0, days: 0 };
    
    const join = new Date(joinDate);
    const now = new Date();
    
    const diffTime = Math.abs(now - join);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    const days = diffDays % 30;
    
    return { years, months, days };
  };

  const handleSave = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      await updateDoc(doc(db, 'users', user.uid), {
        ...formData,
        updatedAt: Timestamp.now()
      });

      setUserData(prev => ({ ...prev, ...formData }));
      setEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-8">
            <div className="flex items-center space-x-4">
              {userData?.photoUrl ? (
                <img
                  src={userData.photoUrl}
                  alt={userData.name}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center border-4 border-white">
                  <span className="text-white text-2xl font-bold">
                    {userData?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-white">{userData?.name}</h1>
                <p className="text-green-100">{userData?.position} • {userData?.department}</p>
                <p className="text-green-100 text-sm">Employee ID: {userData?.employeeId}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h2>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="text-gray-900">{userData?.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <p className="text-gray-900">{userData?.phoneNumber || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        userData?.accountStatus === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {userData?.accountStatus}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Marital Status</label>
                      <p className="text-gray-900 capitalize">
                        {userData?.maritalStatus === 'single' ? 'Belum Menikah' :
                         userData?.maritalStatus === 'married' ? 'Menikah' :
                         userData?.maritalStatus === 'widowed' ? 'Duda/Janda' :
                         userData?.maritalStatus === 'divorced' ? 'Cerai' : 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Number of Children</label>
                      <p className="text-gray-900">{userData?.numberOfChildren || 0} children</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Join Date</label>
                      <p className="text-gray-900">{userData?.joinDate ? new Date(userData.joinDate).toLocaleDateString('id-ID') : 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Work Duration</label>
                      {userData?.joinDate && (
                        <div className="text-gray-900">
                          {(() => {
                            const duration = calculateWorkDuration(userData.joinDate);
                            return `${duration.years} years, ${duration.months} months, ${duration.days} days`;
                          })()}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Address</label>
                      <p className="text-gray-900">{userData?.address || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Emergency Contact</label>
                      <p className="text-gray-900">
                        {userData?.emergencyContact ? `${userData.emergencyContact} (${userData.emergencyPhone || 'No phone'})` : 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* BPJS Information */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">BPJS Information</h2>
                  {editing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">BPJS Number</label>
                        <input
                          type="text"
                          value={formData.bpjsNumber}
                          onChange={(e) => setFormData(prev => ({ ...prev, bpjsNumber: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Enter BPJS number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">BPJS Card Number</label>
                        <input
                          type="text"
                          value={formData.bpjsCardNumber}
                          onChange={(e) => setFormData(prev => ({ ...prev, bpjsCardNumber: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Enter BPJS card number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Emergency Contact</label>
                        <input
                          type="text"
                          value={formData.emergencyContact}
                          onChange={(e) => setFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Enter emergency contact"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <textarea
                          value={formData.address}
                          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          rows="3"
                          placeholder="Enter address"
                        />
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={handleSave}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditing(false)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">BPJS Number</label>
                        <p className="text-gray-900">{userData?.bpjsNumber || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">BPJS Card Number</label>
                        <p className="text-gray-900">{userData?.bpjsCardNumber || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Emergency Contact</label>
                        <p className="text-gray-900">{userData?.emergencyContact || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <p className="text-gray-900">{userData?.address || 'Not provided'}</p>
                      </div>
                      <button
                        onClick={() => setEditing(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Edit Information
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Attendance Summary */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Attendance Summary</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-600">
                        {userData?.attendanceStats?.presentThisMonth || 0}
                      </div>
                      <div className="text-sm text-green-700">Present This Month</div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-yellow-600">
                        {userData?.attendanceStats?.lateThisMonth || 0}
                      </div>
                      <div className="text-sm text-yellow-700">Late This Month</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-600">
                        {userData?.attendanceStats?.absentThisMonth || 0}
                      </div>
                      <div className="text-sm text-blue-700">Absent This Month</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-purple-600">
                        {userData?.attendanceStats?.leaveThisMonth || 0}
                      </div>
                      <div className="text-sm text-purple-700">Leave This Month</div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
                  <div className="space-y-3">
                    <button
                      onClick={() => window.location.href = '/employee'}
                      className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Check In/Out
                    </button>
                    <button
                      onClick={() => window.location.href = '/employee/leave-request'}
                      className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Request Leave
                    </button>
                    <button
                      onClick={() => window.location.href = '/employee/location-update'}
                      className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Update Location
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployeeProfile; 
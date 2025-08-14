// src/components/Employee/LeaveRequest.jsx
import { useState, useEffect } from 'react';
import { auth, db } from '../../config/firebase';
import { collection, addDoc, query, where, orderBy, getDocs, getDoc, doc, Timestamp } from 'firebase/firestore';
import { sendNotification } from '../../services/emailService';

function LeaveRequest() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [formData, setFormData] = useState({
    leaveType: 'sick',
    startDate: '',
    endDate: '',
    reason: '',
    emergencyContact: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // Get user data using getDoc instead of query for single document
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('User data loaded:', userData);
          setUserData(userData);
        } else {
          console.error('User document not found');
          return;
        }

        // Get user's leave requests
        const requestsQuery = query(
          collection(db, 'leaveRequests'),
          where('userId', '==', user.uid),
          orderBy('requestedAt', 'desc')
        );
        const requestsSnapshot = await getDocs(requestsQuery);
        const requests = requestsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setLeaveRequests(requests);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.startDate || !formData.endDate || !formData.reason) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate that user data is available
    if (!userData || !userData.name || !userData.email) {
      alert('User data not loaded. Please refresh the page and try again.');
      return;
    }

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    
    if (startDate > endDate) {
      alert('End date must be after start date');
      return;
    }

    if (startDate < new Date()) {
      alert('Start date cannot be in the past');
      return;
    }

    setSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        alert('User not authenticated. Please login again.');
        return;
      }

      // Create leave request with validated user data
      const leaveRequest = {
        userId: user.uid,
        userName: userData.name, // Now guaranteed to exist
        userEmail: userData.email, // Now guaranteed to exist
        leaveType: formData.leaveType,
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
        reason: formData.reason,
        emergencyContact: formData.emergencyContact,
        status: 'pending',
        requestedAt: Timestamp.now(),
        daysRequested: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1
      };

      console.log('Submitting leave request:', leaveRequest);

      const docRef = await addDoc(collection(db, 'leaveRequests'), leaveRequest);

      // Send notification to admin
      try {
        await sendNotification(
          'admin@suryaabadi.com', // Replace with actual admin email
          'New Leave Request',
          `Employee ${userData?.name} has submitted a leave request.\n\nType: ${formData.leaveType}\nStart: ${formData.startDate}\nEnd: ${formData.endDate}\nReason: ${formData.reason}\n\nPlease review and approve/reject.`
        );
      } catch (error) {
        console.log('Failed to send notification email');
      }

      // Reset form
      setFormData({
        leaveType: 'sick',
        startDate: '',
        endDate: '',
        reason: '',
        emergencyContact: ''
      });

      // Add to local state
      setLeaveRequests(prev => [leaveRequest, ...prev]);

      alert('Leave request submitted successfully! You will receive notification via email and WhatsApp once approved/rejected.');
    } catch (error) {
      console.error('Error submitting leave request:', error);
      alert('Failed to submit leave request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8">
            <h1 className="text-2xl font-bold text-white">Leave Request</h1>
            <p className="text-blue-100">Submit your leave request for approval</p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Leave Request Form */}
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Submit Leave Request</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Leave Type *
                    </label>
                    <select
                      value={formData.leaveType}
                      onChange={(e) => setFormData(prev => ({ ...prev, leaveType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="sick">Sick Leave</option>
                      <option value="annual">Annual Leave</option>
                      <option value="personal">Personal Leave</option>
                      <option value="emergency">Emergency Leave</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date *
                      </label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason *
                    </label>
                    <textarea
                      value={formData.reason}
                      onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="4"
                      placeholder="Please provide a detailed reason for your leave request..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Emergency Contact
                    </label>
                    <input
                      type="text"
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Phone number for emergency contact"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || loading || !userData}
                    className={`w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
                      (submitting || loading || !userData) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {submitting ? 'Submitting...' : loading ? 'Loading...' : !userData ? 'Data Not Ready' : 'Submit Leave Request'}
                  </button>
                </form>
              </div>

              {/* Leave History */}
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Leave History</h2>
                <div className="space-y-3">
                  {leaveRequests.length > 0 ? (
                    leaveRequests.map((request) => (
                      <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium text-gray-800 capitalize">
                              {request.leaveType} Leave
                            </h3>
                            <p className="text-sm text-gray-600">
                              {formatDate(request.startDate)} - {formatDate(request.endDate)}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{request.reason}</p>
                        {request.adminComment && (
                          <div className="bg-gray-50 rounded p-2">
                            <p className="text-xs text-gray-600 font-medium">Admin Comment:</p>
                            <p className="text-sm text-gray-700">{request.adminComment}</p>
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Requested: {formatDate(request.requestedAt)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p>No leave requests yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LeaveRequest; 
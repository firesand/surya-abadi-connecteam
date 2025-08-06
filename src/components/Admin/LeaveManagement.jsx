// src/components/Admin/LeaveManagement.jsx
import { useState, useEffect } from 'react';
import { auth, db } from '../../config/firebase';
import { collection, query, where, getDocs, updateDoc, doc, orderBy, Timestamp } from 'firebase/firestore';
import { sendNotification } from '../../services/emailService';

function LeaveManagement() {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'approved', 'rejected'

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      const requestsQuery = query(
        collection(db, 'leaveRequests'),
        orderBy('requestedAt', 'desc')
      );
      const requestsSnapshot = await getDocs(requestsQuery);
      const requests = requestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLeaveRequests(requests);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request) => {
    if (!window.confirm(`Approve leave request for ${request.userName}?`)) {
      return;
    }

    setProcessingId(request.id);
    try {
      // Update leave request status
      await updateDoc(doc(db, 'leaveRequests', request.id), {
        status: 'approved',
        reviewedBy: auth.currentUser.uid,
        reviewedAt: Timestamp.now(),
        adminComment: 'Approved'
      });

      // Send notification to employee
      try {
        await sendNotification(
          request.userEmail,
          'Leave Request Approved',
          `Your leave request has been approved!\n\nType: ${request.leaveType}\nStart: ${formatDate(request.startDate)}\nEnd: ${formatDate(request.endDate)}\nReason: ${request.reason}\n\nEnjoy your leave!`
        );
      } catch (error) {
        console.log('Failed to send notification email');
      }

      // Update local state
      setLeaveRequests(prev => prev.map(req =>
        req.id === request.id
          ? { ...req, status: 'approved', reviewedBy: auth.currentUser.uid, reviewedAt: Timestamp.now(), adminComment: 'Approved' }
          : req
      ));

      alert(`Leave request for ${request.userName} has been approved!`);
    } catch (error) {
      console.error('Error approving leave request:', error);
      alert('Failed to approve leave request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request) => {
    const reason = window.prompt(`Please provide a reason for rejecting ${request.userName}'s leave request:`);
    if (!reason) {
      alert('Please provide a reason for rejection.');
      return;
    }

    setProcessingId(request.id);
    try {
      // Update leave request status
      await updateDoc(doc(db, 'leaveRequests', request.id), {
        status: 'rejected',
        reviewedBy: auth.currentUser.uid,
        reviewedAt: Timestamp.now(),
        adminComment: reason
      });

      // Send notification to employee
      try {
        await sendNotification(
          request.userEmail,
          'Leave Request Rejected',
          `Your leave request has been rejected.\n\nType: ${request.leaveType}\nStart: ${formatDate(request.startDate)}\nEnd: ${formatDate(request.endDate)}\nReason: ${request.reason}\n\nRejection Reason: ${reason}\n\nPlease contact HR for more information.`
        );
      } catch (error) {
        console.log('Failed to send notification email');
      }

      // Update local state
      setLeaveRequests(prev => prev.map(req =>
        req.id === request.id
          ? { ...req, status: 'rejected', reviewedBy: auth.currentUser.uid, reviewedAt: Timestamp.now(), adminComment: reason }
          : req
      ));

      alert(`Leave request for ${request.userName} has been rejected.`);
    } catch (error) {
      console.error('Error rejecting leave request:', error);
      alert('Failed to reject leave request');
    } finally {
      setProcessingId(null);
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

  const formatTime = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit' 
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

  const filteredRequests = leaveRequests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading leave requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8">
            <h1 className="text-2xl font-bold text-white">Leave Management</h1>
            <p className="text-blue-100">Manage employee leave requests</p>
          </div>

          <div className="p-6">
            {/* Filter */}
            <div className="mb-6">
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All ({leaveRequests.length})
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'pending'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Pending ({leaveRequests.filter(r => r.status === 'pending').length})
                </button>
                <button
                  onClick={() => setFilter('approved')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'approved'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Approved ({leaveRequests.filter(r => r.status === 'approved').length})
                </button>
                <button
                  onClick={() => setFilter('rejected')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'rejected'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Rejected ({leaveRequests.filter(r => r.status === 'rejected').length})
                </button>
              </div>
            </div>

            {/* Leave Requests */}
            <div className="space-y-4">
              {filteredRequests.length > 0 ? (
                filteredRequests.map((request) => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{request.userName}</h3>
                        <p className="text-sm text-gray-600">{request.userEmail}</p>
                      </div>
                      <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Leave Type</p>
                        <p className="text-gray-900 capitalize">{request.leaveType} Leave</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Duration</p>
                        <p className="text-gray-900">{request.daysRequested} days</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Start Date</p>
                        <p className="text-gray-900">{formatDate(request.startDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">End Date</p>
                        <p className="text-gray-900">{formatDate(request.endDate)}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700">Reason</p>
                      <p className="text-gray-900">{request.reason}</p>
                    </div>

                    {request.emergencyContact && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700">Emergency Contact</p>
                        <p className="text-gray-900">{request.emergencyContact}</p>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        Requested: {formatTime(request.requestedAt)}
                      </div>

                      {request.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApprove(request)}
                            disabled={processingId === request.id}
                            className={`px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ${
                              processingId === request.id ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            {processingId === request.id ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleReject(request)}
                            disabled={processingId === request.id}
                            className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors ${
                              processingId === request.id ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            {processingId === request.id ? 'Processing...' : 'Reject'}
                          </button>
                        </div>
                      )}

                      {request.status !== 'pending' && request.adminComment && (
                        <div className="bg-gray-50 rounded p-3">
                          <p className="text-sm font-medium text-gray-700">Admin Comment:</p>
                          <p className="text-sm text-gray-900">{request.adminComment}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500">No leave requests found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LeaveManagement; 
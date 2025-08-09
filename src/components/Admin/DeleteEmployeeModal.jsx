import { useState, useEffect, useCallback } from 'react';
import { doc, deleteDoc, collection, getDocs, query, where, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { sendNotification } from '../../services/emailService';

function DeleteEmployeeModal({ employee, isOpen, onClose, onDeleteSuccess }) {
  const [step, setStep] = useState(1);
  const [reason, setReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [dataSummary, setDataSummary] = useState(null);

  // Load data summary when modal opens
  const loadDataSummary = useCallback(async () => {
    if (!employee) return;

    try {
      // Get attendance count
      const attendanceQuery = query(
        collection(db, 'attendances'),
        where('userId', '==', employee.id)
      );
      const attendanceSnapshot = await getDocs(attendanceQuery);
      const attendanceCount = attendanceSnapshot.size;

      // Get leave requests count
      const leaveQuery = query(
        collection(db, 'leaveRequests'),
        where('userId', '==', employee.id)
      );
      const leaveSnapshot = await getDocs(leaveQuery);
      const leaveCount = leaveSnapshot.size;

      // Get location updates count
      const locationQuery = query(
        collection(db, 'locationUpdates'),
        where('userId', '==', employee.id)
      );
      const locationSnapshot = await getDocs(locationQuery);
      const locationCount = locationSnapshot.size;

      // Get payroll requests count
      const payrollQuery = query(
        collection(db, 'payrollRequests'),
        where('userId', '==', employee.id)
      );
      const payrollSnapshot = await getDocs(payrollQuery);
      const payrollCount = payrollSnapshot.size;

      setDataSummary({
        attendanceCount,
        leaveCount,
        locationCount,
        payrollCount,
        totalRecords: attendanceCount + leaveCount + locationCount + payrollCount
      });
    } catch (error) {
      console.error('Failed to load data summary:', error);
      setDataSummary({
        attendanceCount: 0,
        leaveCount: 0,
        locationCount: 0,
        payrollCount: 0,
        totalRecords: 0
      });
    }
  }, [employee]);

  // Initialize data when modal opens
  useEffect(() => {
    if (isOpen && employee) {
      loadDataSummary();
    }
  }, [isOpen, employee, loadDataSummary]);

  const handleDelete = async () => {
    if (!reason.trim()) {
      alert('Please provide a reason for deletion.');
      return;
    }

    setIsDeleting(true);

    try {
      console.log('Starting deletion process for employee:', employee.id);
      
      // Step 1: Delete user document
      console.log('Step 1: Deleting user document...');
      await deleteDoc(doc(db, 'users', employee.id));
      console.log('✅ User document deleted successfully');

      // Step 2: Delete registration request if exists
      console.log('Step 2: Checking registration request...');
      try {
        await deleteDoc(doc(db, 'registrationRequests', employee.id));
        console.log('✅ Registration request deleted');
      } catch {
        console.log('ℹ️ Registration request not found or already deleted');
      }

      // Step 3: Delete all attendance records
      console.log('Step 3: Deleting attendance records...');
      try {
        const attendanceQuery = query(
          collection(db, 'attendances'),
          where('userId', '==', employee.id)
        );
        const attendanceSnapshot = await getDocs(attendanceQuery);
        console.log(`Found ${attendanceSnapshot.size} attendance records to delete`);
        
        if (attendanceSnapshot.size > 0) {
          const attendanceDeletePromises = attendanceSnapshot.docs.map(doc => deleteDoc(doc.ref));
          await Promise.all(attendanceDeletePromises);
          console.log('✅ Attendance records deleted successfully');
        }
      } catch (error) {
        console.error('❌ Error deleting attendance records:', error);
        throw new Error(`Failed to delete attendance records: ${error.message}`);
      }

      // Step 4: Delete all leave requests
      console.log('Step 4: Deleting leave requests...');
      try {
        const leaveQuery = query(
          collection(db, 'leaveRequests'),
          where('userId', '==', employee.id)
        );
        const leaveSnapshot = await getDocs(leaveQuery);
        console.log(`Found ${leaveSnapshot.size} leave requests to delete`);
        
        if (leaveSnapshot.size > 0) {
          const leaveDeletePromises = leaveSnapshot.docs.map(doc => deleteDoc(doc.ref));
          await Promise.all(leaveDeletePromises);
          console.log('✅ Leave requests deleted successfully');
        }
      } catch (error) {
        console.error('❌ Error deleting leave requests:', error);
        throw new Error(`Failed to delete leave requests: ${error.message}`);
      }

      // Step 5: Delete all location updates
      console.log('Step 5: Deleting location updates...');
      try {
        const locationQuery = query(
          collection(db, 'locationUpdates'),
          where('userId', '==', employee.id)
        );
        const locationSnapshot = await getDocs(locationQuery);
        console.log(`Found ${locationSnapshot.size} location updates to delete`);
        
        if (locationSnapshot.size > 0) {
          const locationDeletePromises = locationSnapshot.docs.map(doc => deleteDoc(doc.ref));
          await Promise.all(locationDeletePromises);
          console.log('✅ Location updates deleted successfully');
        }
      } catch (error) {
        console.error('❌ Error deleting location updates:', error);
        throw new Error(`Failed to delete location updates: ${error.message}`);
      }

      // Step 6: Delete all payroll requests
      console.log('Step 6: Deleting payroll requests...');
      try {
        const payrollQuery = query(
          collection(db, 'payrollRequests'),
          where('userId', '==', employee.id)
        );
        const payrollSnapshot = await getDocs(payrollQuery);
        console.log(`Found ${payrollSnapshot.size} payroll requests to delete`);
        
        if (payrollSnapshot.size > 0) {
          const payrollDeletePromises = payrollSnapshot.docs.map(doc => deleteDoc(doc.ref));
          await Promise.all(payrollDeletePromises);
          console.log('✅ Payroll requests deleted successfully');
        }
      } catch (error) {
        console.error('❌ Error deleting payroll requests:', error);
        throw new Error(`Failed to delete payroll requests: ${error.message}`);
      }

      // Step 7: Log deletion activity
      console.log('Step 7: Logging deletion activity...');
      try {
        await setDoc(doc(db, 'deletionLogs', `${employee.id}_${Date.now()}`), {
          employeeId: employee.id,
          employeeName: employee.name,
          employeeEmail: employee.email,
          reason: reason,
          deletedAt: new Date(),
          deletedBy: 'admin',
          dataSummary: dataSummary
        });
        console.log('✅ Deletion log created successfully');
      } catch (error) {
        console.error('❌ Error creating deletion log:', error);
        // Don't throw error for logging failure
      }

      // Step 8: Send notification to admin (optional)
      console.log('Step 8: Sending notification...');
      try {
        await sendNotification(
          'admin@suryaabadi.com',
          'Employee Deleted',
          `Employee ${employee.name} has been permanently deleted from the system.\n\nReason: ${reason}\n\nData deleted:\n- ${dataSummary?.attendanceCount || 0} attendance records\n- ${dataSummary?.leaveCount || 0} leave requests\n- ${dataSummary?.locationCount || 0} location updates\n- ${dataSummary?.payrollCount || 0} payroll requests`
        );
        console.log('✅ Notification sent successfully');
      } catch (error) {
        console.log('ℹ️ Failed to send notification email:', error);
        // Don't throw error for notification failure
      }

      console.log('🎉 Employee deletion completed successfully!');
      
      // Success
      onDeleteSuccess(employee.id);
      onClose();
      
    } catch (error) {
      console.error('❌ Failed to delete employee:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      // Show more specific error message
      let errorMessage = 'Failed to delete employee. Please try again.';
      
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check your Firebase rules.';
      } else if (error.code === 'not-found') {
        errorMessage = 'Employee data not found.';
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  // Simple delete function for testing
  const handleDeleteSimple = async () => {
    if (!reason.trim()) {
      alert('Please provide a reason for deletion.');
      return;
    }

    setIsDeleting(true);

    try {
      console.log('Starting simple deletion for employee:', employee.id);
      
      // Only delete the user document first
      await deleteDoc(doc(db, 'users', employee.id));
      console.log('✅ User document deleted successfully');
      
      // Success
      onDeleteSuccess(employee.id);
      onClose();
      
    } catch (error) {
      console.error('❌ Simple deletion failed:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      let errorMessage = 'Failed to delete employee. Please try again.';
      
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check your Firebase rules.';
      } else if (error.code === 'not-found') {
        errorMessage = 'Employee data not found.';
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Delete Employee</h2>
            <p className="text-sm text-gray-600 mt-1">
              Permanently delete {employee.name} from the system
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-6">
              {/* Employee Information */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-red-800 mb-3">⚠️ Employee Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Name:</span>
                    <span className="ml-2 text-gray-900">{employee.name}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Email:</span>
                    <span className="ml-2 text-gray-900">{employee.email}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Employee ID:</span>
                    <span className="ml-2 text-gray-900">{employee.employeeId}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Department:</span>
                    <span className="ml-2 text-gray-900">{employee.department || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Position:</span>
                    <span className="ml-2 text-gray-900">{employee.position || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Join Date:</span>
                    <span className="ml-2 text-gray-900">{formatDate(employee.joinDate)}</span>
                  </div>
                </div>
              </div>

              {/* Data Summary */}
              {dataSummary && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-3">📊 Data to be Deleted</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{dataSummary.attendanceCount}</div>
                      <div className="text-xs text-gray-600">Attendance Records</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{dataSummary.leaveCount}</div>
                      <div className="text-xs text-gray-600">Leave Requests</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{dataSummary.locationCount}</div>
                      <div className="text-xs text-gray-600">Location Updates</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{dataSummary.payrollCount}</div>
                      <div className="text-xs text-gray-600">Payroll Requests</div>
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <span className="text-sm font-medium text-red-700">
                      Total: {dataSummary.totalRecords} records will be permanently deleted
                    </span>
                  </div>
                </div>
              )}

              {/* Warning */}
              <div className="bg-red-100 border border-red-300 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-6 h-6 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <h3 className="text-lg font-semibold text-red-800">⚠️ Irreversible Action</h3>
                    <ul className="text-sm text-red-700 mt-2 space-y-1">
                      <li>• All employee data will be permanently deleted</li>
                      <li>• This action cannot be undone</li>
                      <li>• No backup will be created</li>
                      <li>• Employee will lose access to the system immediately</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Continue to Delete
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {/* Reason Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Deletion *
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows="4"
                  placeholder="Please provide a detailed reason for deleting this employee..."
                  required
                />
              </div>

              {/* Final Confirmation */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-red-800 mb-3">🔒 Final Confirmation</h3>
                <div className="text-sm text-red-700 space-y-2">
                  <p>You are about to permanently delete:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>{employee.name}</strong> ({employee.email})</li>
                    <li><strong>{dataSummary?.totalRecords || 0} records</strong> across all systems</li>
                    <li><strong>All access</strong> to the application</li>
                  </ul>
                  <p className="mt-3 font-medium">This action is irreversible and cannot be undone.</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <div className="flex space-x-3">
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting || !reason.trim()}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      isDeleting || !reason.trim()
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    {isDeleting ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Deleting...
                      </span>
                    ) : (
                      'Full Delete (All Data)'
                    )}
                  </button>
                  <button
                    onClick={() => setStep(1)}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Back
                  </button>
                </div>
                
                {/* Testing button */}
                <div className="border-t pt-3">
                  <p className="text-xs text-gray-500 mb-2">Testing Options:</p>
                  <button
                    onClick={handleDeleteSimple}
                    disabled={isDeleting || !reason.trim()}
                    className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                      isDeleting || !reason.trim()
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'bg-orange-600 text-white hover:bg-orange-700'
                    }`}
                  >
                    {isDeleting ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Testing...
                      </span>
                    ) : (
                      'Test: Delete User Only'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DeleteEmployeeModal; 
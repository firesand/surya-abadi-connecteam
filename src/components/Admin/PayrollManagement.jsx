// src/components/Admin/PayrollManagement.jsx
import { useState, useEffect } from 'react';
import { auth, db } from '../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
  getPendingPayrollRequests,
  approvePayrollRequest,
  rejectPayrollRequest,
  generatePayrollReport,
  getMonthName,
  formatCurrency
} from '../../services/payrollService';

function PayrollManagement() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payrollRequests, setPayrollRequests] = useState([]);
  const [processingId, setProcessingId] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [payrollData, setPayrollData] = useState(null);
  const [sendMethod, setSendMethod] = useState('both');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingId, setRejectingId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // Get user data and verify admin role
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.role !== 'admin') {
            alert('Access denied. Admin privileges required.');
            return;
          }
          setUserData(data);
        }

        // Fetch pending payroll requests
        const requests = await getPendingPayrollRequests();
        setPayrollRequests(requests);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleApproveRequest = async (request) => {
    setProcessingId(request.id);
    setSelectedRequest(request);
    setShowPayrollModal(true);
  };

  const handleRejectRequest = async (request) => {
    setRejectingId(request.id);
    setSelectedRequest(request);
    setShowRejectModal(true);
  };

  const generatePayrollData = async () => {
    if (!selectedRequest) return;

    try {
      const report = await generatePayrollReport(
        selectedRequest.userId,
        selectedRequest.month,
        selectedRequest.year
      );

      if (report) {
        setPayrollData(report);
      } else {
        alert('Gagal generate data payroll. Pastikan data attendance tersedia.');
      }
    } catch (error) {
      console.error('Generate payroll error:', error);
      alert('Terjadi kesalahan saat generate data payroll.');
    }
  };

  const sendPayrollData = async () => {
    if (!selectedRequest || !payrollData) return;

    try {
      setProcessingId(selectedRequest.id);
      
      const result = await approvePayrollRequest(
        selectedRequest.id,
        auth.currentUser.uid,
        payrollData,
        sendMethod
      );

      if (result.success) {
        alert('Data payroll berhasil dikirim!');
        setShowPayrollModal(false);
        setSelectedRequest(null);
        setPayrollData(null);
        
        // Refresh requests list
        const requests = await getPendingPayrollRequests();
        setPayrollRequests(requests);
      } else {
        alert('Gagal mengirim data payroll: ' + result.message);
      }
    } catch (error) {
      console.error('Send payroll error:', error);
      alert('Terjadi kesalahan saat mengirim data payroll.');
    } finally {
      setProcessingId(null);
    }
  };

  const confirmReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      alert('Alasan penolakan harus diisi');
      return;
    }

    try {
      setProcessingId(selectedRequest.id);
      
      const result = await rejectPayrollRequest(
        selectedRequest.id,
        auth.currentUser.uid,
        rejectionReason
      );

      if (result.success) {
        alert('Request payroll ditolak');
        setShowRejectModal(false);
        setSelectedRequest(null);
        setRejectionReason('');
        
        // Refresh requests list
        const requests = await getPendingPayrollRequests();
        setPayrollRequests(requests);
      } else {
        alert('Gagal menolak request: ' + result.message);
      }
    } catch (error) {
      console.error('Reject request error:', error);
      alert('Terjadi kesalahan saat menolak request.');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Menunggu' },
      approved: { color: 'bg-green-100 text-green-800', text: 'Disetujui' },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Ditolak' },
      sent: { color: 'bg-blue-100 text-blue-800', text: 'Terkirim' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('id-ID');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Payroll</h1>
          <p className="mt-2 text-gray-600">
            Kelola request data payroll dari karyawan dan kirim data via WhatsApp/Email.
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Requests</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {payrollRequests.filter(r => r.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Approved Today</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {payrollRequests.filter(r => r.status === 'approved' && 
                    r.reviewedAt && new Date(r.reviewedAt.toDate()).toDateString() === new Date().toDateString()).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Sent via WhatsApp</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {payrollRequests.filter(r => r.sentVia && (r.sentVia === 'whatsapp' || r.sentVia === 'both')).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Sent via Email</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {payrollRequests.filter(r => r.sentVia && (r.sentVia === 'email' || r.sentVia === 'both')).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Request Payroll Pending</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Karyawan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Periode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal Request
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payrollRequests.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      Tidak ada request payroll pending
                    </td>
                  </tr>
                ) : (
                  payrollRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{request.userName}</div>
                          <div className="text-sm text-gray-500">{request.userEmail}</div>
                          <div className="text-sm text-gray-500">{request.department} - {request.position}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getMonthName(request.month)} {request.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.requestType === 'salary' ? 'Gaji Pokok' :
                         request.requestType === 'overtime' ? 'Lembur' :
                         request.requestType === 'bonus' ? 'Bonus' :
                         request.requestType === 'deduction' ? 'Potongan' : request.requestType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(request.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(request.requestedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApproveRequest(request)}
                            disabled={processingId === request.id}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          >
                            {processingId === request.id ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request)}
                            disabled={processingId === request.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payroll Data Modal */}
        {showPayrollModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Generate & Kirim Data Payroll
                </h3>
                
                {!payrollData ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">
                      Generate data payroll untuk {selectedRequest?.userName} periode {getMonthName(selectedRequest?.month)} {selectedRequest?.year}
                    </p>
                    <button
                      onClick={generatePayrollData}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                    >
                      Generate Data Payroll
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Payroll Data Preview */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Preview Data Payroll:</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><strong>Nama:</strong> {payrollData.employeeInfo.name}</p>
                          <p><strong>NIK:</strong> {payrollData.employeeInfo.nik}</p>
                          <p><strong>Departemen:</strong> {payrollData.employeeInfo.department}</p>
                        </div>
                        <div>
                          <p><strong>Periode:</strong> {payrollData.period.monthName} {payrollData.period.year}</p>
                          <p><strong>Hari Kerja:</strong> {payrollData.salary.workDays} hari</p>
                          <p><strong>Total Jam:</strong> {payrollData.salary.totalHours} jam</p>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-white rounded border">
                        <p><strong>Gaji Pokok:</strong> {formatCurrency(payrollData.salary.baseSalary)}</p>
                        <p><strong>Gaji Regular:</strong> {formatCurrency(payrollData.salary.regularPay)}</p>
                        <p><strong>Gaji Lembur:</strong> {formatCurrency(payrollData.salary.overtimePay)}</p>
                        <p><strong>Total Gaji:</strong> {formatCurrency(payrollData.salary.totalSalary)}</p>
                        <p><strong>Gaji Bersih:</strong> {formatCurrency(payrollData.salary.netSalary)}</p>
                      </div>
                    </div>

                    {/* Send Method Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kirim Via:
                      </label>
                      <select
                        value={sendMethod}
                        onChange={(e) => setSendMethod(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="both">WhatsApp & Email</option>
                        <option value="whatsapp">WhatsApp Only</option>
                        <option value="email">Email Only</option>
                      </select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-4">
                      <button
                        onClick={() => {
                          setShowPayrollModal(false);
                          setSelectedRequest(null);
                          setPayrollData(null);
                        }}
                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                      >
                        Batal
                      </button>
                      <button
                        onClick={sendPayrollData}
                        disabled={processingId === selectedRequest?.id}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
                      >
                        {processingId === selectedRequest?.id ? 'Mengirim...' : 'Kirim Data'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Tolak Request Payroll
                </h3>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Request dari: <strong>{selectedRequest?.userName}</strong>
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    Periode: {getMonthName(selectedRequest?.month)} {selectedRequest?.year}
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alasan Penolakan:
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Jelaskan alasan penolakan..."
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => {
                      setShowRejectModal(false);
                      setSelectedRequest(null);
                      setRejectionReason('');
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                  >
                    Batal
                  </button>
                  <button
                    onClick={confirmReject}
                    disabled={processingId === selectedRequest?.id}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
                  >
                    {processingId === selectedRequest?.id ? 'Processing...' : 'Tolak Request'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PayrollManagement; 
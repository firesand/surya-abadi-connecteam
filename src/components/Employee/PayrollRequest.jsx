// src/components/Employee/PayrollRequest.jsx
import { useState, useEffect } from 'react';
import { auth, db } from '../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
  createPayrollRequest,
  getUserPayrollRequests,
  validatePayrollRequest,
  getMonthName
} from '../../services/payrollService';

function PayrollRequest() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payrollRequests, setPayrollRequests] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'salary',
    period: 'monthly',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    reason: ''
  });
  const [errors, setErrors] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // Get user data
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }

        // Get user's payroll requests
        const requests = await getUserPayrollRequests(user.uid);
        setPayrollRequests(requests);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors([]);
    setSuccessMessage('');

    try {
      // Validate form data
      const validation = validatePayrollRequest(formData);
      if (!validation.isValid) {
        setErrors(validation.errors);
        setSubmitting(false);
        return;
      }

      // Create payroll request
      const result = await createPayrollRequest(auth.currentUser.uid, userData, formData);
      
      if (result.success) {
        setSuccessMessage('Request payroll berhasil dikirim! Admin akan memproses dan mengirim data via WhatsApp/Email.');
        setFormData({
          type: 'salary',
          period: 'monthly',
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          reason: ''
        });
        setShowForm(false);
        
        // Refresh requests list
        const requests = await getUserPayrollRequests(auth.currentUser.uid);
        setPayrollRequests(requests);
      } else {
        setErrors([result.message || 'Gagal mengirim request']);
      }
    } catch (error) {
      console.error('Submit error:', error);
      setErrors(['Terjadi kesalahan. Silakan coba lagi.']);
    } finally {
      setSubmitting(false);
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Request Data Payroll</h1>
          <p className="mt-2 text-gray-600">
            Ajukan permintaan data payroll untuk periode tertentu. Data akan dikirim via WhatsApp dan Email.
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Messages */}
        {errors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <ul className="text-sm text-red-800">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {showForm ? 'Batal' : 'Request Payroll Baru'}
          </button>
        </div>

        {/* Request Form */}
        {showForm && (
          <div className="mb-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Form Request Payroll</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Request Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipe Request
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="salary">Gaji Pokok</option>
                    <option value="overtime">Lembur</option>
                    <option value="bonus">Bonus</option>
                    <option value="deduction">Potongan</option>
                  </select>
                </div>

                {/* Period */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Periode
                  </label>
                  <select
                    name="period"
                    value={formData.period}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="monthly">Bulanan</option>
                    <option value="quarterly">Triwulan</option>
                    <option value="yearly">Tahunan</option>
                  </select>
                </div>

                {/* Month */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bulan
                  </label>
                  <select
                    name="month"
                    value={formData.month}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <option key={month} value={month}>
                        {getMonthName(month)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tahun
                  </label>
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alasan Request (Opsional)
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Jelaskan alasan request data payroll..."
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Mengirim...
                    </>
                  ) : (
                    'Kirim Request'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Requests History */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Riwayat Request Payroll</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
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
                    Dikirim Via
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payrollRequests.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      Belum ada request payroll
                    </td>
                  </tr>
                ) : (
                  payrollRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.sentVia ? (
                          <span className="text-blue-600">
                            {request.sentVia === 'both' ? 'WhatsApp & Email' :
                             request.sentVia === 'whatsapp' ? 'WhatsApp' :
                             request.sentVia === 'email' ? 'Email' : request.sentVia}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PayrollRequest; 
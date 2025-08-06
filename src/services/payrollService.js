// src/services/payrollService.js
import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { sendWhatsAppDirect, notifyApprovalViaWhatsApp } from './whatsappService';
import { sendApprovalEmail, sendNotification } from './emailService';

// ============================================
// PAYROLL DATA STRUCTURES
// ============================================

/**
 * Payroll Request Structure
 */
export const createPayrollRequest = async (userId, userData, requestData) => {
  try {
    const payrollRequest = {
      userId,
      userName: userData.name,
      userEmail: userData.email,
      userPhone: userData.phoneNumber,
      department: userData.department,
      position: userData.position,
      requestType: requestData.type, // 'salary', 'overtime', 'bonus', 'deduction'
      period: requestData.period, // 'monthly', 'quarterly', 'yearly'
      month: requestData.month, // 1-12
      year: requestData.year,
      reason: requestData.reason || '',
      status: 'pending', // 'pending', 'approved', 'rejected', 'sent'
      requestedAt: serverTimestamp(),
      reviewedBy: null,
      reviewedAt: null,
      adminComment: '',
      sentVia: null, // 'whatsapp', 'email', 'both'
      sentAt: null
    };

    const docRef = await addDoc(collection(db, 'payrollRequests'), payrollRequest);
    return { success: true, id: docRef.id, data: payrollRequest };
  } catch (error) {
    console.error('Create payroll request error:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Get payroll requests for a user
 */
export const getUserPayrollRequests = async (userId) => {
  try {
    const q = query(
      collection(db, 'payrollRequests'),
      where('userId', '==', userId),
      orderBy('requestedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Get user payroll requests error:', error);
    return [];
  }
};

/**
 * Get all pending payroll requests (admin)
 */
export const getPendingPayrollRequests = async () => {
  try {
    const q = query(
      collection(db, 'payrollRequests'),
      where('status', '==', 'pending'),
      orderBy('requestedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Get pending payroll requests error:', error);
    return [];
  }
};

/**
 * Approve payroll request and send data
 */
export const approvePayrollRequest = async (requestId, adminId, payrollData, sendMethod = 'both') => {
  try {
    // Update request status
    await updateDoc(doc(db, 'payrollRequests', requestId), {
      status: 'approved',
      reviewedBy: adminId,
      reviewedAt: serverTimestamp(),
      adminComment: 'Data payroll telah disiapkan dan dikirim',
      sentVia: sendMethod,
      sentAt: serverTimestamp()
    });

    // Get the request data
    const requestDoc = await getDoc(doc(db, 'payrollRequests', requestId));
    const requestData = requestDoc.data();

    // Send payroll data via WhatsApp and/or Email
    const sendResults = await sendPayrollData(requestData, payrollData, sendMethod);

    return { 
      success: true, 
      sendResults,
      message: 'Payroll request approved and data sent successfully'
    };
  } catch (error) {
    console.error('Approve payroll request error:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Reject payroll request
 */
export const rejectPayrollRequest = async (requestId, adminId, reason) => {
  try {
    await updateDoc(doc(db, 'payrollRequests', requestId), {
      status: 'rejected',
      reviewedBy: adminId,
      reviewedAt: serverTimestamp(),
      adminComment: reason
    });

    return { success: true };
  } catch (error) {
    console.error('Reject payroll request error:', error);
    return { success: false, message: error.message };
  }
};

// ============================================
// PAYROLL CALCULATION FUNCTIONS
// ============================================

/**
 * Calculate salary based on attendance
 */
export const calculateSalary = async (userId, month, year) => {
  try {
    // Get user data
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();

    // Get attendance for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const q = query(
      collection(db, 'attendances'),
      where('userId', '==', userId),
      where('date', '>=', startDate.toISOString().split('T')[0]),
      where('date', '<=', endDate.toISOString().split('T')[0])
    );
    
    const snapshot = await getDocs(q);
    const attendances = snapshot.docs.map(doc => doc.data());

    // Calculate work days and hours
    const workDays = attendances.length;
    const totalHours = attendances.reduce((sum, att) => {
      if (att.workHours) return sum + att.workHours;
      return sum + 8; // Default 8 hours per day
    }, 0);

    // Calculate overtime
    const regularHours = workDays * 8;
    const overtimeHours = Math.max(0, totalHours - regularHours);

    // Basic salary calculation (example - adjust based on your company policy)
    const baseSalary = userData.baseSalary || 3000000; // Default 3M IDR
    const dailyRate = baseSalary / 22; // Assuming 22 working days per month
    const hourlyRate = dailyRate / 8;
    const overtimeRate = hourlyRate * 1.5; // 1.5x for overtime

    const salary = {
      baseSalary: baseSalary,
      workDays: workDays,
      totalHours: totalHours,
      regularHours: regularHours,
      overtimeHours: overtimeHours,
      regularPay: workDays * dailyRate,
      overtimePay: overtimeHours * overtimeRate,
      totalSalary: (workDays * dailyRate) + (overtimeHours * overtimeRate),
      deductions: 0,
      netSalary: (workDays * dailyRate) + (overtimeHours * overtimeRate)
    };

    return salary;
  } catch (error) {
    console.error('Calculate salary error:', error);
    return null;
  }
};

/**
 * Generate payroll report
 */
export const generatePayrollReport = async (userId, month, year) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();
    
    const salary = await calculateSalary(userId, month, year);
    
    if (!salary) {
      return null;
    }

    const report = {
      employeeInfo: {
        name: userData.name,
        nik: userData.nik,
        employeeId: userData.employeeId,
        department: userData.department,
        position: userData.position,
        joinDate: userData.joinDate
      },
      period: {
        month: month,
        year: year,
        monthName: new Date(year, month - 1).toLocaleString('id-ID', { month: 'long' })
      },
      salary: salary,
      generatedAt: new Date().toISOString()
    };

    return report;
  } catch (error) {
    console.error('Generate payroll report error:', error);
    return null;
  }
};

// ============================================
// NOTIFICATION FUNCTIONS
// ============================================

/**
 * Send payroll data via WhatsApp
 */
export const sendPayrollViaWhatsApp = async (requestData, payrollData) => {
  try {
    const message = generatePayrollWhatsAppMessage(requestData, payrollData);
    
    // Send via WhatsApp
    const result = sendWhatsAppDirect(requestData.userPhone, message);
    
    return { success: true, method: 'whatsapp', link: result };
  } catch (error) {
    console.error('Send payroll via WhatsApp error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send payroll data via Email
 */
export const sendPayrollViaEmail = async (requestData, payrollData) => {
  try {
    const emailData = {
      name: requestData.userName,
      email: requestData.userEmail,
      subject: `Data Payroll ${payrollData.period.monthName} ${payrollData.period.year}`,
      message: generatePayrollEmailMessage(requestData, payrollData)
    };

    const result = await sendNotification('payroll', emailData, { payrollData });
    
    return { success: true, method: 'email', result };
  } catch (error) {
    console.error('Send payroll via email error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send payroll data via both methods
 */
export const sendPayrollData = async (requestData, payrollData, method = 'both') => {
  const results = {
    whatsapp: null,
    email: null
  };

  try {
    if (method === 'whatsapp' || method === 'both') {
      results.whatsapp = await sendPayrollViaWhatsApp(requestData, payrollData);
    }

    if (method === 'email' || method === 'both') {
      results.email = await sendPayrollViaEmail(requestData, payrollData);
    }

    return results;
  } catch (error) {
    console.error('Send payroll data error:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// MESSAGE TEMPLATES
// ============================================

/**
 * Generate WhatsApp message for payroll data
 */
export const generatePayrollWhatsAppMessage = (requestData, payrollData) => {
  const { employeeInfo, period, salary } = payrollData;
  
  return `
📊 *DATA PAYROLL ${period.monthName.toUpperCase()} ${period.year}*

👤 *INFORMASI KARYAWAN:*
• Nama: ${employeeInfo.name}
• NIK: ${employeeInfo.nik}
• ID: ${employeeInfo.employeeId}
• Departemen: ${employeeInfo.department}
• Jabatan: ${employeeInfo.position}

📅 *PERIODE:*
• Bulan: ${period.monthName} ${period.year}

💰 *RINCIAN GAJI:*
• Gaji Pokok: Rp ${salary.baseSalary.toLocaleString('id-ID')}
• Hari Kerja: ${salary.workDays} hari
• Total Jam: ${salary.totalHours} jam
• Jam Regular: ${salary.regularHours} jam
• Jam Lembur: ${salary.overtimeHours} jam

💵 *PERHITUNGAN:*
• Gaji Regular: Rp ${salary.regularPay.toLocaleString('id-ID')}
• Gaji Lembur: Rp ${salary.overtimePay.toLocaleString('id-ID')}
• Total Gaji: Rp ${salary.totalSalary.toLocaleString('id-ID')}
• Potongan: Rp ${salary.deductions.toLocaleString('id-ID')}
• Gaji Bersih: Rp ${salary.netSalary.toLocaleString('id-ID')}

📋 *CATATAN:*
• Data ini bersifat rahasia
• Simpan dengan baik
• Untuk pertanyaan hubungi HR

*PT Surya Abadi*
Generated: ${new Date().toLocaleString('id-ID')}
`.trim();
};

/**
 * Generate email message for payroll data
 */
export const generatePayrollEmailMessage = (requestData, payrollData) => {
  const { employeeInfo, period, salary } = payrollData;
  
  return `
Halo ${employeeInfo.name},

Berikut adalah data payroll Anda untuk periode ${period.monthName} ${period.year}:

INFORMASI KARYAWAN:
- Nama: ${employeeInfo.name}
- NIK: ${employeeInfo.nik}
- ID: ${employeeInfo.employeeId}
- Departemen: ${employeeInfo.department}
- Jabatan: ${employeeInfo.position}

PERIODE: ${period.monthName} ${period.year}

RINCIAN GAJI:
- Gaji Pokok: Rp ${salary.baseSalary.toLocaleString('id-ID')}
- Hari Kerja: ${salary.workDays} hari
- Total Jam: ${salary.totalHours} jam
- Jam Regular: ${salary.regularHours} jam
- Jam Lembur: ${salary.overtimeHours} jam

PERHITUNGAN:
- Gaji Regular: Rp ${salary.regularPay.toLocaleString('id-ID')}
- Gaji Lembur: Rp ${salary.overtimePay.toLocaleString('id-ID')}
- Total Gaji: Rp ${salary.totalSalary.toLocaleString('id-ID')}
- Potongan: Rp ${salary.deductions.toLocaleString('id-ID')}
- Gaji Bersih: Rp ${salary.netSalary.toLocaleString('id-ID')}

CATATAN:
- Data ini bersifat rahasia
- Simpan dengan baik
- Untuk pertanyaan hubungi HR

Terima kasih,
PT Surya Abadi
`.trim();
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format currency to Indonesian Rupiah
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

/**
 * Get month name in Indonesian
 */
export const getMonthName = (month) => {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return months[month - 1];
};

/**
 * Validate payroll request data
 */
export const validatePayrollRequest = (requestData) => {
  const errors = [];

  if (!requestData.type) {
    errors.push('Tipe request harus diisi');
  }

  if (!requestData.period) {
    errors.push('Periode harus diisi');
  }

  if (!requestData.month || requestData.month < 1 || requestData.month > 12) {
    errors.push('Bulan harus valid (1-12)');
  }

  if (!requestData.year || requestData.year < 2020) {
    errors.push('Tahun harus valid');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export default {
  createPayrollRequest,
  getUserPayrollRequests,
  getPendingPayrollRequests,
  approvePayrollRequest,
  rejectPayrollRequest,
  calculateSalary,
  generatePayrollReport,
  sendPayrollData,
  formatCurrency,
  getMonthName,
  validatePayrollRequest
}; 
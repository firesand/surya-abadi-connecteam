// src/services/emailService.js
import emailjs from '@emailjs/browser';

// ============================================
// EMAILJS CONFIGURATION
// ============================================

// Initialize EmailJS - Call this once in your App.jsx
export const initEmailJS = () => {
  // Replace with your actual Public Key from EmailJS Dashboard
  emailjs.init('YOUR_EMAILJS_PUBLIC_KEY');
  console.log('EmailJS initialized');
};

// EmailJS Credentials (Get from https://www.emailjs.com/dashboard)
const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID'; // e.g., 'service_abc123'
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID'; // e.g., 'template_xyz789'

// ============================================
// EMAIL NOTIFICATION FUNCTIONS
// ============================================

// Send approval/rejection email
export const sendApprovalEmail = async (userData, status = 'approved') => {
  const templateParams = {
    to_name: userData.name,
    to_email: userData.email,
    from_name: 'HR Surya Abadi',
    status: status === 'approved' ? 'DISETUJUI' : 'DITOLAK',
    user_email: userData.email,
    login_url: 'https://surya-abadi-connecteam.vercel.app',
    message: status === 'approved'
      ? `Selamat! Registrasi Anda telah disetujui. Anda sekarang dapat login menggunakan email dan password yang telah didaftarkan.`
      : `Mohon maaf, registrasi Anda belum dapat disetujui. Silakan hubungi HR untuk informasi lebih lanjut.`,
    approved: status === 'approved'
  };

  try {
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );
    console.log('Email sent successfully:', response);
    return { success: true, response };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error };
  }
};

// Send late check-in alert to admin
export const sendLateAlert = async (adminEmail, employeeData) => {
  const templateParams = {
    to_email: adminEmail,
    to_name: 'Admin',
    employee_name: employeeData.name,
    check_in_time: employeeData.checkInTime,
    date: new Date().toLocaleDateString('id-ID'),
    department: employeeData.department || 'N/A',
    message: `${employeeData.name} telah melakukan check-in terlambat pada pukul ${employeeData.checkInTime}.`
  };

  try {
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );
    return { success: true, response };
  } catch (error) {
    console.error('Late alert email failed:', error);
    return { success: false, error };
  }
};

// Send daily reminder email
export const sendDailyReminder = async (employeeEmail, employeeName) => {
  const templateParams = {
    to_email: employeeEmail,
    to_name: employeeName,
    date: new Date().toLocaleDateString('id-ID'),
    office_hours: '08:00 - 17:00',
    login_url: 'https://surya-abadi-connecteam.vercel.app',
    message: `Pengingat: Jangan lupa untuk melakukan check-in hari ini. Office hours: 08:00 - 17:00.`
  };

  try {
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );
    return { success: true, response };
  } catch (error) {
    console.error('Daily reminder email failed:', error);
    return { success: false, error };
  }
};

// Send monthly report email
export const sendMonthlyReport = async (recipientEmail, reportData) => {
  const templateParams = {
    to_email: recipientEmail,
    to_name: reportData.recipientName,
    month: reportData.month,
    year: reportData.year,
    total_employees: reportData.totalEmployees,
    total_work_days: reportData.totalWorkDays,
    avg_attendance: reportData.avgAttendance,
    total_late: reportData.totalLate,
    perfect_attendance_count: reportData.perfectAttendance?.length || 0,
    dashboard_url: 'https://surya-abadi-connecteam.vercel.app/admin',
    message: `Laporan attendance bulanan ${reportData.month} ${reportData.year} telah tersedia.`
  };

  try {
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );
    console.log('Monthly report email sent:', response);
    return { success: true, response };
  } catch (error) {
    console.error('Monthly report email failed:', error);
    return { success: false, error };
  }
};

// ============================================
// SIMPLE MAILTO FALLBACK
// ============================================

export const sendEmailSimple = (email, subject, body) => {
  const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailtoLink;
};

// Generate approval email with mailto
export const generateApprovalMailto = (userData, status = 'approved') => {
  const subject = `Registrasi ${status === 'approved' ? 'Disetujui' : 'Ditolak'} - Surya Abadi`;

  const body = status === 'approved'
    ? `Halo ${userData.name},

Selamat! Registrasi Anda telah DISETUJUI.

Anda sekarang dapat login menggunakan:
Email: ${userData.email}
Password: (yang telah Anda daftarkan)

Login di: https://surya-abadi-connecteam.vercel.app

Terima kasih,
HR Surya Abadi`
    : `Halo ${userData.name},

Mohon maaf, registrasi Anda belum dapat disetujui.
Silakan hubungi HR untuk informasi lebih lanjut.

Terima kasih,
HR Surya Abadi`;

  sendEmailSimple(userData.email, subject, body);
};

// ============================================
// BULK EMAIL FUNCTIONS
// ============================================

export const sendBulkEmails = async (recipients, subject, messageTemplate) => {
  const results = [];

  for (const recipient of recipients) {
    // Personalize message
    const personalizedMessage = messageTemplate
      .replace('{name}', recipient.name)
      .replace('{email}', recipient.email)
      .replace('{department}', recipient.department || 'N/A');

    const templateParams = {
      to_email: recipient.email,
      to_name: recipient.name,
      subject: subject,
      message: personalizedMessage
    };

    try {
      const response = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams
      );
      results.push({
        recipient: recipient.email,
        success: true,
        response
      });
    } catch (error) {
      results.push({
        recipient: recipient.email,
        success: false,
        error
      });
    }

    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
};

// ============================================
// EMAIL TEMPLATE CONFIGURATIONS
// ============================================

export const emailTemplates = {
  approval: {
    subject: 'Registrasi Disetujui - Surya Abadi',
    body: `Selamat! Registrasi Anda telah disetujui. Login sekarang di: https://surya-abadi-connecteam.vercel.app`
  },
  rejection: {
    subject: 'Registrasi Ditolak - Surya Abadi',
    body: `Mohon maaf, registrasi Anda belum dapat disetujui. Silakan hubungi HR untuk informasi lebih lanjut.`
  },
  reminder: {
    subject: 'Reminder: Check-in Hari Ini',
    body: `Jangan lupa untuk melakukan check-in hari ini. Office hours: 08:00 - 17:00`
  },
  late: {
    subject: 'Alert: Late Check-in',
    body: `Ada karyawan yang terlambat check-in. Silakan cek dashboard untuk detail.`
  },
  monthlyReport: {
    subject: 'Laporan Bulanan Attendance',
    body: `Laporan attendance bulanan telah tersedia. Silakan cek dashboard admin.`
  }
};

// ============================================
// COMBINED NOTIFICATION SERVICE
// ============================================

export const sendNotification = async (type, userData, options = {}) => {
  const results = {
    email: null,
    whatsapp: null
  };

  // Send email if EmailJS is configured
  if (EMAILJS_SERVICE_ID !== 'YOUR_SERVICE_ID') {
    try {
      switch (type) {
        case 'approval':
          results.email = await sendApprovalEmail(userData, 'approved');
          break;
        case 'rejection':
          results.email = await sendApprovalEmail(userData, 'rejected');
          break;
        case 'reminder':
          results.email = await sendDailyReminder(userData.email, userData.name);
          break;
        case 'late':
          results.email = await sendLateAlert(options.adminEmail, userData);
          break;
        case 'report':
          results.email = await sendMonthlyReport(userData.email, options.reportData);
          break;
        default:
          console.log('Unknown notification type:', type);
      }
    } catch (error) {
      console.error('Email notification failed:', error);
    }
  } else {
    // Fallback to mailto if EmailJS not configured
    generateApprovalMailto(userData, type === 'approval' ? 'approved' : 'rejected');
  }

  return results;
};

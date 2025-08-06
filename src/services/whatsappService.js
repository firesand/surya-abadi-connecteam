// src/services/whatsappService.js

/**
 * WhatsApp Notification Service
 * Simple implementation using WhatsApp Web Link (FREE)
 * No external dependencies required
 */

// ============================================
// OPTION 1: Direct WhatsApp Link (FREE) - PRIMARY METHOD
// ============================================

/**
 * Send WhatsApp message via direct link (opens WhatsApp Web/App)
 * @param {string} phoneNumber - Phone number (with or without country code)
 * @param {string} message - Message to send
 * @returns {string} WhatsApp link
 */
export const sendWhatsAppDirect = (phoneNumber, message) => {
  // Format phone number: Remove 0, add 62 for Indonesia
  const formattedNumber = phoneNumber.startsWith('0')
  ? '62' + phoneNumber.substring(1)
  : phoneNumber.startsWith('+')
  ? phoneNumber.substring(1)
  : phoneNumber;

  // Create WhatsApp link
  const waLink = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`;

  // Open in new tab
  window.open(waLink, '_blank');

  return waLink;
};

/**
 * Send approval/rejection notification
 * @param {Object} employeeData - Employee information
 * @param {string} status - 'approved' or 'rejected'
 */
export const notifyApprovalViaWhatsApp = (employeeData, status = 'approved') => {
  const message = status === 'approved'
  ? `
  🎉 *SELAMAT ${employeeData.name}!*

  Registrasi Anda telah *DISETUJUI* ✅

  📱 *Informasi Login:*
  • Email: ${employeeData.email}
  • Password: (yang Anda daftarkan)
  • Status: Aktif

  🔗 Login sekarang:
  https://surya-abadi-connecteam.vercel.app

  Silakan login dan mulai melakukan check-in/check-out sesuai jadwal kerja.

  Jam Kerja:
  • Check-in: 08:00 WIB
  • Check-out: 17:00 WIB

  Terima kasih,
  *HR Surya Abadi*
  `.trim()
  : `
  Halo ${employeeData.name},

  Mohon maaf, registrasi Anda belum dapat disetujui.

  Alasan: Verifikasi data diperlukan
  Silakan hubungi HR untuk informasi lebih lanjut.

  📞 Kontak HR:
  • WhatsApp: 081234567890
  • Email: hr@suryaabadi.com

  Terima kasih,
  *HR Surya Abadi*
  `.trim();

  return sendWhatsAppDirect(employeeData.phoneNumber, message);
};

/**
 * Send late check-in alert to admin
 * @param {string} adminPhone - Admin phone number
 * @param {string} employeeName - Name of late employee
 * @param {string} checkInTime - Actual check-in time
 */
export const notifyLateCheckIn = (adminPhone, employeeName, checkInTime) => {
  const message = `
  ⚠️ *LATE CHECK-IN ALERT*

  Employee: *${employeeName}*
  Check-in Time: ${checkInTime}
  Status: *LATE* ⏰

  Expected: 08:00 WIB
  Actual: ${checkInTime}

  Please review in dashboard:
  https://surya-abadi-connecteam.vercel.app/admin

  *Automated Alert System*
  `.trim();

  return sendWhatsAppDirect(adminPhone, message);
};

/**
 * Send daily reminder to employee
 * @param {string} phoneNumber - Employee phone number
 * @param {string} name - Employee name
 */
export const sendDailyReminder = (phoneNumber, name) => {
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Selamat Pagi' : 'Selamat Siang';

  const message = `
  ${greeting} *${name}*! ☀️

  *Reminder Check-in Hari Ini*

  ⏰ Jam Kerja: 08:00 - 17:00 WIB
  📍 Lokasi: Dalam radius 50m dari kantor

  Jangan lupa untuk:
  ✅ Check-in tepat waktu
  📸 Foto selfie saat check-in
  📍 Pastikan GPS aktif

  Check-in sekarang:
  https://surya-abadi-connecteam.vercel.app

  *PT Surya Abadi*
  Sistem Absensi Digital
  `.trim();

  return sendWhatsAppDirect(phoneNumber, message);
};

/**
 * Send monthly report summary via WhatsApp
 * @param {string} phoneNumber - Recipient phone number
 * @param {Object} reportSummary - Report data
 */
export const sendMonthlyReportWhatsApp = (phoneNumber, reportSummary) => {
  const message = `
  📊 *LAPORAN BULANAN ATTENDANCE*
  ${reportSummary.month} ${reportSummary.year}

  📈 *RINGKASAN:*
  • Total Karyawan: ${reportSummary.totalEmployees}
  • Hari Kerja: ${reportSummary.totalWorkDays} hari
  • Rata-rata Kehadiran: ${reportSummary.avgAttendance}

  📊 *STATISTIK:*
  • Total Hadir: ${reportSummary.totalPresent || 0}
  • Tepat Waktu: ${reportSummary.totalOnTime || 0}
  • Terlambat: ${reportSummary.totalLate || 0}
  • Tidak Hadir: ${reportSummary.totalAbsent || 0}

  🏆 *PERFECT ATTENDANCE:*
  ${reportSummary.perfectAttendance && reportSummary.perfectAttendance.length > 0
    ? reportSummary.perfectAttendance.map(emp => `• ${emp.name}`).join('\n')
    : 'Tidak ada'}

    📥 Download laporan lengkap:
    https://surya-abadi-connecteam.vercel.app/admin

    *HR Surya Abadi*
    Generated: ${new Date().toLocaleString('id-ID')}
    `.trim();

    return sendWhatsAppDirect(phoneNumber, message);
};

// ============================================
// BULK MESSAGING
// ============================================

/**
 * Send bulk WhatsApp messages with delay
 * @param {Array} recipients - Array of {phone, name} objects
 * @param {string} messageTemplate - Message template with {name} placeholder
 * @returns {Array} Results array
 */
export const sendBulkWhatsApp = (recipients, messageTemplate) => {
  const results = [];
  let successCount = 0;

  recipients.forEach((recipient, index) => {
    // Add delay to avoid being flagged as spam
    setTimeout(() => {
      try {
        const personalizedMessage = messageTemplate.replace('{name}', recipient.name);
        const link = sendWhatsAppDirect(recipient.phone, personalizedMessage);
        results.push({
          recipient: recipient.name,
          phone: recipient.phone,
          status: 'sent',
          link
        });
        successCount++;

        // Show progress
        console.log(`Sent ${successCount}/${recipients.length} messages`);
      } catch (error) {
        results.push({
          recipient: recipient.name,
          phone: recipient.phone,
          status: 'failed',
          error: error.message
        });
      }
    }, index * 2000); // 2 second delay between messages
  });

  return results;
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format phone number to WhatsApp format
 * @param {string} phoneNumber - Raw phone number
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phoneNumber) => {
  // Remove all non-numeric characters
  let cleaned = phoneNumber.replace(/\D/g, '');

  // Handle Indonesian numbers
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }

  return cleaned;
};

/**
 * Generate WhatsApp QR Code for easy sharing
 * @param {string} phoneNumber - Phone number
 * @param {string} message - Message to encode
 * @returns {string} QR code URL
 */
export const generateWhatsAppQR = (phoneNumber, message) => {
  const formattedNumber = formatPhoneNumber(phoneNumber);
  const waLink = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`;

  // Generate QR Code using qr-server API (free service)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(waLink)}`;

  return qrCodeUrl;
};

// ============================================
// TEMPLATES
// ============================================

export const messageTemplates = {
  approval: {
    subject: 'Registrasi Disetujui',
    template: `Selamat {name}! Registrasi Anda telah disetujui. Silakan login di: https://surya-abadi-connecteam.vercel.app`
  },
  rejection: {
    subject: 'Registrasi Ditolak',
    template: `Halo {name}, mohon maaf registrasi Anda belum dapat disetujui. Silakan hubungi HR.`
  },
  reminder: {
    subject: 'Reminder Check-in',
    template: `Pagi {name}! Jangan lupa check-in hari ini ya. Jam kerja: 08:00-17:00 WIB`
  },
  late: {
    subject: 'Alert Keterlambatan',
    template: `{name} terlambat check-in. Waktu check-in: {time}`
  },
  report: {
    subject: 'Laporan Bulanan',
    template: `Laporan attendance bulan {month} telah tersedia. Silakan cek dashboard.`
  }
};

// ============================================
// INTEGRATION HELPERS
// ============================================

/**
 * Handle approval with WhatsApp notification
 * @param {Object} registration - Registration data
 * @param {string} status - 'approved' or 'rejected'
 */
export const handleApprovalWithWhatsApp = (registration, status) => {
  try {
    // Send WhatsApp notification
    notifyApprovalViaWhatsApp(registration, status);

    // Log for tracking
    console.log(`WhatsApp notification sent for ${registration.name} - Status: ${status}`);

    return {
      success: true,
      message: 'WhatsApp notification opened successfully'
    };
  } catch (error) {
    console.error('Error sending WhatsApp notification:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Check if WhatsApp Web is available
 * @returns {boolean} True if desktop/web, false if mobile
 */
export const isWhatsAppWebAvailable = () => {
  // Check if user is on desktop
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  return !isMobile;
};

// ============================================
// EXPORT ALL FUNCTIONS
// ============================================

export default {
  sendWhatsAppDirect,
  notifyApprovalViaWhatsApp,
  notifyLateCheckIn,
  sendDailyReminder,
  sendMonthlyReportWhatsApp,
  sendBulkWhatsApp,
  formatPhoneNumber,
    generateWhatsAppQR,
    handleApprovalWithWhatsApp,
    isWhatsAppWebAvailable,
    messageTemplates
};

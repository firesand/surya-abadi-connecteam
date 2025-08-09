// src/config/adminConfig.js
// Admin Configuration for WhatsApp and Email notifications

export const ADMIN_CONFIG = {
  // ⚠️ UPDATE INI DENGAN NOMOR ADMIN YANG BENAR
  phone: '08118062231', // Nomor WhatsApp admin (format: 0812xxxxx)
  contactEmail: 'suryaabadi.konsultan@gmail.com', // Email admin
  name: 'Admin HR', // Nama admin untuk notifikasi
  
  // WhatsApp Configuration
  whatsapp: {
    enabled: true,
    defaultMessage: 'Halo! Ini adalah pesan dari sistem absensi PT Surya Abadi.',
    businessName: 'PT Surya Abadi',
    businessUrl: 'https://surya-abadi-connecteam.vercel.app'
  },
  
  // Email Configuration
  email: {
    enabled: true,
    fromName: 'HR Surya Abadi',
    fromEmail: 'hr@suryaabadi.com',
    replyTo: 'suryaabadi.konsultan@gmail.com'
  },
  
  // Notification Settings
  notifications: {
    sendLateAlerts: true,
    sendDailyReminders: true,
    sendApprovalNotifications: true,
    sendRejectionNotifications: true
  }
};

// WhatsApp Message Templates
export const WHATSAPP_TEMPLATES = {
  dailyReminder: (employeeName) => `
Pagi ${employeeName}! ☀️

*Reminder Check-in Hari Ini*

⏰ Jam Kerja: 08:00 - 17:00 WIB
📍 Lokasi: Dalam radius 1500m dari kantor

Jangan lupa untuk:
✅ Check-in tepat waktu
📸 Foto selfie saat check-in
📍 Pastikan GPS aktif

Check-in sekarang:
${ADMIN_CONFIG.whatsapp.businessUrl}

*${ADMIN_CONFIG.whatsapp.businessName}*
Sistem Absensi Digital
  `.trim(),
  
  approval: (employeeName, employeeEmail) => `
🎉 *SELAMAT ${employeeName}!*

Registrasi Anda telah *DISETUJUI* ✅

📱 *Informasi Login:*
• Email: ${employeeEmail}
• Password: (yang Anda daftarkan)
• Status: Aktif

🔗 Login sekarang:
${ADMIN_CONFIG.whatsapp.businessUrl}

Silakan login dan mulai melakukan check-in/check-out sesuai jadwal kerja.

Jam Kerja:
• Check-in: 08:00 WIB
• Check-out: 17:00 WIB

Terima kasih,
*${ADMIN_CONFIG.whatsapp.businessName}*
  `.trim(),
  
  rejection: (employeeName) => `
Halo ${employeeName},

Mohon maaf, registrasi Anda belum dapat disetujui.

Alasan: Verifikasi data diperlukan
Silakan hubungi HR untuk informasi lebih lanjut.

📞 Kontak HR:
• WhatsApp: ${ADMIN_CONFIG.phone}
  • Email: ${ADMIN_CONFIG.contactEmail}

Terima kasih,
*${ADMIN_CONFIG.whatsapp.businessName}*
  `.trim(),
  
  lateAlert: (employeeName, checkInTime) => `
⚠️ *LATE CHECK-IN ALERT*

Employee: *${employeeName}*
Check-in Time: ${checkInTime}
Status: *LATE* ⏰

Expected: 08:00 WIB
Actual: ${checkInTime}

Please review in dashboard:
${ADMIN_CONFIG.whatsapp.businessUrl}/admin

*Automated Alert System*
  `.trim()
};

// Email Templates
export const EMAIL_TEMPLATES = {
  dailyReminder: (employeeName) => ({
    subject: 'Reminder: Check-in Hari Ini',
    body: `
Halo ${employeeName}!

Jangan lupa untuk melakukan check-in hari ini.
Office hours: 08:00 - 17:00

Login di: ${ADMIN_CONFIG.whatsapp.businessUrl}

Terima kasih,
${ADMIN_CONFIG.email.fromName}
    `.trim()
  }),
  
  approval: (employeeName, employeeEmail) => ({
    subject: 'Registrasi Disetujui - Surya Abadi',
    body: `
Selamat ${employeeName}!

Registrasi Anda telah DISETUJUI.

Anda sekarang dapat login menggunakan:
Email: ${employeeEmail}
Password: (yang telah Anda daftarkan)

Login di: ${ADMIN_CONFIG.whatsapp.businessUrl}

Terima kasih,
${ADMIN_CONFIG.email.fromName}
    `.trim()
  }),
  
  rejection: (employeeName) => ({
    subject: 'Registrasi Ditolak - Surya Abadi',
    body: `
Halo ${employeeName},

Mohon maaf, registrasi Anda belum dapat disetujui.
Silakan hubungi HR untuk informasi lebih lanjut.

Kontak HR:
  Email: ${ADMIN_CONFIG.contactEmail}
WhatsApp: ${ADMIN_CONFIG.phone}

Terima kasih,
${ADMIN_CONFIG.email.fromName}
    `.trim()
  })
};

// Validation functions
export const validateAdminConfig = () => {
  const errors = [];
  
  if (!ADMIN_CONFIG.phone || ADMIN_CONFIG.phone === '08118062231') {
    errors.push('⚠️ Nomor admin belum diupdate! Update di src/config/adminConfig.js');
  }
  
  if (!ADMIN_CONFIG.email || ADMIN_CONFIG.email === 'firesand@gmail.com') {
    errors.push('⚠️ Email admin belum diupdate! Update di src/config/adminConfig.js');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export default ADMIN_CONFIG; 

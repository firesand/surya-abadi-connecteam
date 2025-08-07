# 📱 Mobile WhatsApp Testing Guide

## 🎯 **Tujuan**
Testing fitur daily reminder WhatsApp di perangkat mobile (Android/iOS)

## 📋 **Persiapan**

### **1. Akses Aplikasi dari Mobile**
```bash
# Pastikan server berjalan
npm run dev

# Akses dari mobile browser:
# http://[IP_ADDRESS]:5173/
# Contoh: http://192.168.1.100:5173/
```

### **2. Expose Network (Opsional)**
```bash
# Jika perlu expose ke network
npm run dev -- --host
```

## 🧪 **Testing Steps**

### **Step 1: Login Admin**
1. Buka aplikasi di mobile browser
2. Login sebagai admin
3. Masuk ke dashboard admin

### **Step 2: Test Daily Reminder**
1. Klik tab "📱 Daily Reminders"
2. Pilih "Selected Employees"
3. Pilih beberapa karyawan
4. Pilih "WhatsApp Only"
5. Tulis custom message
6. Klik "Send Reminders"

### **Step 3: Expected Behavior**
- **Android**: Akan membuka aplikasi WhatsApp dengan pesan yang sudah disiapkan
- **iOS**: Akan membuka aplikasi WhatsApp dengan pesan yang sudah disiapkan
- **Pesan akan otomatis terisi** dengan format:
  ```
  Pagi [Nama Karyawan]! Jangan lupa check-in hari ini ya. 
  Jam kerja: 08:00-17:00 WIB
  
  [Custom Message jika ada]
  ```

## 🔍 **Troubleshooting**

### **A. Jika WhatsApp tidak terbuka:**
1. Pastikan WhatsApp terinstall di mobile
2. Pastikan sudah login ke WhatsApp
3. Coba refresh browser dan test lagi

### **B. Jika pesan kosong:**
1. Cek console log untuk error
2. Pastikan data karyawan lengkap (nama, nomor telepon)
3. Cek format nomor telepon (harus +62...)

### **C. Jika ada error permission:**
1. Izinkan browser membuka aplikasi eksternal
2. Cek pengaturan browser untuk external links

## 📊 **Expected Results**

### **✅ Success Case:**
- WhatsApp terbuka otomatis
- Pesan sudah terisi dengan benar
- Admin tinggal klik "Send"
- Log menunjukkan "Sent X/X messages"

### **❌ Error Cases:**
- WhatsApp tidak terbuka → Cek instalasi WhatsApp
- Pesan kosong → Cek data karyawan
- Error permission → Izinkan external links

## 🎯 **Mobile vs Desktop Behavior**

| Platform | Behavior |
|----------|----------|
| **Desktop** | Buka WhatsApp Web (perlu login) |
| **Mobile** | Buka aplikasi WhatsApp langsung |
| **Tablet** | Buka aplikasi WhatsApp atau WhatsApp Web |

## 📝 **Notes**

- **WhatsApp Web** memerlukan login terlebih dahulu
- **Mobile app** langsung membuka dengan pesan siap kirim
- **Custom message** akan ditambahkan di akhir pesan default
- **Multiple employees** akan membuka WhatsApp untuk setiap karyawan

## 🔧 **Technical Details**

### **URL Format:**
```
https://api.whatsapp.com/send?phone=[NOMOR]&text=[PESAN_ENCODED]
```

### **Message Template:**
```
Pagi [NAMA]! Jangan lupa check-in hari ini ya. 
Jam kerja: 08:00-17:00 WIB

[CUSTOM_MESSAGE]
```

### **Phone Number Format:**
- Harus dalam format: `+6281234567890`
- Tanpa spasi atau karakter khusus
- Harus dimulai dengan kode negara (+62 untuk Indonesia) 
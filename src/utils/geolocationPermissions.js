// src/utils/geolocationPermissions.js
// Utility untuk menangani geolocation permissions

export const checkGeolocationPermission = async () => {
  console.log('🔍 Checking geolocation permission...');
  
  try {
    if (!navigator.permissions || !navigator.permissions.query) {
      console.log('Permissions API not supported');
      return { supported: false, state: 'unknown' };
    }

    const result = await navigator.permissions.query({ name: 'geolocation' });
    console.log('📍 Geolocation permission state:', result.state);
    
    return {
      supported: true,
      state: result.state,
      granted: result.state === 'granted',
      denied: result.state === 'denied',
      prompt: result.state === 'prompt'
    };
  } catch (error) {
    console.error('❌ Permission check failed:', error);
    return { supported: false, state: 'error', error: error.message };
  }
};

export const requestGeolocationPermission = () => {
  return new Promise((resolve) => {
    console.log('📍 Requesting geolocation permission...');
    
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported');
      resolve({ granted: false, error: 'Geolocation not supported' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('✅ Permission granted');
        resolve({ granted: true, position });
      },
      (error) => {
        console.warn('❌ Permission denied:', error.message);
        resolve({ granted: false, error: error.message });
      },
      { 
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  });
};

export const showGeolocationPermissionDialog = () => {
  const dialog = document.createElement('div');
  dialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  dialog.innerHTML = `
    <div class="bg-white rounded-lg p-6 max-w-md mx-4">
      <div class="text-center">
        <div class="mx-auto h-16 w-16 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
          <span class="text-white font-bold text-xl">📍</span>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">
          Izin Lokasi Diperlukan
        </h3>
        <p class="text-gray-600 mb-4">
          Aplikasi memerlukan akses lokasi untuk memvalidasi kehadiran Anda. 
          Jika Anda tidak memberikan izin, sistem akan menggunakan lokasi kantor sebagai fallback.
        </p>
        <div class="space-y-3">
          <button id="allow-location" class="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Izinkan Akses Lokasi
          </button>
          <button id="skip-location" class="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
            Gunakan Lokasi Kantor
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(dialog);

  return new Promise((resolve) => {
    dialog.querySelector('#allow-location').addEventListener('click', async () => {
      document.body.removeChild(dialog);
      const result = await requestGeolocationPermission();
      resolve(result);
    });

    dialog.querySelector('#skip-location').addEventListener('click', () => {
      document.body.removeChild(dialog);
      resolve({ granted: false, skipped: true });
    });
  });
};

export const getGeolocationStatus = () => {
  const status = {
    supported: !!navigator.geolocation,
    permissionsSupported: !!(navigator.permissions && navigator.permissions.query),
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    online: navigator.onLine
  };

  console.log('📍 Geolocation status:', status);
  return status;
};

export const provideGeolocationGuidance = (error) => {
  const guidance = {
    title: 'Masalah Lokasi',
    message: '',
    steps: [],
    action: ''
  };

  if (error.includes('permissions policy')) {
    guidance.message = 'Geolocation diblokir oleh kebijakan browser.';
    guidance.steps = [
      '1. Buka pengaturan browser',
      '2. Cari "Site settings" atau "Pengaturan situs"',
      '3. Cari "Location" atau "Lokasi"',
      '4. Ubah ke "Allow" atau "Izinkan"',
      '5. Refresh halaman'
    ];
    guidance.action = 'refresh';
  } else if (error.includes('permission denied')) {
    guidance.message = 'Izin lokasi ditolak.';
    guidance.steps = [
      '1. Klik ikon kunci di address bar',
      '2. Ubah lokasi ke "Allow"',
      '3. Refresh halaman'
    ];
    guidance.action = 'refresh';
  } else if (error.includes('timeout')) {
    guidance.message = 'Pengambilan lokasi timeout.';
    guidance.steps = [
      '1. Pastikan GPS aktif',
      '2. Pastikan koneksi internet stabil',
      '3. Coba lagi dalam beberapa detik'
    ];
    guidance.action = 'retry';
  } else {
    guidance.message = 'Terjadi masalah dengan lokasi.';
    guidance.steps = [
      '1. Pastikan browser mendukung geolocation',
      '2. Coba browser lain',
      '3. Hubungi support jika masalah berlanjut'
    ];
    guidance.action = 'support';
  }

  return guidance;
};

// Auto-check geolocation status on page load
if (typeof window !== 'undefined') {
  window.geolocationUtils = {
    checkPermission: checkGeolocationPermission,
    requestPermission: requestGeolocationPermission,
    showDialog: showGeolocationPermissionDialog,
    getStatus: getGeolocationStatus,
    provideGuidance: provideGeolocationGuidance
  };

  console.log('🔧 Geolocation utilities loaded. Use:');
  console.log('- window.geolocationUtils.checkPermission()');
  console.log('- window.geolocationUtils.requestPermission()');
  console.log('- window.geolocationUtils.showDialog()');
  console.log('- window.geolocationUtils.getStatus()');
  console.log('- window.geolocationUtils.provideGuidance(error)');
} 
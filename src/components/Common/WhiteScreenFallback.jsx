import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function WhiteScreenFallback() {
  const navigate = useNavigate();
  const [recoveryStep, setRecoveryStep] = useState('detecting');
  const [errorDetails, setErrorDetails] = useState('');
  const [cacheStatus, setCacheStatus] = useState('checking');

  useEffect(() => {
    // Auto-detect white screen and try recovery
    const detectAndRecover = async () => {
      console.log('🔍 White screen fallback activated');
      
      try {
        // Check if we're actually in a white screen state
        const root = document.getElementById('root');
        const hasContent = root && root.children.length > 0;
        
        if (!hasContent) {
          console.log('🚨 Confirmed white screen state');
          setRecoveryStep('recovering');
          
          // Try automatic recovery
          await performRecovery();
        } else {
          console.log('✅ Content detected, not white screen');
          setRecoveryStep('resolved');
        }
      } catch (error) {
        console.error('❌ Recovery error:', error);
        setRecoveryStep('manual');
        setErrorDetails(error.message);
      }
    };

    detectAndRecover();
  }, []);

  const performRecovery = async () => {
    console.log('🔄 Performing automatic recovery...');
    
    try {
      // Step 1: Clear caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        console.log('🗑️ Found caches:', cacheNames);
        
        await Promise.all(
          cacheNames.map(async (name) => {
            console.log('🗑️ Deleting cache:', name);
            await caches.delete(name);
          })
        );
        console.log('✅ All caches cleared');
      }

      // Step 2: Clear storage
      try {
        const criticalData = {
          appVersion: localStorage.getItem('appVersion'),
          deviceId: localStorage.getItem('deviceId'),
          lastLogin: localStorage.getItem('lastLogin')
        };
        
        localStorage.clear();
        sessionStorage.clear();
        
        // Restore critical data
        Object.keys(criticalData).forEach(key => {
          if (criticalData[key]) {
            localStorage.setItem(key, criticalData[key]);
          }
        });
        
        console.log('✅ Storage cleared and critical data restored');
      } catch (storageError) {
        console.error('❌ Storage clear error:', storageError);
      }

      // Step 3: Check service worker
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            console.log('🔄 Unregistering service worker...');
            await registration.unregister();
            console.log('✅ Service worker unregistered');
          }
        } catch (swError) {
          console.error('❌ Service worker error:', swError);
        }
      }

      // Step 4: Force reload
      console.log('🔄 Reloading page...');
      setTimeout(() => {
        window.location.reload(true);
      }, 2000);

    } catch (error) {
      console.error('❌ Recovery failed:', error);
      setRecoveryStep('manual');
      setErrorDetails(error.message);
    }
  };

  const handleManualRecovery = async () => {
    setRecoveryStep('recovering');
    
    try {
      await performRecovery();
    } catch (error) {
      console.error('❌ Manual recovery failed:', error);
      setRecoveryStep('manual');
      setErrorDetails(error.message);
    }
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleClearCache = async () => {
    setCacheStatus('clearing');
    
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(name => caches.delete(name))
        );
      }
      
      localStorage.clear();
      sessionStorage.clear();
      
      setCacheStatus('cleared');
      
      setTimeout(() => {
        window.location.reload(true);
      }, 1000);
      
    } catch (error) {
      console.error('❌ Cache clear failed:', error);
      setCacheStatus('failed');
    }
  };

  const handleContactSupport = () => {
    const message = `Halo support, saya mengalami white screen di aplikasi Surya Abadi Connecteam. Error: ${errorDetails}`;
    const whatsappUrl = `https://wa.me/628118062231?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Loading state
  if (recoveryStep === 'detecting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 mx-auto"></div>
          <h2 className="mt-4 text-xl font-semibold text-gray-800">Mendeteksi Masalah...</h2>
          <p className="mt-2 text-gray-600">Mohon tunggu sebentar</p>
        </div>
      </div>
    );
  }

  // Recovery in progress
  if (recoveryStep === 'recovering') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-600 mx-auto"></div>
          <h2 className="mt-4 text-xl font-semibold text-gray-800">Memperbaiki Aplikasi...</h2>
          <p className="mt-2 text-gray-600">Membersihkan cache dan memuat ulang</p>
          
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Membersihkan cache...</span>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Mengatur ulang aplikasi...</span>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Memuat ulang halaman...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Manual recovery needed
  if (recoveryStep === 'manual') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-red-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">⚠️</span>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Aplikasi Bermasalah
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Terjadi masalah pada aplikasi. Silakan coba salah satu solusi di bawah.
            </p>
          </div>

          <div className="bg-white shadow-lg rounded-lg p-6">
            <div className="space-y-4">
              {/* Error Details */}
              {errorDetails && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Error: {errorDetails}
                      </h3>
                    </div>
                  </div>
                </div>
              )}

              {/* Recovery Options */}
              <div className="space-y-3">
                <button
                  onClick={handleManualRecovery}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  Coba Perbaiki Otomatis
                </button>
                
                <button
                  onClick={handleClearCache}
                  disabled={cacheStatus === 'clearing'}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {cacheStatus === 'clearing' ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
                      Membersihkan Cache...
                    </>
                  ) : (
                    'Bersihkan Cache Manual'
                  )}
                </button>
                
                <button
                  onClick={handleGoToLogin}
                  className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Kembali ke Login
                </button>
                
                <button
                  onClick={handleGoHome}
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Kembali ke Beranda
                </button>
                
                <button
                  onClick={handleContactSupport}
                  className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Hubungi Support
                </button>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Langkah Manual:</h4>
                <div className="text-xs text-blue-700 space-y-1">
                  <p>1. Tutup aplikasi sepenuhnya</p>
                  <p>2. Buka Chrome/Safari</p>
                  <p>3. Clear browsing data</p>
                  <p>4. Buka aplikasi kembali</p>
                </div>
              </div>

              {/* Quick Fix Script */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-800 mb-2">Quick Fix (F12 Console):</h4>
                <code className="text-xs text-gray-600 block bg-gray-100 p-2 rounded">
                  {`caches.keys().then(names => names.forEach(name => caches.delete(name))); localStorage.clear(); location.reload();`}
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Resolved state
  if (recoveryStep === 'resolved') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-green-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">✅</span>
          </div>
          <h2 className="mt-4 text-xl font-semibold text-gray-800">Masalah Teratasi!</h2>
          <p className="mt-2 text-gray-600">Aplikasi sudah berfungsi normal</p>
          
          <div className="mt-6">
            <button
              onClick={handleGoHome}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Lanjutkan
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default fallback
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-16 w-16 bg-gray-500 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-xl">?</span>
        </div>
        <h2 className="mt-4 text-xl font-semibold text-gray-800">Status Tidak Diketahui</h2>
        <p className="mt-2 text-gray-600">Silakan refresh halaman</p>
        
        <div className="mt-6">
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Halaman
          </button>
        </div>
      </div>
    </div>
  );
}

export default WhiteScreenFallback; 
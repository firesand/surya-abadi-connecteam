import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';

function PendingApproval() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/login');
      return;
    }

    // Get user data and monitor for changes
    const userDocRef = doc(db, 'users', user.uid);
    
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setUserData(data);
        
        // If user is approved, redirect to dashboard
        if (data.accountStatus === 'active') {
          alert('Selamat! Akun Anda telah disetujui. Anda akan dialihkan ke dashboard.');
          navigate('/');
        }
        
        setLoading(false);
      } else {
        console.error('User document not found');
        setLoading(false);
      }
    }, (error) => {
      console.error('Error fetching user data:', error);
      setLoading(false);
    });

    // Auto-refresh timer
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleContactHR = () => {
    // Open WhatsApp with pre-filled message
    const message = `Halo HR, saya ${userData?.name} (${userData?.email}) ingin menanyakan status approval registrasi saya. Terima kasih.`;
    const whatsappUrl = `https://wa.me/628118062231?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-yellow-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">⏳</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Menunggu Persetujuan
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Registrasi Anda sedang diproses oleh admin
          </p>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="space-y-4">
            {/* User Info */}
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {userData?.name || 'User'}
              </h3>
              <p className="text-sm text-gray-600">
                {userData?.email || 'user@example.com'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {userData?.department} - {userData?.position}
              </p>
            </div>

            {/* Status */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Status: Menunggu Approval
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>Admin akan memproses registrasi Anda dalam waktu 1-2 jam kerja.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timer */}
            <div className="text-center">
              <p className="text-sm text-gray-600">Waktu tunggu:</p>
              <p className="text-2xl font-bold text-green-600">
                {formatTime(timeElapsed)}
              </p>
            </div>

            {/* Auto-refresh info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center">
                <svg className="h-4 w-4 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-blue-700">
                  Status akan diperbarui otomatis setiap 30 detik
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleContactHR}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
              >
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                Hubungi HR
              </button>
              
              <button
                onClick={handleLogout}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Logout
              </button>
            </div>

            {/* Instructions */}
            <div className="text-xs text-gray-500 text-center">
              <p>Setelah disetujui, Anda akan otomatis dialihkan ke dashboard.</p>
              <p className="mt-1">Jika ada pertanyaan, silakan hubungi HR.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PendingApproval; 
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../services/firebase';
import { addAttendance, getTodayAttendance } from '../../services/database';
import { uploadAttendancePhoto } from '../../services/storage';
import { validateLocation } from '../../utils/geolocation';

const CheckIn = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [debugMode, setDebugMode] = useState(false);
  
  useEffect(() => {
    // Get current user from auth
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Get user data from Firestore
        try {
          const { doc, getDoc } = await import('firebase/firestore');
          const { db } = await import('../../services/firebase');
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      checkTodayAttendance();
    }
  }, [user]);
  
  const checkTodayAttendance = async () => {
    if (user) {
      const attendance = await getTodayAttendance(user.uid);
      setTodayAttendance(attendance);
    }
  };
  
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran foto maksimal 5MB');
        return;
      }
      setPhoto(file);
    }
  };
  
  const handleCheckIn = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Check if already checked in today
      if (todayAttendance) {
        setError('Anda sudah melakukan check in hari ini!');
        setLoading(false);
        return;
      }
      
      // Validate location
      const locationValidation = await validateLocation();
      
      if (!locationValidation.isValid) {
        console.log('❌ Location validation failed:', locationValidation);
        const errorMsg = `Anda berada ${locationValidation.distance}m dari kantor. ` +
          `Radius yang diizinkan: ${locationValidation.effectiveRadius || locationValidation.maxRadius}m. ` +
          `GPS accuracy: ${locationValidation.accuracy}m. ` +
          `Alasan: ${locationValidation.validationReason}`;
        setError(errorMsg);
        setLoading(false);
        return;
      }
      
      setLocation(locationValidation.location);
      
      // Upload photo if provided
      let photoUrl = '';
      if (photo) {
        const today = new Date().toISOString().split('T')[0];
        photoUrl = await uploadAttendancePhoto(photo, user.uid, today);
      }
      
      // Determine status based on time
      const now = new Date();
      const isLate = now.getHours() >= 9; // After 9 AM is late
      
      // Save attendance
      const attendanceData = {
        userId: user.uid,
        userName: user.name,
        date: new Date().toISOString().split('T')[0],
        checkIn: new Date(),
        checkInLocation: locationValidation.location,
        checkInPhoto: photoUrl,
        status: isLate ? 'late' : 'ontime'
      };
      
      const result = await addAttendance(attendanceData);
      
      if (result.success) {
        setSuccess('Check in berhasil!');
        checkTodayAttendance(); // Refresh today's attendance
      } else {
        setError('Check in gagal: ' + result.message);
      }
      
    } catch (error) {
      console.error('Check in error:', error);
      setError('Check in gagal: ' + error.message);
    }
  };
  
  const handleTestLocation = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      console.log('🔍 Testing location validation...');
      const { debugLocation } = await import('../../utils/geolocation');
      const result = await debugLocation();
      
      if (result.isValid) {
        setSuccess(`✅ Lokasi valid! Jarak: ${result.distance}m, Akurasi GPS: ${result.accuracy}m, Radius efektif: ${result.effectiveRadius}m`);
      } else {
        setError(`❌ Lokasi tidak valid. Jarak: ${result.distance}m, Radius maksimal: ${result.effectiveRadius || result.maxRadius}m. ${result.validationReason}`);
      }
    } catch (error) {
      setError('Error testing location: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const currentTime = new Date();
  
  return (
    <div className="max-w-md mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Check In</h2>
          <p className="text-gray-600">Surya Abadi Connecteam</p>
        </div>
        
        {/* Current time display */}
        <div className="text-center mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="text-3xl font-bold text-blue-600">
            {currentTime.toLocaleTimeString('id-ID')}
          </div>
          <div className="text-gray-600 mt-1">
            {currentTime.toLocaleDateString('id-ID', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
        
        {/* Status display */}
        {todayAttendance ? (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-center">
              <div className="text-green-600 font-semibold">✓ Sudah Check In</div>
              <div className="text-sm text-green-600 mt-1">
                {todayAttendance.checkIn && new Date(todayAttendance.checkIn.seconds * 1000).toLocaleTimeString('id-ID')}
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-center">
              <div className="text-yellow-600 font-semibold">⏰ Belum Check In</div>
              <div className="text-sm text-yellow-600 mt-1">
                Silakan lakukan check in
              </div>
            </div>
          </div>
        )}
        
        {/* Error/Success messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {success}
          </div>
        )}
        
        {/* Location status */}
        {location && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-blue-600 mr-2">📍</span>
              <div>
                <div className="text-sm font-medium text-blue-800">Lokasi terdeteksi</div>
                <div className="text-xs text-blue-600">
                  Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Photo upload */}
        {!todayAttendance && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Foto Selfie (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              capture="user"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onChange={handlePhotoChange}
            />
            <p className="text-xs text-gray-500 mt-1">
              Ambil foto selfie untuk absensi
            </p>
          </div>
        )}
        
        {/* Check in button */}
        {!todayAttendance && (
          <>
            <button
              onClick={handleCheckIn}
              disabled={loading}
              className={`w-full py-4 px-6 rounded-lg font-bold text-white text-lg transition-colors mb-3 ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {loading ? 'Memproses...' : '📍 CHECK IN'}
            </button>
            
            {/* Debug test location button */}
            <button
              onClick={handleTestLocation}
              disabled={loading}
              className="w-full py-2 px-4 rounded-lg font-medium text-blue-600 border border-blue-600 hover:bg-blue-50 transition-colors text-sm"
            >
              🔍 Test Lokasi Saya
            </button>
          </>
        )}
        
        {/* User info */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-center text-sm text-gray-600">
            <p className="font-medium">{user?.name}</p>
            <p>{user?.employeeId}</p>
            <p>{user?.department}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckIn; 
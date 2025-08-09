import { useState, useEffect, useRef } from 'react';
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
  const [photoError, setPhotoError] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Camera refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
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

  // Initialize camera
  const startCamera = async () => {
    try {
      setPhotoError(null);
      
      // Check if camera is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPhotoError("Camera tidak didukung di browser ini");
        return;
      }
      
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setPhotoError("Camera tidak dapat diakses. Silakan pilih dari galeri atau skip foto.");
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    setShowCamera(false);
    setPhotoError(null);
  };

  // Capture photo
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsProcessing(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);

      // Convert to blob
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
      const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
      
      setPhoto(file);
      stopCamera();
    } catch (error) {
      console.error('Error capturing photo:', error);
      setPhotoError('Failed to capture photo. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGallerySelect = () => {
    setPhotoError(null);
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = false;
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          setPhotoError("Ukuran foto maksimal 5MB");
          return;
        }
        setPhoto(file);
      }
    };
    
    input.click();
  };

  const handleSkipPhoto = () => {
    setPhoto(null);
    setPhotoError(null);
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
        setError(`Anda berada ${locationValidation.distance}m dari kantor. Maksimal 250m untuk absensi.`);
        setLoading(false);
        return;
      }
      
      setLocation(locationValidation.location);
      
      // Upload photo if provided
      let photoUrl = '';
      if (photo) {
        try {
          const today = new Date().toISOString().split('T')[0];
          photoUrl = await uploadAttendancePhoto(photo, user.uid, today);
        } catch (error) {
          console.error('Error uploading photo:', error);
          // Continue without photo if upload fails
        }
      }
      
      // Determine status based on time
      const now = new Date();
      const isLate = now.getHours() >= 9; // After 9 AM is late

      // Save attendance (service layer enforces one-per-day, but add client guard)
      if (todayAttendance) {
        setError('Anda sudah melakukan check in hari ini!');
        setLoading(false);
        return;
      }

      const attendanceData = {
        userId: user.uid,
        userName: userData?.name || user.displayName,
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
            
            <div className="space-y-2">
              <button
                type="button"
                onClick={startCamera}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                📷 Buka Camera
              </button>
              <button
                type="button"
                onClick={handleGallerySelect}
                className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                🖼️ Pilih dari Galeri
              </button>
              <button
                type="button"
                onClick={handleSkipPhoto}
                className="w-full py-2 px-4 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm"
              >
                ⏭️ Skip Foto (Check-in tanpa foto)
              </button>
            </div>
            
            {photo && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  ✅ Foto dipilih: {photo.name}
                </p>
              </div>
            )}
            
            {photoError && (
              <p className="text-xs text-red-500 mt-1">
                {photoError}
              </p>
            )}
            
            <p className="text-xs text-gray-500 mt-2">
              📱 Jika camera bermasalah, pilih dari galeri atau skip foto
            </p>
          </div>
        )}
        
        {/* Check in button */}
        {!todayAttendance && (
          <button
            onClick={handleCheckIn}
            disabled={loading}
            className={`w-full py-4 px-6 rounded-lg font-bold text-white text-lg transition-colors ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {loading ? 'Memproses...' : '📍 CHECK IN'}
          </button>
        )}
        
        {/* User info */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-center text-sm text-gray-600">
            <p className="font-medium">{userData?.name || user?.displayName}</p>
            <p>{userData?.employeeId}</p>
            <p>{userData?.department}</p>
          </div>
        </div>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              Take a Selfie for Check In
            </h3>

            <div className="relative bg-black rounded-lg overflow-hidden mb-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {location && (
              <div className="mb-4 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  ✓ Location verified (within 1500m of office)
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={capturePhoto}
                disabled={isProcessing}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Capture Photo
                  </>
                )}
              </button>
              <button
                onClick={stopCamera}
                disabled={isProcessing}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckIn; 
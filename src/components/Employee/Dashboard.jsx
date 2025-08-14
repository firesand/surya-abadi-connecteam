// src/components/Employee/Dashboard.jsx
import { useState, useEffect, useRef } from 'react';
import { auth, db, storage } from '../../config/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';


import { validateLocation as validateLocationUtils, getOfficeLocation } from '../../utils/geolocation';

function EmployeeDashboard() {

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [checkType, setCheckType] = useState(''); // 'in' or 'out'
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Office radius from centralized geolocation util (env-driven)
  const { maxRadius: OFFICE_RADIUS } = getOfficeLocation();

  // Utility function untuk deteksi browser dan device
  const detectDevice = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;

    return {
      isIOS: /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream,
      isAndroid: /android/i.test(userAgent),
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
      isSafari: /^((?!chrome|android).)*safari/i.test(userAgent),
      isChrome: /chrome|chromium|crios/i.test(userAgent),
      isFirefox: /firefox|fxios/i.test(userAgent)
    };
  };

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Log device info for debugging
  useEffect(() => {
    const device = detectDevice();
    console.log('Device info:', device);
    console.log('User Agent:', navigator.userAgent);
    console.log('Platform:', navigator.platform);
    console.log('Vendor:', navigator.vendor);
  }, []);

  // Fetch user data and today's attendance
  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        console.log('Current user:', user?.email, 'UID:', user?.uid);

        if (!user) {
          console.log('No authenticated user, redirecting to login...');
          navigate('/login');
          return;
        }

        // Get user data
        console.log('Fetching user document from Firestore...');
        const userDoc = await getDoc(doc(db, 'users', user.uid));

        if (userDoc.exists()) {
          const data = userDoc.data();
          console.log('User data found:', data);

          // Check if user is admin and redirect
          if (data.role === 'admin') {
            console.log('User is admin, redirecting to admin dashboard...');
            navigate('/admin');
            return;
          }

          if (data.accountStatus !== 'active') {
            alert('Your account is not active. Please contact admin.');
            await signOut(auth);
            navigate('/login');
            return;
          }
          setUserData(data);
        } else {
          console.error('User document not found in Firestore!');
          alert('User profile not found. Please contact administrator.');
          return;
        }

        // Get today's attendance (skip if no attendances collection yet)
        try {
          const today = new Date().toISOString().split('T')[0];
          console.log('Fetching today attendance for date:', today);

          const attendanceQuery = query(
            collection(db, 'attendances'),
                                        where('userId', '==', user.uid),
                                        where('date', '==', today)
          );
          const attendanceSnapshot = await getDocs(attendanceQuery);

          if (!attendanceSnapshot.empty) {
            setTodayAttendance({
              id: attendanceSnapshot.docs[0].id,
              ...attendanceSnapshot.docs[0].data()
            });
            console.log('Today attendance found');
          } else {
            console.log('No attendance record for today');
          }
        } catch (attendanceError) {
          console.log('Attendance query error (normal if no attendances yet):', attendanceError);
        }

        // Get attendance history (skip if no attendances collection yet)
        try {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          const historyQuery = query(
            collection(db, 'attendances'),
                                     where('userId', '==', user.uid),
                                     where('date', '>=', sevenDaysAgo.toISOString().split('T')[0]),
                                     orderBy('date', 'desc')
          );
          const historySnapshot = await getDocs(historyQuery);
          const history = historySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setAttendanceHistory(history);
          console.log('Attendance history loaded:', history.length, 'records');
        } catch (historyError) {
          console.log('History query error (normal if no attendances yet):', historyError);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        console.error('Error details:', error.message);
        alert(`Error loading dashboard data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // Validate location using centralized util
  const validateLocation = async () => {
    const result = await validateLocationUtils();
    setLocationError('');
    if (!result.isValid) {
      setLocationError(`You are ${result.distance}m away from office. Must be within 250m to check ${checkType}.`);
      return false;
    }
    setLocation(result.location);
    return true;
  };

  // Initialize camera with enhanced mobile support
  const startCamera = async (type) => {
    setCheckType(type);
    setShowCamera(false);

    const device = detectDevice();
    console.log('Starting camera for device:', device);

    // First validate location
    const isLocationValid = await validateLocation();
    if (!isLocationValid) {
      return;
    }

    try {
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported');
      }

      // Different constraints for different devices
      let constraints;

      if (device.isIOS) {
        // iOS specific constraints
        constraints = {
          video: {
            facingMode: 'user'
          },
          audio: false
        };
      } else if (device.isAndroid) {
        // Android specific constraints
        constraints = {
          video: {
            facingMode: { ideal: 'user' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        };
      } else {
        // Desktop/other
        constraints = {
          video: {
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 },
            facingMode: 'user'
          },
          audio: false
        };
      }

      console.log('Using constraints:', constraints);

      // Try to get camera stream with fallback
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (e) {
        console.log('Failed with ideal constraints, trying basic...');
        // Fallback to basic constraints
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      if (!videoRef.current) {
        throw new Error('Video element not ready');
      }

      // Set stream to video element
      videoRef.current.srcObject = stream;

      // Wait for video to be ready
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Video load timeout'));
        }, 5000);

        videoRef.current.onloadedmetadata = () => {
          clearTimeout(timeout);
          videoRef.current.play()
          .then(() => {
            console.log('Video playing successfully');
            setShowCamera(true);
            resolve();
          })
          .catch(reject);
        };

        videoRef.current.onerror = (e) => {
          clearTimeout(timeout);
          reject(new Error('Video error: ' + e.message));
        };
      });

    } catch (error) {
      console.error('Camera error:', error);
      handleCameraError(error, type);
    }
  };

  // Better error handling for camera
  const handleCameraError = (error, type) => {
    let message = 'Tidak dapat mengakses kamera.';

    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      message = 'Akses kamera ditolak. Silakan izinkan akses kamera di pengaturan browser/aplikasi.';
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      message = 'Kamera tidak ditemukan pada perangkat ini.';
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      message = 'Kamera sedang digunakan aplikasi lain. Tutup aplikasi lain dan coba lagi.';
    } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
      message = 'Kamera tidak mendukung pengaturan yang diminta.';
    } else if (error.message.includes('https')) {
      message = 'Kamera hanya dapat diakses melalui koneksi aman (HTTPS).';
    }

    alert(message + '\n\nAnda dapat melanjutkan check-in tanpa foto.');

    // Offer to continue without photo
    const confirmWithoutPhoto = window.confirm(
      'Lanjutkan check-in tanpa foto?'
    );

    if (confirmWithoutPhoto) {
      setIsProcessing(true);
      if (type === 'in') {
        processCheckIn('').finally(() => setIsProcessing(false));
      } else {
        processCheckOut('').finally(() => setIsProcessing(false));
      }
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    setShowCamera(false);
    setCheckType('');
    setLocationError('');
  };

  // Enhanced capture photo with better error handling
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('Video or canvas reference not available');
      alert('Camera tidak siap. Silakan coba lagi.');
      return;
    }

    setIsProcessing(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Pastikan video sudah siap
      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        console.log('Video not ready, waiting...');
        await new Promise(resolve => setTimeout(resolve, 500));

        if (video.readyState !== video.HAVE_ENOUGH_DATA) {
          throw new Error('Video stream not ready');
        }
      }

      const context = canvas.getContext('2d');

      // Set canvas dimensions sesuai video
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);

      // Draw video frame to canvas (with mirror effect removed for actual capture)
      context.save();
      // If you want to keep the mirror effect in the captured image, uncomment the next two lines:
      // context.scale(-1, 1);
      // context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      // Otherwise, use normal drawing:
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      context.restore();

      // Convert canvas to blob dengan fallback
      let blob;

      // Method 1: Modern browsers
      if (canvas.toBlob) {
        blob = await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Blob creation timeout'));
          }, 5000);

          canvas.toBlob(
            (blobResult) => {
              clearTimeout(timeout);
              if (blobResult) {
                resolve(blobResult);
              } else {
                reject(new Error('Failed to create blob'));
              }
            },
            'image/jpeg',
            0.8
          );
        });
      }
      // Method 2: Fallback untuk browser lama
      else {
        const dataURL = canvas.toDataURL('image/jpeg', 0.8);
        const response = await fetch(dataURL);
        blob = await response.blob();
      }

      if (!blob) {
        throw new Error('Failed to create image blob');
      }

      console.log('Blob created successfully, size:', blob.size);

      // Upload to Firebase Storage dengan error handling
      try {
        const timestamp = Date.now();
        const fileName = `${auth.currentUser.uid}_${checkType}_${timestamp}.jpg`;
        const storageRef = ref(storage, `attendances/${auth.currentUser.uid}/${fileName}`);

        console.log('Uploading photo to Firebase...');
        const uploadSnapshot = await uploadBytes(storageRef, blob);
        const photoUrl = await getDownloadURL(uploadSnapshot.ref);
        console.log('Photo uploaded successfully:', photoUrl);

        // Process check-in or check-out
        if (checkType === 'in') {
          await processCheckIn(photoUrl);
        } else {
          await processCheckOut(photoUrl);
        }

        stopCamera();
      } catch (uploadError) {
        console.error('Upload error:', uploadError);

        // Jika upload gagal, coba lanjutkan tanpa foto
        const confirmWithoutPhoto = window.confirm(
          'Gagal upload foto. Lanjutkan check-in tanpa foto?'
        );

        if (confirmWithoutPhoto) {
          if (checkType === 'in') {
            await processCheckIn(''); // Empty photo URL
          } else {
            await processCheckOut('');
          }
          stopCamera();
        }
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        videoReady: videoRef.current?.readyState,
        canvasAvailable: !!canvasRef.current
      });

      // Berikan opsi untuk melanjutkan tanpa foto
      const confirmWithoutPhoto = window.confirm(
        `Gagal mengambil foto: ${error.message}\n\nLanjutkan check-in tanpa foto?`
      );

      if (confirmWithoutPhoto) {
        try {
          if (checkType === 'in') {
            await processCheckIn('');
          } else {
            await processCheckOut('');
          }
          stopCamera();
        } catch (processError) {
          console.error('Process error:', processError);
          alert('Gagal memproses attendance. Silakan coba lagi.');
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Process check-in with null photo support
  const processCheckIn = async (photoUrl) => {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const isLate = now.getHours() >= 9; // Consider late if after 9 AM

      const attendanceData = {
        userId: auth.currentUser.uid,
        userName: userData.name,
        date: today,
        checkIn: serverTimestamp(),
        checkInTime: now.toISOString(),
        checkInLocation: location,
        checkInPhoto: photoUrl || null, // Allow null photo
        status: isLate ? 'late' : 'ontime',
        checkOut: null,
        checkOutLocation: null,
        checkOutPhoto: null,
        workHours: 0
      };

      // Guard: skip if already has attendance today (client-side safeguard)
      const existingQ = query(
        collection(db, 'attendances'),
        where('userId', '==', auth.currentUser.uid),
        where('date', '==', today)
      );
      const existingSnap = await getDocs(existingQ);
      if (!existingSnap.empty) {
        alert('Anda sudah check-in hari ini.');
        return;
      }

      const docRef = await addDoc(collection(db, 'attendances'), attendanceData);

      // Update local state
      setTodayAttendance({
        id: docRef.id,
        ...attendanceData,
        checkIn: Timestamp.fromDate(now)
      });

      const photoStatus = photoUrl ? 'dengan foto' : 'tanpa foto';
      alert(`Check-in berhasil ${photoStatus}!\nStatus: ${isLate ? 'Terlambat' : 'Tepat Waktu'}`);
    } catch (error) {
      console.error('Error processing check-in:', error);
      alert('Gagal memproses check-in. Silakan coba lagi.');
    }
  };

  // Process check-out with null photo support
  const processCheckOut = async (photoUrl) => {
    try {
      if (!todayAttendance) {
        alert('Tidak ada check-in untuk hari ini!');
        return;
      }

      const now = new Date();
      const checkInTime = todayAttendance.checkIn.toDate();
      const workHours = (now - checkInTime) / (1000 * 60 * 60); // Hours

      await updateDoc(doc(db, 'attendances', todayAttendance.id), {
        checkOut: serverTimestamp(),
                      checkOutTime: now.toISOString(),
                      checkOutLocation: location,
                      checkOutPhoto: photoUrl || null, // Allow null photo
                      workHours: parseFloat(workHours.toFixed(2))
      });

      // Update local state
      setTodayAttendance({
        ...todayAttendance,
        checkOut: Timestamp.fromDate(now),
                         checkOutLocation: location,
                         checkOutPhoto: photoUrl || null,
                         workHours: parseFloat(workHours.toFixed(2))
      });

      const photoStatus = photoUrl ? 'dengan foto' : 'tanpa foto';
      alert(`Check-out berhasil ${photoStatus}!\nJam kerja: ${workHours.toFixed(2)} jam`);
    } catch (error) {
      console.error('Error processing check-out:', error);
      alert('Gagal memproses check-out. Silakan coba lagi.');
    }
  };

  // Format time
  const formatTime = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
      <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading dashboard...</p>
      </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 pb-20">
    {/* Page Title */}
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold">SA</span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Surya Abadi Connecteam</h1>
          <p className="text-sm text-gray-600">Employee Dashboard</p>
        </div>
      </div>
    </div>

    <div className="max-w-7xl mx-auto px-4 py-6">
    {/* Welcome Section */}
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
    <div className="flex justify-between items-start">
    <div className="flex items-center space-x-4">
    {userData?.photoUrl ? (
      <img
      src={userData.photoUrl}
      alt={userData.name}
      className="w-20 h-20 rounded-full object-cover border-4 border-green-100"
      />
    ) : (
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
      <span className="text-2xl font-bold text-green-600">
      {userData?.name?.charAt(0).toUpperCase()}
      </span>
      </div>
    )}
    <div>
    <h2 className="text-2xl font-bold text-gray-800">Welcome, {userData?.name}!</h2>
    <p className="text-gray-600">{userData?.position} - {userData?.department}</p>
    <p className="text-sm text-gray-500">Employee ID: {userData?.employeeId}</p>
    </div>
    </div>
    <div className="text-right">
    <p className="text-3xl font-bold text-gray-800">
    {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </p>
    <p className="text-gray-600">
    {currentTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
    </p>
    </div>
    </div>
    </div>

    {/* Today's Attendance Status */}
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
    <h3 className="text-lg font-semibold text-gray-800 mb-4">Today's Attendance</h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div className="bg-green-50 rounded-lg p-4">
    <p className="text-sm text-gray-600">Check In</p>
    <p className="text-xl font-bold text-green-600">
    {todayAttendance?.checkIn ? formatTime(todayAttendance.checkIn) : 'Not yet'}
    </p>
    {todayAttendance?.status && (
      <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
        todayAttendance.status === 'ontime'
        ? 'bg-green-100 text-green-800'
        : 'bg-yellow-100 text-yellow-800'
      }`}>
      {todayAttendance.status === 'ontime' ? 'On Time' : 'Late'}
      </span>
    )}
    </div>
    <div className="bg-blue-50 rounded-lg p-4">
    <p className="text-sm text-gray-600">Check Out</p>
    <p className="text-xl font-bold text-blue-600">
    {todayAttendance?.checkOut ? formatTime(todayAttendance.checkOut) : 'Not yet'}
    </p>
    </div>
    <div className="bg-purple-50 rounded-lg p-4">
    <p className="text-sm text-gray-600">Work Hours</p>
    <p className="text-xl font-bold text-purple-600">
    {todayAttendance?.workHours ? `${todayAttendance.workHours} hours` : '-'}
    </p>
    </div>
    </div>

    {/* Check In/Out Buttons */}
    <div className="mt-6 flex gap-4">
    {!todayAttendance?.checkIn ? (
      <button
      onClick={() => startCamera('in')}
      className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
      >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <span>Check In</span>
      </button>
    ) : !todayAttendance?.checkOut ? (
      <button
      onClick={() => startCamera('out')}
      className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
      >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      <span>Check Out</span>
      </button>
    ) : (
      <div className="flex-1 bg-gray-100 text-gray-600 py-3 px-6 rounded-lg text-center">
      <p className="font-semibold">Attendance Complete for Today</p>
      <p className="text-sm mt-1">Thank you for your hard work!</p>
      </div>
    )}
    </div>

    {/* Location Error */}
    {locationError && (
      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
      <p className="text-red-600 flex items-center">
      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      {locationError}
      </p>
      </div>
    )}
    </div>

    {/* Camera Modal */}
    {showCamera && (
      <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6">
      <h3 className="text-lg font-semibold mb-4">
      Take a Selfie for Check {checkType === 'in' ? 'In' : 'Out'}
      </h3>

      <div className="relative bg-black rounded-lg overflow-hidden mb-4">
      <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      webkit-playsinline="true"
      className="w-full"
      style={{
        maxWidth: '100%',
        height: 'auto',
        transform: 'scaleX(-1)' // Mirror effect untuk selfie
      }}
      />
      <canvas
      ref={canvasRef}
      className="hidden"
      style={{ display: 'none' }}
      />
      </div>

      {location && (
        <div className="mb-4 p-3 bg-green-50 rounded-lg">
        <p className="text-sm text-green-800">
        ✓ Location verified (within {OFFICE_RADIUS}m of office)
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
        Ambil Foto
        </>
      )}
      </button>
      <button
      onClick={stopCamera}
      disabled={isProcessing}
      className="px-6 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors disabled:opacity-50"
      >
      Batal
      </button>
      </div>

      {/* Tambah tombol alternatif untuk mobile */}
      <div className="mt-3 text-center">
      <button
      onClick={() => {
        stopCamera();
        const confirmWithoutPhoto = window.confirm(
          'Lanjutkan check-in tanpa foto?'
        );
        if (confirmWithoutPhoto) {
          setIsProcessing(true);
          if (checkType === 'in') {
            processCheckIn('').finally(() => setIsProcessing(false));
          } else {
            processCheckOut('').finally(() => setIsProcessing(false));
          }
        }
      }}
      className="text-sm text-gray-500 underline"
      >
      Skip foto (lanjut tanpa foto)
      </button>
      </div>
      </div>
      </div>
    )}

    {/* Recent Attendance History */}
    <div className="bg-white rounded-xl shadow-md p-6">
    <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Attendance History</h3>
    <div className="overflow-x-auto">
    <table className="w-full">
    <thead>
    <tr className="border-b">
    <th className="text-left py-2 px-2 text-sm font-medium text-gray-600">Date</th>
    <th className="text-left py-2 px-2 text-sm font-medium text-gray-600">Check In</th>
    <th className="text-left py-2 px-2 text-sm font-medium text-gray-600">Check Out</th>
    <th className="text-left py-2 px-2 text-sm font-medium text-gray-600">Status</th>
    <th className="text-left py-2 px-2 text-sm font-medium text-gray-600">Work Hours</th>
    </tr>
    </thead>
    <tbody>
    {attendanceHistory.length > 0 ? (
      attendanceHistory.map((record) => (
        <tr key={record.id} className="border-b">
        <td className="py-2 px-2 text-sm">
        {new Date(record.date).toLocaleDateString('id-ID', {
          weekday: 'short',
          day: 'numeric',
          month: 'short'
        })}
        </td>
        <td className="py-2 px-2 text-sm">
        {record.checkIn ? formatTime(record.checkIn) : '-'}
        </td>
        <td className="py-2 px-2 text-sm">
        {record.checkOut ? formatTime(record.checkOut) : '-'}
        </td>
        <td className="py-2 px-2">
        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
          record.status === 'ontime'
          ? 'bg-green-100 text-green-800'
          : 'bg-yellow-100 text-yellow-800'
        }`}>
        {record.status === 'ontime' ? 'On Time' : 'Late'}
        </span>
        </td>
        <td className="py-2 px-2 text-sm">
        {record.workHours ? `${record.workHours}h` : '-'}
        </td>
        </tr>
      ))
    ) : (
      <tr>
      <td colSpan="5" className="text-center py-4 text-gray-500">
      No attendance records found
      </td>
      </tr>
    )}
    </tbody>
    </table>
    </div>
    </div>
    </div>
    </div>
  );
}

export default EmployeeDashboard;

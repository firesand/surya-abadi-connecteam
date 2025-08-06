// src/components/Auth/Register.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../../config/firebase';
import { isPWA, isMobileDevice, pwaNavigate, clearPWACache } from '../../utils/pwaNavigationFix';
import { isIOSSafari, isIOSPWA, iOSNavigate, clearIOSCache } from '../../utils/mobileSafariFix';

function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    nik: '',
    employeeId: '',
    department: '',
    position: '',
    phoneNumber: '',
    address: '',
    maritalStatus: 'single',
    numberOfChildren: 0,
    joinDate: '',
    emergencyContact: '',
    emergencyPhone: ''
  });

  useEffect(() => {
    // Check if device is mobile or PWA
    const checkDevice = () => {
      const mobile = isMobileDevice() || isPWA() || isIOSSafari() || isIOSPWA();
      setIsMobile(mobile);
      console.log('Device detection:', {
        isMobileDevice: isMobileDevice(),
        isPWA: isPWA(),
        isIOSSafari: isIOSSafari(),
        isIOSPWA: isIOSPWA(),
        userAgent: navigator.userAgent
      });
    };
    
    checkDevice();
    
    // Add event listener for PWA install
    window.addEventListener('appinstalled', checkDevice);
    return () => window.removeEventListener('appinstalled', checkDevice);
  }, []);

  const departments = [
    'Management',
    'Finance',
    'HR',
    'IT',
    'Marketing',
    'Operations',
    'Proyek',
    'Sales'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran foto maksimal 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        setError('File harus berupa gambar');
        return;
      }

      setPhotoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Prevent double submission
    if (isSubmitting) {
      console.log('Form is already submitting, ignoring...');
      return;
    }

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Password tidak cocok');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    if (formData.nik.length !== 16) {
      setError('NIK harus 16 digit');
      return;
    }

    if (!photoFile) {
      setError('Foto profil wajib diupload');
      return;
    }

    setLoading(true);
    setIsSubmitting(true);

    try {
      // Create user account
      console.log('Creating user account...');
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
          formData.password
      );
      const user = userCredential.user;
      console.log('User created:', user.uid);

      // Upload photo
      let photoUrl = '';
      if (photoFile) {
        try {
          console.log('Uploading photo...');
          const fileExtension = photoFile.name.split('.').pop() || 'jpg';
          const fileName = `profile_${user.uid}_${Date.now()}.${fileExtension}`;
          const storageRef = ref(storage, `profiles/${user.uid}/${fileName}`);

          const snapshot = await uploadBytes(storageRef, photoFile);
          photoUrl = await getDownloadURL(snapshot.ref);
          console.log('Photo uploaded:', photoUrl);
        } catch (uploadError) {
          console.error('Photo upload error:', uploadError);
          // Continue without photo if upload fails
        }
      }

      // Create user document in Firestore
      console.log('Creating user document...');
      await setDoc(doc(db, 'users', user.uid), {
        email: formData.email,
        name: formData.name,
        nik: formData.nik,
        employeeId: formData.employeeId,
        department: formData.department,
        position: formData.position,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        maritalStatus: formData.maritalStatus,
        numberOfChildren: parseInt(formData.numberOfChildren) || 0,
        joinDate: formData.joinDate,
        emergencyContact: formData.emergencyContact,
        emergencyPhone: formData.emergencyPhone,
        photoUrl: photoUrl,
        role: 'employee',
        accountStatus: 'pending',
        isActive: false,
        registeredAt: Timestamp.now(),
        joinDateTimestamp: formData.joinDate ? Timestamp.fromDate(new Date(formData.joinDate)) : null,
        leaveBalance: {
          annual: 12,
          used: 0,
          remaining: 12
        }
      });
      console.log('User document created');

      // Create registration request for admin approval
      console.log('Creating registration request...');
      await addDoc(collection(db, 'registrationRequests'), {
        userId: user.uid,
        email: formData.email,
        name: formData.name,
        nik: formData.nik,
        employeeId: formData.employeeId,
        department: formData.department,
        position: formData.position,
        requestedAt: Timestamp.now(),
                   status: 'pending'
      });
      console.log('Registration request created');

      // Clear cache for mobile/PWA before navigation
      if (isMobile) {
        console.log('Clearing mobile/PWA cache...');
        try {
          // Clear iOS cache if on iOS
          if (isIOSSafari() || isIOSPWA()) {
            await clearIOSCache();
          } else {
            await clearPWACache();
          }
        } catch (cacheError) {
          console.error('Cache clear error:', cacheError);
        }
      }

      // Sign out the user immediately after registration
      try {
        await signOut(auth);
        console.log('User signed out successfully');
      } catch (signOutError) {
        console.error('Sign out error:', signOutError);
      }

      console.log('Registration completed successfully');
      
      // Set success state to show success screen
      setRegistrationSuccess(true);
      
      // Navigate to login page after delay
      setTimeout(() => {
        if (isIOSSafari() || isIOSPWA()) {
          console.log('iOS Safari/PWA redirect to login...');
          iOSNavigate('/login');
        } else if (isMobile) {
          console.log('Mobile/PWA redirect to login...');
          pwaNavigate('/login');
        } else {
          console.log('Desktop navigation to login...');
          navigate('/login');
        }
      }, 3000);
    } catch (error) {
      console.error('Registration error:', error);
      
      // Clean up any partially created data
      try {
        if (user && user.uid) {
          // Try to delete the user if registration failed
          await user.delete();
          console.log('Cleaned up failed registration');
        }
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
      
      if (error.code === 'auth/email-already-in-use') {
        setError('Email sudah terdaftar');
      } else if (error.code === 'auth/weak-password') {
        setError('Password terlalu lemah');
      } else if (error.code === 'auth/invalid-email') {
        setError('Email tidak valid');
      } else if (error.code === 'auth/network-request-failed') {
        setError('Koneksi internet bermasalah. Silakan coba lagi.');
      } else {
        setError('Registrasi gagal: ' + error.message);
      }
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  // Success Screen Component
  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Registrasi Berhasil!
          </h2>
          <p className="text-gray-600 mb-6">
            Akun Anda telah dibuat dan sedang menunggu persetujuan admin.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Mengalihkan ke halaman login...
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-3000 ease-linear"
              style={{
                width: '100%',
                animation: 'progress 3s linear forwards'
              }}
            ></div>
          </div>
          
          {/* Manual redirect button for mobile */}
          {isMobile && (
            <button
              onClick={() => {
                if (isIOSSafari() || isIOSPWA()) {
                  iOSNavigate('/login');
                } else {
                  pwaNavigate('/login');
                }
              }}
              className="mt-4 text-green-600 underline text-sm hover:text-green-700"
            >
              Klik di sini jika tidak dialihkan
            </button>
          )}
        </div>
        
        <style jsx>{`
          @keyframes progress {
            from { width: 0%; }
            to { width: 100%; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div className="max-w-md w-full space-y-8">
    <div>
    <div className="mx-auto h-16 w-16 bg-green-600 rounded-lg flex items-center justify-center">
    <span className="text-white font-bold text-xl">SA</span>
    </div>
    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
    Registrasi Karyawan
    </h2>
    <p className="mt-2 text-center text-sm text-gray-600">
    Surya Abadi Connecteam
    </p>
    </div>

    {error && (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
      Registrasi gagal. Silakan coba lagi.
      </div>
    )}

    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
    <div className="space-y-4">
    {/* Email */}
    <div>
    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
    Email *
    </label>
    <input
    id="email"
    name="email"
    type="email"
    required
    value={formData.email}
    onChange={handleInputChange}
    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
    placeholder="nama@suryaabadi.com"
    />
    </div>

    {/* Password */}
    <div>
    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
    Password *
    </label>
    <input
    id="password"
    name="password"
    type="password"
    required
    value={formData.password}
    onChange={handleInputChange}
    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
    placeholder="••••••••"
    />
    </div>

    {/* Confirm Password */}
    <div>
    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
    Konfirmasi Password *
    </label>
    <input
    id="confirmPassword"
    name="confirmPassword"
    type="password"
    required
    value={formData.confirmPassword}
    onChange={handleInputChange}
    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
    placeholder="••••••••"
    />
    </div>

    {/* Name */}
    <div>
    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
    Nama Lengkap *
    </label>
    <input
    id="name"
    name="name"
    type="text"
    required
    value={formData.name}
    onChange={handleInputChange}
    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
    placeholder="John Doe"
    />
    </div>

    {/* NIK */}
    <div>
    <label htmlFor="nik" className="block text-sm font-medium text-gray-700">
    NIK (16 digit) *
    </label>
    <input
    id="nik"
    name="nik"
    type="text"
    required
    maxLength="16"
    pattern="[0-9]{16}"
    value={formData.nik}
    onChange={handleInputChange}
    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
    placeholder="1234567890123456"
    />
    </div>

    {/* Employee ID */}
    <div>
    <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700">
    ID Karyawan *
    </label>
    <input
    id="employeeId"
    name="employeeId"
    type="text"
    required
    value={formData.employeeId}
    onChange={handleInputChange}
    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
    placeholder="EMP001"
    />
    </div>

    {/* Department */}
    <div>
    <label htmlFor="department" className="block text-sm font-medium text-gray-700">
    Departemen
    </label>
    <select
    id="department"
    name="department"
    value={formData.department}
    onChange={handleInputChange}
    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
    >
    <option value="">Pilih Departemen</option>
    {departments.map(dept => (
      <option key={dept} value={dept}>{dept}</option>
    ))}
    </select>
    </div>

    {/* Position */}
    <div>
    <label htmlFor="position" className="block text-sm font-medium text-gray-700">
    Jabatan
    </label>
    <input
    id="position"
    name="position"
    type="text"
    value={formData.position}
    onChange={handleInputChange}
    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
    placeholder="Staff"
    />
    </div>

    {/* Phone Number */}
    <div>
    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
    Nomor Telepon
    </label>
    <input
    id="phoneNumber"
    name="phoneNumber"
    type="tel"
    value={formData.phoneNumber}
    onChange={handleInputChange}
    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
    placeholder="081234567890"
    />
    </div>

    {/* Address */}
    <div>
    <label htmlFor="address" className="block text-sm font-medium text-gray-700">
    Alamat
    </label>
    <textarea
    id="address"
    name="address"
    rows="3"
    value={formData.address}
    onChange={handleInputChange}
    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
    placeholder="Jl. Margonda Raya No. 100, Depok"
    />
    </div>

    {/* Marital Status */}
    <div>
    <label htmlFor="maritalStatus" className="block text-sm font-medium text-gray-700">
    Status Pernikahan *
    </label>
    <select
    id="maritalStatus"
    name="maritalStatus"
    required
    value={formData.maritalStatus}
    onChange={handleInputChange}
    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
    >
    <option value="single">Belum Menikah</option>
    <option value="married">Menikah</option>
    <option value="widowed">Duda/Janda</option>
    <option value="divorced">Cerai</option>
    </select>
    </div>

    {/* Number of Children */}
    <div>
    <label htmlFor="numberOfChildren" className="block text-sm font-medium text-gray-700">
    Jumlah Anak
    </label>
    <input
    id="numberOfChildren"
    name="numberOfChildren"
    type="number"
    min="0"
    max="10"
    value={formData.numberOfChildren}
    onChange={handleInputChange}
    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
    placeholder="0"
    />
    </div>

    {/* Join Date */}
    <div>
    <label htmlFor="joinDate" className="block text-sm font-medium text-gray-700">
    Tanggal Masuk *
    </label>
    <input
    id="joinDate"
    name="joinDate"
    type="date"
    required
    value={formData.joinDate}
    onChange={handleInputChange}
    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
    />
    </div>

    {/* Emergency Contact */}
    <div>
    <label htmlFor="emergencyContact" className="block text-sm font-medium text-gray-700">
    Kontak Darurat (Nama)
    </label>
    <input
    id="emergencyContact"
    name="emergencyContact"
    type="text"
    value={formData.emergencyContact}
    onChange={handleInputChange}
    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
    placeholder="Nama kontak darurat"
    />
    </div>

    {/* Emergency Phone */}
    <div>
    <label htmlFor="emergencyPhone" className="block text-sm font-medium text-gray-700">
    Kontak Darurat (Telepon)
    </label>
    <input
    id="emergencyPhone"
    name="emergencyPhone"
    type="tel"
    value={formData.emergencyPhone}
    onChange={handleInputChange}
    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
    placeholder="081234567890"
    />
    </div>

    {/* Photo Upload */}
    <div>
    <label htmlFor="photo" className="block text-sm font-medium text-gray-700">
    Foto Profil *
    </label>
    <div className="mt-1 flex items-center space-x-4">
    <div className="flex-shrink-0">
    {photoPreview ? (
      <img
      src={photoPreview}
      alt="Preview"
      className="h-20 w-20 rounded-full object-cover border-2 border-gray-300"
      />
    ) : (
      <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
      <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
      </div>
    )}
    </div>
    <div className="flex-1">
    <label
    htmlFor="photo"
    className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
    >
    Choose File
    </label>
    <input
    id="photo"
    name="photo"
    type="file"
    accept="image/*"
    onChange={handlePhotoChange}
    className="sr-only"
    />
    <p className="text-xs text-gray-500 mt-1">Maksimal 5MB. Format: JPG, PNG</p>
    </div>
    </div>
    </div>
    </div>

    <div>
    <button
    type="submit"
    disabled={loading}
    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
    {loading ? (
      <>
      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Mendaftar...
      </>
    ) : (
      'Daftar'
    )}
    </button>
    </div>

    <div className="text-center">
    <span className="text-sm text-gray-600">
    Sudah punya akun?{' '}
    <Link to="/login" className="font-medium text-green-600 hover:text-green-500">
    Masuk di sini
    </Link>
    </span>
    </div>
    </form>
    </div>
    </div>
  );
}

export default Register;

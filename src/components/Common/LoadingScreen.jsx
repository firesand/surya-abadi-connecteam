// src/components/Common/LoadingScreen.jsx
import { useEffect, useState } from 'react';

function LoadingScreen() {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
    <div className="text-center">
    <div className="mb-8">
    <div className="w-20 h-20 bg-green-600 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
    <span className="text-white font-bold text-2xl">SA</span>
    </div>
    </div>
    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-green-600 border-opacity-60 mx-auto"></div>
    <p className="mt-4 text-gray-600 font-medium">Loading{dots}</p>
    <p className="text-sm text-gray-500 mt-2">Surya Abadi Connecteam</p>
    </div>
    </div>
  );
}

export default LoadingScreen;

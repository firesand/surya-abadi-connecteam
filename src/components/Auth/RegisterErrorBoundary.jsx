import React from 'react';
import { useNavigate } from 'react-router-dom';

class RegisterErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error
    console.error('🚨 Register Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleRetry = () => {
    console.log('🔄 Retrying registration...');
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoToLogin = () => {
    console.log('🔗 Going to login...');
    window.location.href = '/login';
  };

  handleGoHome = () => {
    console.log('🏠 Going home...');
    window.location.href = '/';
  };

  handleClearCache = async () => {
    console.log('🗑️ Clearing cache...');
    
    try {
      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(name => caches.delete(name))
        );
      }
      
      // Clear storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Reload page
      window.location.reload();
    } catch (error) {
      console.error('❌ Cache clear failed:', error);
      window.location.reload();
    }
  };

  handleContactSupport = () => {
    const message = `Halo support, saya mengalami error saat registrasi di aplikasi Surya Abadi Connecteam. Error: ${this.state.error?.message || 'Unknown error'}`;
    const whatsappUrl = `https://wa.me/628118062231?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">🚨</span>
              </div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Registrasi Bermasalah
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Terjadi kesalahan saat registrasi. Silakan coba salah satu solusi di bawah.
              </p>
            </div>

            <div className="bg-white shadow-lg rounded-lg p-6">
              <div className="space-y-4">
                {/* Error Details */}
                {this.state.error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          Error: {this.state.error.message}
                        </h3>
                        {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                          <details className="mt-2 text-xs text-red-700">
                            <summary>Stack trace</summary>
                            <pre className="mt-1 bg-red-100 p-2 rounded overflow-auto">
                              {this.state.errorInfo.componentStack}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Recovery Options */}
                <div className="space-y-3">
                  <button
                    onClick={this.handleRetry}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    Coba Lagi
                  </button>
                  
                  <button
                    onClick={this.handleClearCache}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Bersihkan Cache & Coba Lagi
                  </button>
                  
                  <button
                    onClick={this.handleGoToLogin}
                    className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Kembali ke Login
                  </button>
                  
                  <button
                    onClick={this.handleGoHome}
                    className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Kembali ke Beranda
                  </button>
                  
                  <button
                    onClick={this.handleContactSupport}
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
                    <p>5. Coba registrasi lagi</p>
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

    return this.props.children;
  }
}

export default RegisterErrorBoundary; 
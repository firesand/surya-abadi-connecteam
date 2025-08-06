import React from 'react';

class RegisterErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Register component error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">⚠️</span>
              </div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Terjadi Kesalahan
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Maaf, terjadi kesalahan saat memproses registrasi
              </p>
            </div>

            <div className="bg-white shadow-lg rounded-lg p-6">
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  Silakan coba lagi atau hubungi administrator jika masalah berlanjut.
                </p>
                
                <div className="space-y-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Muat Ulang Halaman
                  </button>
                  
                  <button
                    onClick={() => window.location.href = '/login'}
                    className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Kembali ke Login
                  </button>
                </div>

                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="mt-4 text-left">
                    <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                      Error Details (Development)
                    </summary>
                    <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-40">
                      <div className="text-red-600 font-semibold mb-2">
                        {this.state.error.toString()}
                      </div>
                      <div className="text-gray-600">
                        {this.state.errorInfo.componentStack}
                      </div>
                    </div>
                  </details>
                )}
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
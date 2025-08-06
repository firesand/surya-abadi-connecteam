// src/components/Common/Footer.jsx
import React from 'react';

function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-4 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
          <div className="text-center sm:text-left">
            <p className="text-xs text-gray-500">
              © 2024 PT Surya Abadi. All rights reserved.
            </p>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-xs text-gray-400">
              Developed by{' '}
              <span className="font-medium text-gray-600">
                Hikmahtiar Studio (2025)
              </span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer; 
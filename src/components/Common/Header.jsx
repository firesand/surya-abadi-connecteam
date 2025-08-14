import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { logoutUser } from '../../services/auth';

const Header = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
    setShowMobileNav(false); // Close mobile nav after navigation
  };

  if (!user) return null;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-blue-600">
                Surya Abadi Connecteam
              </h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {user.role === 'admin' ? (
              <>
                <button
                  onClick={() => navigate('/admin/dashboard')}
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => navigate('/admin/employees')}
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Employees
                </button>
                <button
                  onClick={() => navigate('/admin/analytics')}
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Analytics
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/employee/dashboard')}
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => navigate('/employee/attendance')}
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Attendance
                </button>
                <button
                  onClick={() => navigate('/employee/profile')}
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Profile
                </button>
              </>
            )}
          </nav>

          {/* Mobile Navigation Button */}
          <div className="md:hidden">
            <button
              onClick={() => setShowMobileNav(!showMobileNav)}
              className="text-gray-700 hover:text-blue-600 focus:outline-none p-2"
              aria-label="Toggle mobile menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {showMobileNav ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 focus:outline-none"
            >
              {user.photoUrl ? (
                <img
                  src={user.photoUrl}
                  alt={user.name}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-medium">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="hidden md:block text-sm font-medium">{user.name}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-gray-500">{user.email}</div>
                  <div className="text-gray-500">{user.role === 'admin' ? 'Administrator' : 'Employee'}</div>
                </div>
                <button
                  onClick={() => {
                    navigate('/profile');
                    setShowMenu(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Profile Settings
                </button>
                <button
                  onClick={() => {
                    handleLogout();
                    setShowMenu(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {showMobileNav && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {user.role === 'admin' ? (
                <>
                  <button
                    onClick={() => handleNavigation('/admin/dashboard')}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => handleNavigation('/admin/employees')}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                  >
                    Employees
                  </button>
                  <button
                    onClick={() => handleNavigation('/admin/analytics')}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                  >
                    Analytics
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleNavigation('/employee/dashboard')}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => handleNavigation('/employee/attendance')}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                  >
                    Attendance
                  </button>
                  <button
                    onClick={() => handleNavigation('/employee/profile')}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => handleNavigation('/employee/leave-request')}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                  >
                    Leave Request
                  </button>
                  <button
                    onClick={() => handleNavigation('/employee/location-update')}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                  >
                    Location Update
                  </button>
                  <button
                    onClick={() => handleNavigation('/employee/payroll-request')}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                  >
                    Payroll Request
                  </button>
                </>
              )}
              
              {/* Mobile User Info */}
              <div className="pt-4 pb-3 border-t border-gray-200">
                <div className="px-3 py-2">
                  <div className="text-sm font-medium text-gray-700">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                  <div className="text-xs text-gray-500">{user.role === 'admin' ? 'Administrator' : 'Employee'}</div>
                </div>
                <div className="mt-3 space-y-1">
                  <button
                    onClick={() => {
                      navigate('/profile');
                      setShowMobileNav(false);
                    }}
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                  >
                    Profile Settings
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      setShowMobileNav(false);
                    }}
                    className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 
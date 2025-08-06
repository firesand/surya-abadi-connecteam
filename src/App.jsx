// src/App.jsx
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './config/firebase';

// Components
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import LoadingScreen from './components/Common/LoadingScreen';
import EmployeeDashboard from './components/Employee/Dashboard';
import AdminDashboard from './components/Admin/Dashboard';

function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userDataLoading, setUserDataLoading] = useState(false);

  useEffect(() => {
    console.log('App.jsx - Setting up auth listener...');

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      console.log('Auth state changed:', authUser?.email);

      if (authUser) {
        setUser(authUser);
        setUserDataLoading(true);

        // Fetch user data from Firestore
        try {
          console.log('Fetching user data for:', authUser.uid);
          const userDoc = await getDoc(doc(db, 'users', authUser.uid));

          if (userDoc.exists()) {
            const data = userDoc.data();
            console.log('User data loaded:', data);
            setUserData(data);
          } else {
            console.log('No user document found in Firestore');
            setUserData(null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUserData(null);
        } finally {
          setUserDataLoading(false);
        }
      } else {
        console.log('No authenticated user');
        setUser(null);
        setUserData(null);
        setUserDataLoading(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Show loading screen while checking auth
  if (loading) {
    console.log('App.jsx - Initial loading...');
    return <LoadingScreen />;
  }

  // Protected Route Component
  const ProtectedRoute = ({ children, requireAdmin = false }) => {
    console.log('ProtectedRoute - User:', user?.email, 'UserData:', userData, 'RequireAdmin:', requireAdmin);

    if (!user) {
      console.log('ProtectedRoute - No user, redirecting to login');
      return <Navigate to="/login" replace />;
    }

    // Wait for user data to load
    if (userDataLoading) {
      console.log('ProtectedRoute - Loading user data...');
      return <LoadingScreen />;
    }

    // If user data doesn't exist in Firestore, redirect to login
    if (!userData) {
      console.log('ProtectedRoute - No user data in Firestore');
      alert('User profile not found. Please contact administrator or register again.');
      return <Navigate to="/login" replace />;
    }

    if (requireAdmin && userData.role !== 'admin') {
      console.log('ProtectedRoute - User is not admin, redirecting to employee');
      return <Navigate to="/employee" replace />;
    }

    return children;
  };

  // Simple redirect based on role
  const RoleBasedRedirect = () => {
    console.log('RoleBasedRedirect - User:', user?.email, 'Role:', userData?.role);

    if (!user) {
      return <Navigate to="/login" replace />;
    }

    if (userDataLoading) {
      return <LoadingScreen />;
    }

    if (!userData) {
      return <Navigate to="/login" replace />;
    }

    // Redirect based on role
    if (userData.role === 'admin') {
      console.log('Redirecting to admin dashboard');
      return <Navigate to="/admin" replace />;
    } else {
      console.log('Redirecting to employee dashboard');
      return <Navigate to="/employee" replace />;
    }
  };

  return (
    <Router>
    <Routes>
    {/* Auth Routes */}
    <Route
    path="/login"
    element={
      user ? <RoleBasedRedirect /> : <Login />
    }
    />
    <Route
    path="/register"
    element={
      user ? <RoleBasedRedirect /> : <Register />
    }
    />

    {/* Root Route - Redirect based on role */}
    <Route
    path="/"
    element={<RoleBasedRedirect />}
    />

    {/* Employee Dashboard Route */}
    <Route
    path="/employee"
    element={
      <ProtectedRoute>
      <EmployeeDashboard />
      </ProtectedRoute>
    }
    />

    {/* Admin Dashboard Route */}
    <Route
    path="/admin"
    element={
      <ProtectedRoute requireAdmin={true}>
      <AdminDashboard />
      </ProtectedRoute>
    }
    />

    {/* Catch all - redirect to home */}
    <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Router>
  );
}

export default App;

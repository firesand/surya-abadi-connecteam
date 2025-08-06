// src/components/Employee/LocationUpdate.jsx
import { useState, useEffect } from 'react';
import { auth, db } from '../../config/firebase';
import { collection, addDoc, query, where, getDocs, Timestamp, orderBy, limit } from 'firebase/firestore';
import { getCurrentLocation, validateLocation } from '../../utils/geolocation';

function LocationUpdate() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [locationData, setLocationData] = useState(null);
  const [todayUpdates, setTodayUpdates] = useState([]);
  const [remainingUpdates, setRemainingUpdates] = useState(4);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // Get user data
        const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', user.uid)));
        if (!userDoc.empty) {
          setUserData(userDoc.docs[0].data());
        }

        // Get today's location updates
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const updatesQuery = query(
          collection(db, 'locationUpdates'),
          where('userId', '==', user.uid),
          where('updatedAt', '>=', Timestamp.fromDate(today)),
          orderBy('updatedAt', 'desc')
        );
        const updatesSnapshot = await getDocs(updatesQuery);
        const updates = updatesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTodayUpdates(updates);
        setRemainingUpdates(Math.max(0, 4 - updates.length));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getCurrentLocationData = async () => {
    try {
      setError('');
      const location = await getCurrentLocation();
      const validation = await validateLocation();
      
      setLocationData({
        ...location,
        isValid: validation.isValid,
        distance: validation.distance,
        maxRadius: validation.maxRadius
      });
    } catch (error) {
      setError('Failed to get location. Please check your GPS settings.');
      console.error('Location error:', error);
    }
  };

  const handleLocationUpdate = async () => {
    if (remainingUpdates <= 0) {
      alert('You have reached the maximum number of location updates for today (4 times).');
      return;
    }

    if (!locationData) {
      alert('Please get your current location first.');
      return;
    }

    setUpdating(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      const locationUpdate = {
        userId: user.uid,
        userName: userData?.name,
        userEmail: userData?.email,
        latitude: locationData.lat,
        longitude: locationData.lng,
        accuracy: locationData.accuracy,
        isValid: locationData.isValid,
        distance: locationData.distance,
        maxRadius: locationData.maxRadius,
        updatedAt: Timestamp.now(),
        timestamp: new Date().toLocaleString('id-ID')
      };

      await addDoc(collection(db, 'locationUpdates'), locationUpdate);

      // Update local state
      setTodayUpdates(prev => [locationUpdate, ...prev]);
      setRemainingUpdates(prev => prev - 1);

      alert(`Location updated successfully! You have ${remainingUpdates - 1} updates remaining today.`);
    } catch (error) {
      console.error('Error updating location:', error);
      alert('Failed to update location. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-8">
            <h1 className="text-2xl font-bold text-white">Location Update</h1>
            <p className="text-purple-100">Update your location (Max 4 times per day)</p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Location Update Form */}
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Update Location</h2>
                
                {/* Remaining Updates */}
                <div className="mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-800">Remaining Updates Today</p>
                        <p className="text-2xl font-bold text-blue-600">{remainingUpdates}/4</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Get Location Button */}
                <div className="mb-6">
                  <button
                    onClick={getCurrentLocationData}
                    disabled={updating}
                    className={`w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ${
                      updating ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Get Current Location
                  </button>
                </div>

                {/* Location Data */}
                {locationData && (
                  <div className="mb-6">
                    <h3 className="text-md font-semibold text-gray-800 mb-3">Location Information</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Latitude</p>
                          <p className="font-medium">{locationData.lat.toFixed(6)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Longitude</p>
                          <p className="font-medium">{locationData.lng.toFixed(6)}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Accuracy</p>
                          <p className="font-medium">{locationData.accuracy?.toFixed(1)}m</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Distance from Office</p>
                          <p className="font-medium">{locationData.distance}m</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          locationData.isValid
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {locationData.isValid ? 'Within Office Radius' : 'Outside Office Radius'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                {/* Update Button */}
                {locationData && (
                  <button
                    onClick={handleLocationUpdate}
                    disabled={updating || remainingUpdates <= 0}
                    className={`w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors ${
                      (updating || remainingUpdates <= 0) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {updating ? 'Updating...' : 'Update Location'}
                  </button>
                )}
              </div>

              {/* Today's Updates */}
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Today's Updates</h2>
                <div className="space-y-3">
                  {todayUpdates.length > 0 ? (
                    todayUpdates.map((update, index) => (
                      <div key={update.id || index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-gray-800">
                              Update #{todayUpdates.length - index}
                            </p>
                            <p className="text-sm text-gray-600">
                              {formatTime(update.updatedAt)}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            update.isValid
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {update.isValid ? 'Valid' : 'Invalid'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Lat: {update.latitude?.toFixed(6)}</p>
                          <p>Lng: {update.longitude?.toFixed(6)}</p>
                          <p>Distance: {update.distance}m from office</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p>No location updates today</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LocationUpdate; 
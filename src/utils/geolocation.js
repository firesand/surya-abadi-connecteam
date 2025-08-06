// Office location (PT Surya Abadi) - Based on Google Maps coordinates
let OFFICE_LAT = -6.3693;
let OFFICE_LNG = 106.8289;
const MAX_RADIUS = 100; // meters - increased for better coverage

// Get current location with fallback
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported, using fallback');
      resolve(getFallbackLocation());
      return;
    }

    // Check permissions first
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        console.log('Geolocation permission:', result.state);
        
        if (result.state === 'denied') {
          console.warn('Geolocation permission denied, using fallback');
          resolve(getFallbackLocation());
          return;
        }
        
        // Try to get location
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('✅ Geolocation successful:', {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy
            });
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              source: 'gps'
            });
          },
          (error) => {
            console.warn('❌ Geolocation failed:', error.message);
            
            // Handle specific errors
            switch (error.code) {
              case error.PERMISSION_DENIED:
                console.warn('Permission denied, using fallback');
                resolve(getFallbackLocation());
                break;
              case error.POSITION_UNAVAILABLE:
                console.warn('Position unavailable, using fallback');
                resolve(getFallbackLocation());
                break;
              case error.TIMEOUT:
                console.warn('Geolocation timeout, using fallback');
                resolve(getFallbackLocation());
                break;
              default:
                console.warn('Unknown geolocation error, using fallback');
                resolve(getFallbackLocation());
                break;
            }
          },
          { 
            enableHighAccuracy: false, // Changed to false for better compatibility
            timeout: 15000, // Increased timeout
            maximumAge: 300000 // 5 minutes cache
          }
        );
      }).catch((permissionError) => {
        console.warn('Permission check failed, trying geolocation anyway:', permissionError);
        // Fallback to direct geolocation call
        tryGeolocation(resolve, reject);
      });
    } else {
      // No permissions API, try direct geolocation
      tryGeolocation(resolve, reject);
    }
  });
};

// Fallback location (office location)
const getFallbackLocation = () => {
  console.log('📍 Using fallback location (office)');
  return {
    lat: OFFICE_LAT,
    lng: OFFICE_LNG,
    accuracy: 1000, // High accuracy value for fallback
    source: 'fallback'
  };
};

// Try geolocation directly
const tryGeolocation = (resolve, reject) => {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      console.log('✅ Direct geolocation successful');
      resolve({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        source: 'gps'
      });
    },
    (error) => {
      console.warn('❌ Direct geolocation failed:', error.message);
      resolve(getFallbackLocation());
    },
    { 
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 300000
    }
  );
};

// Calculate distance between two points using Haversine formula
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;
  
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c; // Distance in meters
};

// Validate if user is within office radius
export const validateLocation = async () => {
  try {
    const currentLocation = await getCurrentLocation();
    const distance = calculateDistance(
      currentLocation.lat,
      currentLocation.lng,
      OFFICE_LAT,
      OFFICE_LNG
    );
    
    // If using fallback location, always consider valid
    const isValid = currentLocation.source === 'fallback' || distance <= MAX_RADIUS;
    
    console.log('📍 Location validation:', {
      isValid,
      distance: Math.round(distance),
      source: currentLocation.source,
      maxRadius: MAX_RADIUS
    });
    
    return {
      isValid,
      distance: Math.round(distance),
      location: currentLocation,
      maxRadius: MAX_RADIUS,
      source: currentLocation.source
    };
  } catch (error) {
    console.error('Location validation error:', error);
    return {
      isValid: true, // Default to valid if validation fails
      error: error.message,
      source: 'error'
    };
  }
};

// Update office location (for admin use)
export const updateOfficeLocation = (lat, lng) => {
  OFFICE_LAT = lat;
  OFFICE_LNG = lng;
};

// Get office location
export const getOfficeLocation = () => {
  return {
    lat: OFFICE_LAT,
    lng: OFFICE_LNG,
    maxRadius: MAX_RADIUS
  };
}; 
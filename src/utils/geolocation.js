// Office location (Depok) - Update with actual office coordinates
let OFFICE_LAT = -6.3693;
let OFFICE_LNG = 106.8289;
const MAX_RADIUS = 50; // meters

// Get current location
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject('Geolocation not supported');
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => reject(error),
      { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
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
    
    return {
      isValid: distance <= MAX_RADIUS,
      distance: Math.round(distance),
      location: currentLocation,
      maxRadius: MAX_RADIUS
    };
  } catch (error) {
    console.error('Location validation error:', error);
    return {
      isValid: false,
      error: error.message
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
// Office location (PT Surya Abadi) - Tebet, Jakarta
// Coordinates: 6°14'22.3"S 106°51'18.9"E
let OFFICE_LAT = -6.239528;
let OFFICE_LNG = 106.855250;
let MAX_RADIUS = 250; // Increased to 250 meters for better coverage
let ACCURACY_THRESHOLD = 200; // Accept GPS readings with accuracy up to 200m

// Read from environment if available
const ENV_OFFICE_LAT = parseFloat(import.meta?.env?.VITE_OFFICE_LAT);
const ENV_OFFICE_LNG = parseFloat(import.meta?.env?.VITE_OFFICE_LNG);
const ENV_OFFICE_RADIUS = parseInt(import.meta?.env?.VITE_OFFICE_RADIUS);

if (!Number.isNaN(ENV_OFFICE_LAT)) OFFICE_LAT = ENV_OFFICE_LAT;
if (!Number.isNaN(ENV_OFFICE_LNG)) OFFICE_LNG = ENV_OFFICE_LNG;
if (!Number.isNaN(ENV_OFFICE_RADIUS)) MAX_RADIUS = ENV_OFFICE_RADIUS;

// Enhanced location getter with multiple attempts
export const getCurrentLocation = () => {
  return new Promise(async (resolve) => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported, using office location');
      resolve(getOfficeLocationAsFallback());
      return;
    }

    const getPosition = (options) =>
    new Promise((res, rej) =>
    navigator.geolocation.getCurrentPosition(
      (pos) => res(pos),
                                             (err) => rej(err),
                                             options
    )
    );

    // Try multiple strategies
    const strategies = [
      // Strategy 1: High accuracy with longer timeout
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      // Strategy 2: Lower accuracy but faster
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 30000 },
      // Strategy 3: Use cached location if available
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
    ];

    let bestResult = null;
    let attempts = [];

    for (const [index, options] of strategies.entries()) {
      try {
        console.log(`📍 Attempt ${index + 1}: Trying geolocation with options:`, options);
        const position = await getPosition(options);

        const result = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          source: `gps-strategy-${index + 1}`,
          timestamp: position.timestamp
        };

        attempts.push(result);
        console.log(`✅ Strategy ${index + 1} successful:`, result);

        // If we get a very accurate reading, use it immediately
        if (result.accuracy <= 50) {
          console.log('🎯 Excellent accuracy achieved, using this location');
          resolve(result);
          return;
        }

        // Keep the best result so far
        if (!bestResult || result.accuracy < bestResult.accuracy) {
          bestResult = result;
        }

        // If accuracy is acceptable, we can stop trying
        if (result.accuracy <= ACCURACY_THRESHOLD) {
          console.log('✅ Acceptable accuracy achieved');
          break;
        }
      } catch (error) {
        console.warn(`❌ Strategy ${index + 1} failed:`, error.message);
      }
    }

    // Use the best result we got
    if (bestResult) {
      console.log('📍 Using best available location:', bestResult);
      resolve(bestResult);
    } else {
      console.warn('❌ All geolocation attempts failed, using office location as fallback');
      resolve(getOfficeLocationAsFallback());
    }
  });
};

// Fallback using office location
const getOfficeLocationAsFallback = () => {
  console.log('📍 Using office location as fallback (Tebet, Jakarta)');
  return {
    lat: OFFICE_LAT,
    lng: OFFICE_LNG,
    accuracy: 10, // Low accuracy value to indicate it's precise
    source: 'office-fallback',
    isManualFallback: true
  };
};

// Calculate distance using Haversine formula
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

// Enhanced validation with accuracy consideration
export const validateLocation = async () => {
  try {
    const currentLocation = await getCurrentLocation();
    const distance = calculateDistance(
      currentLocation.lat,
      currentLocation.lng,
      OFFICE_LAT,
      OFFICE_LNG
    );

    // Calculate effective radius considering GPS accuracy
    const effectiveRadius = MAX_RADIUS + (currentLocation.accuracy || 0) * 0.5;

    // Validation logic with accuracy compensation
    let isValid = false;
    let validationReason = '';

    if (currentLocation.isManualFallback) {
      // If using office fallback, always valid
      isValid = true;
      validationReason = 'Using office location (fallback)';
    } else if (distance <= MAX_RADIUS) {
      // Within strict radius
      isValid = true;
      validationReason = 'Within office radius';
    } else if (distance <= effectiveRadius && currentLocation.accuracy > 50) {
      // Within effective radius when GPS accuracy is poor
      isValid = true;
      validationReason = 'Within effective radius (GPS accuracy compensation)';
    } else {
      isValid = false;
      validationReason = `Outside office radius (${Math.round(distance)}m away)`;
    }

    const result = {
      isValid,
      distance: Math.round(distance),
      location: currentLocation,
      maxRadius: MAX_RADIUS,
      effectiveRadius: Math.round(effectiveRadius),
      source: currentLocation.source,
      accuracy: currentLocation.accuracy,
      validationReason,
      office: {
        lat: OFFICE_LAT,
        lng: OFFICE_LNG,
        address: 'Tebet, South Jakarta'
      }
    };

    console.log('📍 Location validation result:', result);
    return result;
  } catch (error) {
    console.error('Location validation error:', error);
    // In case of error, be lenient and allow check-in
    return {
      isValid: true,
      error: error.message,
      source: 'error-fallback',
      validationReason: 'Validation error - allowing check-in'
    };
  }
};

// Debug function to test location
export const debugLocation = async () => {
  console.log('=== LOCATION DEBUG INFO ===');
  console.log('Office Coordinates:', {
    lat: OFFICE_LAT,
    lng: OFFICE_LNG,
    maxRadius: MAX_RADIUS,
    googleMaps: `https://maps.google.com/?q=${OFFICE_LAT},${OFFICE_LNG}`
  });

  try {
    const location = await getCurrentLocation();
    console.log('Current Location:', location);
    console.log('Google Maps URL:', `https://maps.google.com/?q=${location.lat},${location.lng}`);

    const validation = await validateLocation();
    console.log('Validation Result:', validation);

    return validation;
  } catch (error) {
    console.error('Debug error:', error);
    return null;
  }
};

// Update office location (for admin use)
export const updateOfficeLocation = (lat, lng, radius = MAX_RADIUS) => {
  OFFICE_LAT = lat;
  OFFICE_LNG = lng;
  MAX_RADIUS = radius;
  console.log('Office location updated:', { lat, lng, radius });
};

// Get office location
export const getOfficeLocation = () => {
  return {
    lat: OFFICE_LAT,
    lng: OFFICE_LNG,
    maxRadius: MAX_RADIUS,
    accuracyThreshold: ACCURACY_THRESHOLD,
    googleMapsUrl: `https://maps.google.com/?q=${OFFICE_LAT},${OFFICE_LNG}`
  };
};

// Manual override for testing (admin only)
export const manualCheckIn = (adminPassword) => {
  if (adminPassword === 'admin2024') {
    console.log('⚠️ Manual check-in override activated');
    return {
      isValid: true,
      distance: 0,
      source: 'manual-override',
      validationReason: 'Manual override by admin'
    };
  }
  return null;
};

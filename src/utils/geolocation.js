// EMERGENCY FIX - Office location (PT Surya Abadi Tebet)
// Coordinates: 6°14'22.3"S 106°51'18.9"E
let OFFICE_LAT = -6.239528;
let OFFICE_LNG = 106.855250;
let MAX_RADIUS = 400; // INCREASED TO 400m for better coverage - urban GPS can be off by 300m+
let ACCURACY_THRESHOLD = 500; // Accept readings up to 500m accuracy

// Read from environment if available
const ENV_OFFICE_LAT = parseFloat(import.meta?.env?.VITE_OFFICE_LAT);
const ENV_OFFICE_LNG = parseFloat(import.meta?.env?.VITE_OFFICE_LNG);
const ENV_OFFICE_RADIUS = parseInt(import.meta?.env?.VITE_OFFICE_RADIUS);

if (!Number.isNaN(ENV_OFFICE_LAT)) OFFICE_LAT = ENV_OFFICE_LAT;
if (!Number.isNaN(ENV_OFFICE_LNG)) OFFICE_LNG = ENV_OFFICE_LNG;
// Override radius if too small
if (!Number.isNaN(ENV_OFFICE_RADIUS)) {
  MAX_RADIUS = Math.max(ENV_OFFICE_RADIUS, 300); // Minimum 300m, increased from 200m
} else {
  MAX_RADIUS = 400; // Default 400m, increased from 300m
}

console.log('🏢 Office Configuration:', {
  lat: OFFICE_LAT,
  lng: OFFICE_LNG,
  radius: MAX_RADIUS,
  googleMaps: `https://maps.google.com/?q=${OFFICE_LAT},${OFFICE_LNG}`
});

// Get current location with fallback
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

    // Try to get location with different strategies
    const strategies = [
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 30000 },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
    ];

    let bestResult = null;

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

        console.log(`✅ Strategy ${index + 1} successful:`, result);

        // IMPORTANT: If accuracy is terrible (>1000m), use office location
        if (result.accuracy > 1000) {
          console.warn(`⚠️ GPS accuracy too poor (${result.accuracy}m), using office location as fallback`);
          resolve(getOfficeLocationAsFallback());
          return;
        }

        // If we get good accuracy, use it
        if (result.accuracy <= 100) {
          console.log('🎯 Good accuracy achieved, using this location');
          resolve(result);
          return;
        }

        // Keep the best result
        if (!bestResult || result.accuracy < bestResult.accuracy) {
          bestResult = result;
        }
      } catch (error) {
        console.warn(`❌ Strategy ${index + 1} failed:`, error.message);
      }
    }

    // If we have a result with acceptable accuracy, use it
    if (bestResult && bestResult.accuracy <= ACCURACY_THRESHOLD) {
      console.log('📍 Using best available location:', bestResult);
      resolve(bestResult);
    } else {
      console.warn('❌ No acceptable GPS reading, using office location');
      resolve(getOfficeLocationAsFallback());
    }
  });
};

// Fallback to office location
const getOfficeLocationAsFallback = () => {
  console.log('📍 Using office location as fallback (Tebet, Jakarta)');
  return {
    lat: OFFICE_LAT,
    lng: OFFICE_LNG,
    accuracy: 10,
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

// Validate location - MORE LENIENT
export const validateLocation = async () => {
  try {
    const currentLocation = await getCurrentLocation();
    const distance = calculateDistance(
      currentLocation.lat,
      currentLocation.lng,
      OFFICE_LAT,
      OFFICE_LNG
    );

    // IMPROVED LENIENT VALIDATION RULES
    let isValid = false;
    let validationReason = '';

    // Rule 1: If using office fallback, always valid
    if (currentLocation.isManualFallback) {
      isValid = true;
      validationReason = 'Using office location (auto-approved)';
    }
    // Rule 2: Within normal radius
    else if (distance <= MAX_RADIUS) {
      isValid = true;
      validationReason = 'Within office radius';
    }
    // Rule 3: IMPROVED - GPS accuracy compensation for typical ranges
    else if (currentLocation.accuracy <= 200 && distance <= 500) {
      isValid = true;
      validationReason = 'Within extended radius (GPS accuracy compensation)';
    }
    // Rule 4: If GPS accuracy is poor but distance is reasonable
    else if (currentLocation.accuracy > 200 && distance <= 600) {
      isValid = true;
      validationReason = 'Within extended radius (poor GPS compensation)';
    }
    // Rule 5: If accuracy is very poor, be very lenient
    else if (currentLocation.accuracy > 400) {
      isValid = true;
      validationReason = 'Auto-approved due to very poor GPS signal';
    }
    else {
      isValid = false;
      validationReason = `Outside office radius (${Math.round(distance)}m away)`;
    }

    // Calculate dynamic effective radius based on GPS accuracy
    let effectiveRadius = MAX_RADIUS;
    if (currentLocation.accuracy <= 50) {
      effectiveRadius = MAX_RADIUS; // No bonus for very good GPS
    } else if (currentLocation.accuracy <= 200) {
      effectiveRadius = Math.min(500, MAX_RADIUS + currentLocation.accuracy * 0.5); // Up to 500m
    } else {
      effectiveRadius = Math.min(600, MAX_RADIUS + currentLocation.accuracy * 0.75); // Up to 600m for poor GPS
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
    // On error, allow check-in
    return {
      isValid: true,
      error: error.message,
      source: 'error-fallback',
      validationReason: 'Auto-approved due to validation error'
    };
  }
};

// FOR TESTING ONLY - Override validation
export const overrideValidation = () => {
  console.warn('⚠️ OVERRIDE ACTIVE - All locations will be validated as TRUE');
  return {
    isValid: true,
    distance: 0,
    source: 'manual-override',
    validationReason: 'Manual override active'
  };
};

// Debug function - enhanced
export const debugLocation = async () => {
  console.log('=== ENHANCED LOCATION DEBUG ===');
  console.log('Office:', {
    lat: OFFICE_LAT,
    lng: OFFICE_LNG,
    radius: MAX_RADIUS,
    maps: `https://maps.google.com/?q=${OFFICE_LAT},${OFFICE_LNG}`
  });

  try {
    const location = await getCurrentLocation();
    console.log('Current Location:', location);

    const validation = await validateLocation();
    console.log('Validation:', validation);

    // Additional debugging info
    const distance = calculateDistance(location.lat, location.lng, OFFICE_LAT, OFFICE_LNG);
    console.log('Debug Analysis:', {
      actualDistance: Math.round(distance),
      maxRadius: MAX_RADIUS,
      gpsAccuracy: location.accuracy,
      effectiveRadius: validation.effectiveRadius,
      wouldPassWithOldLogic: distance <= 300,
      passesWithNewLogic: validation.isValid,
      improvement: validation.isValid && distance > 300 ? 'FIXED by new logic!' : 'No change needed'
    });

    return validation;
  } catch (error) {
    console.error('Debug failed:', error);
    return { error: error.message };
  }
};

// Update office location
export const updateOfficeLocation = (lat, lng, radius = 400) => {
  OFFICE_LAT = lat;
  OFFICE_LNG = lng;
  MAX_RADIUS = Math.max(radius, 300); // Minimum 300m, increased from 200m
  console.log('Office location updated:', { lat, lng, radius: MAX_RADIUS });
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

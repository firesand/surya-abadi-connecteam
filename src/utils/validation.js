// src/utils/validation.js

// Email validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password strength validation
export const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return {
    isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
    errors: {
      length: password.length < minLength ? `Minimal ${minLength} karakter` : null,
      uppercase: !hasUpperCase ? 'Harus ada huruf besar' : null,
      lowercase: !hasLowerCase ? 'Harus ada huruf kecil' : null,
      numbers: !hasNumbers ? 'Harus ada angka' : null,
      special: !hasSpecialChar ? 'Harus ada karakter khusus' : null
    }
  };
};

// Phone number validation (Indonesian format)
export const validatePhone = (phone) => {
  const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// NIK validation (Indonesian ID)
export const validateNIK = (nik) => {
  const nikRegex = /^[0-9]{16}$/;
  return nikRegex.test(nik);
};

// Employee ID validation
export const validateEmployeeId = (employeeId) => {
  const employeeIdRegex = /^[A-Z0-9]{3,10}$/;
  return employeeIdRegex.test(employeeId);
};

// Name validation
export const validateName = (name) => {
  const nameRegex = /^[a-zA-Z\s]{2,50}$/;
  return nameRegex.test(name.trim());
};

// Address validation
export const validateAddress = (address) => {
  return address.length >= 10 && address.length <= 200;
};

// File validation
export const validateFile = (file, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'],
    allowedExtensions = ['.jpg', '.jpeg', '.png']
  } = options;

  const errors = [];

  // Check file size
  if (file.size > maxSize) {
    errors.push(`Ukuran file maksimal ${Math.round(maxSize / 1024 / 1024)}MB`);
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    errors.push('Tipe file tidak didukung');
  }

  // Check file extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
  if (!hasValidExtension) {
    errors.push('Ekstensi file tidak didukung');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// XSS Prevention - Sanitize HTML input
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// SQL Injection Prevention - Remove dangerous characters
export const sanitizeForDatabase = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/['";\\]/g, '') // Remove SQL dangerous characters
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .trim();
};

// Rate limiting helper
export const createRateLimiter = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();
  
  return (identifier) => {
    const now = Date.now();
    const userAttempts = attempts.get(identifier) || [];
    
    // Remove old attempts
    const recentAttempts = userAttempts.filter(time => now - time < windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
      return false; // Rate limited
    }
    
    recentAttempts.push(now);
    attempts.set(identifier, recentAttempts);
    return true; // Allowed
  };
};

// Geolocation validation
export const validateLocation = (lat, lng) => {
  const isValidLat = lat >= -90 && lat <= 90;
  const isValidLng = lng >= -180 && lng <= 180;
  
  return isValidLat && isValidLng;
};

// Date validation
export const validateDate = (date) => {
  const dateObj = new Date(date);
  return !isNaN(dateObj.getTime()) && dateObj <= new Date();
};

// Number validation
export const validateNumber = (value, min = 0, max = 999999) => {
  const num = parseFloat(value);
  return !isNaN(num) && num >= min && num <= max;
};

// Required field validation
export const validateRequired = (value) => {
  return value !== null && value !== undefined && value.toString().trim() !== '';
};

// Form validation helper
export const validateForm = (formData, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const value = formData[field];
    const fieldRules = rules[field];
    
    // Required validation
    if (fieldRules.required && !validateRequired(value)) {
      errors[field] = `${fieldRules.label || field} wajib diisi`;
      return;
    }
    
    // Skip other validations if not required and empty
    if (!validateRequired(value)) return;
    
    // Type-specific validations
    if (fieldRules.type === 'email' && !validateEmail(value)) {
      errors[field] = 'Format email tidak valid';
    }
    
    if (fieldRules.type === 'phone' && !validatePhone(value)) {
      errors[field] = 'Format nomor telepon tidak valid';
    }
    
    if (fieldRules.type === 'nik' && !validateNIK(value)) {
      errors[field] = 'NIK harus 16 digit angka';
    }
    
    if (fieldRules.type === 'employeeId' && !validateEmployeeId(value)) {
      errors[field] = 'Employee ID tidak valid';
    }
    
    if (fieldRules.type === 'name' && !validateName(value)) {
      errors[field] = 'Nama hanya boleh berisi huruf dan spasi (2-50 karakter)';
    }
    
    if (fieldRules.type === 'address' && !validateAddress(value)) {
      errors[field] = 'Alamat minimal 10 karakter, maksimal 200 karakter';
    }
    
    if (fieldRules.type === 'number') {
      const { min, max } = fieldRules;
      if (!validateNumber(value, min, max)) {
        errors[field] = `Nilai harus antara ${min} dan ${max}`;
      }
    }
    
    // Custom validation
    if (fieldRules.custom) {
      const customError = fieldRules.custom(value, formData);
      if (customError) {
        errors[field] = customError;
      }
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}; 
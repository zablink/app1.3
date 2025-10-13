// src/utils/validators.ts

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * Validate URL format
 * @param url - URL string to validate
 * @returns Validation result with valid flag and optional error message
 */
export function validateURL(url: string): ValidationResult {
  if (!url || typeof url !== 'string') {
    return { valid: false, message: 'URL is required' };
  }

  if (url.trim().length === 0) {
    return { valid: false, message: 'URL cannot be empty' };
  }

  try {
    const urlObj = new URL(url);
    // Check if protocol is http or https
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return { valid: false, message: 'URL must start with http:// or https://' };
    }
    return { valid: true };
  } catch (error) {
    return { valid: false, message: 'Invalid URL format' };
  }
}

/**
 * Validate email format
 * @param email - Email string to validate
 * @returns true if valid, false otherwise
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (Thai format)
 * @param phone - Phone number string to validate
 * @returns true if valid, false otherwise
 */
export function validatePhoneNumber(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }

  // Remove spaces and dashes
  const cleanPhone = phone.replace(/[\s-]/g, '');
  
  // Thai phone number: 10 digits starting with 0
  const phoneRegex = /^0[0-9]{9}$/;
  return phoneRegex.test(cleanPhone);
}

/**
 * Validate Thai ID card number (13 digits)
 * @param idCard - ID card string to validate
 * @returns true if valid, false otherwise
 */
export function validateThaiIDCard(idCard: string): boolean {
  if (!idCard || typeof idCard !== 'string') {
    return false;
  }

  const cleanId = idCard.replace(/[\s-]/g, '');
  
  if (!/^\d{13}$/.test(cleanId)) {
    return false;
  }

  // Validate checksum
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanId[i]) * (13 - i);
  }
  const checkDigit = (11 - (sum % 11)) % 10;
  
  return checkDigit === parseInt(cleanId[12]);
}

/**
 * Validate LINE ID format
 * @param lineId - LINE ID string to validate
 * @returns true if valid, false otherwise
 */
export function validateLineID(lineId: string): boolean {
  if (!lineId || typeof lineId !== 'string') {
    return false;
  }

  // LINE ID can start with @ and contain alphanumeric characters, dots, underscores, and hyphens
  const lineRegex = /^@?[a-zA-Z0-9._-]{4,20}$/;
  return lineRegex.test(lineId);
}

/**
 * Validate social media URL
 * @param url - Social media URL
 * @param platform - Platform name (facebook, instagram, tiktok, youtube, twitter)
 * @returns Validation result with valid flag and optional error message
 */
export function validateSocialMediaURL(url: string, platform: string): ValidationResult {
  const urlValidation = validateURL(url);
  if (!urlValidation.valid) {
    return urlValidation;
  }

  const platformPatterns: Record<string, { pattern: RegExp; name: string }> = {
    facebook: { 
      pattern: /^https?:\/\/(www\.)?facebook\.com\/.+/i,
      name: 'Facebook'
    },
    instagram: { 
      pattern: /^https?:\/\/(www\.)?instagram\.com\/.+/i,
      name: 'Instagram'
    },
    tiktok: { 
      pattern: /^https?:\/\/(www\.)?tiktok\.com\/@.+/i,
      name: 'TikTok'
    },
    youtube: { 
      pattern: /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/i,
      name: 'YouTube'
    },
    twitter: { 
      pattern: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/.+/i,
      name: 'Twitter/X'
    },
  };

  const platformInfo = platformPatterns[platform.toLowerCase()];
  if (!platformInfo) {
    return { valid: true }; // Unknown platform, just validate URL format
  }

  if (!platformInfo.pattern.test(url)) {
    return { 
      valid: false, 
      message: `Invalid ${platformInfo.name} URL format` 
    };
  }

  return { valid: true };
}

/**
 * Validate password strength
 * @param password - Password string
 * @param minLength - Minimum length (default: 8)
 * @returns Object with isValid flag and error message
 */
export function validatePassword(
  password: string,
  minLength: number = 8
): { isValid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < minLength) {
    return { isValid: false, error: `Password must be at least ${minLength} characters` };
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }

  return { isValid: true };
}

/**
 * Validate file size
 * @param file - File object
 * @param maxSizeMB - Maximum size in MB (default: 5)
 * @returns true if valid, false otherwise
 */
export function validateFileSize(file: File, maxSizeMB: number = 5): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * Validate file type
 * @param file - File object
 * @param allowedTypes - Array of allowed MIME types
 * @returns true if valid, false otherwise
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * Validate image file
 * @param file - File object
 * @param maxSizeMB - Maximum size in MB (default: 5)
 * @returns Object with isValid flag and error message
 */
export function validateImageFile(
  file: File,
  maxSizeMB: number = 5
): { isValid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (!validateFileType(file, allowedTypes)) {
    return { 
      isValid: false, 
      error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' 
    };
  }

  if (!validateFileSize(file, maxSizeMB)) {
    return { 
      isValid: false, 
      error: `File size must be less than ${maxSizeMB}MB` 
    };
  }

  return { isValid: true };
}

/**
 * Validate latitude
 * @param lat - Latitude value
 * @returns true if valid (-90 to 90), false otherwise
 */
export function validateLatitude(lat: number): boolean {
  return typeof lat === 'number' && lat >= -90 && lat <= 90;
}

/**
 * Validate longitude
 * @param lng - Longitude value
 * @returns true if valid (-180 to 180), false otherwise
 */
export function validateLongitude(lng: number): boolean {
  return typeof lng === 'number' && lng >= -180 && lng <= 180;
}

/**
 * Validate coordinates
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns true if both are valid, false otherwise
 */
export function validateCoordinates(lat: number, lng: number): boolean {
  return validateLatitude(lat) && validateLongitude(lng);
}

/**
 * Sanitize HTML to prevent XSS
 * @param html - HTML string
 * @returns Sanitized string
 */
export function sanitizeHTML(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate string length
 * @param str - String to validate
 * @param min - Minimum length
 * @param max - Maximum length
 * @returns true if valid, false otherwise
 */
export function validateStringLength(str: string, min: number, max: number): boolean {
  if (!str || typeof str !== 'string') {
    return false;
  }
  return str.length >= min && str.length <= max;
}

/**
 * Check if value is empty (null, undefined, empty string, or whitespace only)
 * @param value - Value to check
 * @returns true if empty, false otherwise
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  
  if (typeof value === 'string') {
    return value.trim().length === 0;
  }
  
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  
  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }
  
  return false;
}
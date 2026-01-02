/**
 * Input sanitization utilities for enhanced security
 */

/**
 * Sanitizes text input by removing potentially dangerous characters
 * Prevents XSS attacks by escaping HTML entities
 */
export function sanitizeText(input: string): string {
  if (!input) return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .slice(0, 500); // Limit length to prevent DoS
}

/**
 * Validates and sanitizes Aadhaar number input
 * Ensures only 12 digits are accepted
 */
export function sanitizeAadhaar(input: string): string {
  if (!input) return '';
  
  // Remove all non-digit characters
  const digitsOnly = input.replace(/\D/g, '');
  
  // Limit to 12 digits
  return digitsOnly.slice(0, 12);
}

/**
 * Validates and sanitizes OTP input
 * Ensures only 6 digits are accepted
 */
export function sanitizeOtp(input: string): string {
  if (!input) return '';
  
  // Remove all non-digit characters
  const digitsOnly = input.replace(/\D/g, '');
  
  // Limit to 6 digits
  return digitsOnly.slice(0, 6);
}

/**
 * Validates Aadhaar format
 */
export function isValidAadhaar(aadhaar: string): boolean {
  return /^\d{12}$/.test(aadhaar);
}

/**
 * Validates OTP format
 */
export function isValidOtp(otp: string): boolean {
  return /^\d{6}$/.test(otp);
}

/**
 * Validates age based on birth year in Aadhaar
 * Last 4 digits represent birth year
 */
export function validateAge(aadhaar: string, minAge: number = 18): { valid: boolean; age?: number; error?: string } {
  if (!isValidAadhaar(aadhaar)) {
    return { valid: false, error: 'Invalid Aadhaar format' };
  }
  
  const birthYear = parseInt(aadhaar.substring(8, 12));
  
  // Validate birth year is reasonable (between 1900 and current year)
  const currentYear = new Date().getFullYear();
  if (birthYear < 1900 || birthYear > currentYear) {
    return { valid: false, error: 'Invalid birth year in Aadhaar' };
  }
  
  const age = currentYear - birthYear;
  
  if (age < minAge) {
    return { valid: false, age, error: `You must be ${minAge} years or older to register` };
  }
  
  return { valid: true, age };
}

/**
 * Sanitizes name input for profile
 */
export function sanitizeName(input: string): string {
  if (!input) return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/[^\w\s.-]/g, '') // Allow only alphanumeric, spaces, dots, and hyphens
    .slice(0, 100); // Limit length
}

/**
 * Validates name format
 */
export function isValidName(name: string): boolean {
  const sanitized = sanitizeName(name);
  return sanitized.length >= 2 && sanitized.length <= 100;
}

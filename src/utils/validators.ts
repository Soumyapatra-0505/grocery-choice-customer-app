/**
 * Grocery Choice Customer App - Validation Utilities
 */

export function validatePhone(phone: string): { isValid: boolean; normalized: string; error?: string } {
  if (!phone) {
    return { isValid: false, normalized: '', error: 'Mobile number is required' };
  }

  // Strip spaces, dashes, parentheses
  let cleaned = phone.replace(/[\s\-()]/g, '');

  // Handle +91 or 91 or 0 prefix
  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith('091')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }

  // Must be 10 digits starting with 6-9
  const indianMobileRegex = /^[6-9]\d{9}$/;
  if (!indianMobileRegex.test(cleaned)) {
    return {
      isValid: false,
      normalized: cleaned,
      error: 'Please enter a valid 10-digit mobile number'
    };
  }

  return {
    isValid: true,
    normalized: cleaned
  };
}

export function validatePincode(pincode: string): boolean {
  if (!pincode) return false;
  return /^[1-9][0-9]{5}$/.test(pincode.trim());
}

export function validateOtp(otp: string): boolean {
  if (!otp) return false;
  return /^\d{4,6}$/.test(otp.trim());
}

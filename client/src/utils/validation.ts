/**
 * Validation utilities for email and password (frontend)
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get password validation criteria
 * Returns individual criteria for UI display
 */
export function getPasswordCriteria(password: string) {
  return {
    length: password.length >= 8,
    digit: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };
}

/**
 * Validate strong password
 * Requirements:
 * - At least 8 characters
 * - At least one digit
 * - At least one special character
 */
export function isValidPassword(password: string): { valid: boolean; error?: string } {
  const criteria = getPasswordCriteria(password);
  
  if (!criteria.length) {
    return {
      valid: false,
      error: 'Password must be at least 8 characters long',
    };
  }

  if (!criteria.digit) {
    return {
      valid: false,
      error: 'Password must contain at least one digit',
    };
  }

  if (!criteria.special) {
    return {
      valid: false,
      error: 'Password must contain at least one special character',
    };
  }

  return { valid: true };
}

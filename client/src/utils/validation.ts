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
 * Whether a string is safe to use as a post-login redirect target: a relative,
 * same-app path only. Rejects protocol-relative ("//evil.com") and absolute
 * URLs to avoid an open-redirect via the `redirect` query param.
 */
export function isSafeInternalPath(path: string | null | undefined): path is string {
  return !!path && path.startsWith('/') && !path.startsWith('//') && !path.includes('://');
}

/**
 * Get password validation criteria
 * Returns individual criteria for UI display
 */
export function getPasswordCriteria(password: string) {
  return {
    length: password.length >= 12,
    digit: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };
}

/**
 * Validate strong password
 * Requirements (backlog sécu CNIL — recommandation pour un mot de passe seul,
 * sans second facteur obligatoire):
 * - At least 12 characters
 * - At least one digit
 * - At least one special character
 */
export function isValidPassword(password: string): { valid: boolean; error?: string } {
  const criteria = getPasswordCriteria(password);

  if (!criteria.length) {
    return {
      valid: false,
      error: 'Password must be at least 12 characters long',
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

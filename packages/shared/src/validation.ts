/**
 * Validates an email address format.
 * Uses a practical regex that covers most valid email formats.
 *
 * @param email - The email address to validate
 * @returns true if the email format is valid
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // RFC 5321 max length is 254 characters
  if (email.length > 254) {
    return false;
  }

  // Practical email regex that covers most valid formats
  // - Local part: alphanumeric, dots, hyphens, underscores, plus signs
  // - Domain: alphanumeric with hyphens, at least one dot for TLD
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  return emailRegex.test(email);
}

/**
 * Validates a password meets minimum requirements.
 *
 * @param password - The password to validate
 * @param minLength - Minimum length (default: 8)
 * @returns true if the password meets requirements
 */
export function isValidPassword(password: string, minLength = 8): boolean {
  if (!password || typeof password !== 'string') {
    return false;
  }

  return password.length >= minLength;
}

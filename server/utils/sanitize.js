/**
 * Input sanitization utilities for security
 * Prevents XSS attacks and malicious input
 */

/**
 * Sanitizes general text input (messages, words)
 * @param {string} text - Input text to sanitize
 * @returns {string} Sanitized text
 */
function sanitizeInput(text) {
  if (typeof text !== 'string') return '';
  
  return text
    .trim()
    .substring(0, 100)                    // Max length
    .replace(/<[^>]*>/g, '')              // Remove HTML tags
    .replace(/javascript:/gi, '')         // Remove javascript: protocol
    .replace(/on\w+=/gi, '');             // Remove event handlers
}

/**
 * Sanitizes username input
 * @param {string} name - Username to sanitize
 * @returns {string} Sanitized username
 */
function sanitizeUsername(name) {
  if (typeof name !== 'string') return '';
  
  return name
    .trim()
    .substring(0, 20)
    .replace(/[^\w\s]/g, '');             // Only alphanumeric, underscore, spaces
}

module.exports = {
  sanitizeInput,
  sanitizeUsername
};

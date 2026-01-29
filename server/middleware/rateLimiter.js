/**
 * Rate limiting middleware for WebSocket events
 * Prevents DoS attacks and spam
 */

const rateLimiters = new Map();

// Rate limit configurations
const RATE_LIMITS = {
  drawing: { limit: 60, windowMs: 1000 },      // 60 events per second
  guess: { limit: 5, windowMs: 2000 },         // 5 guesses per 2 seconds
  message: { limit: 5, windowMs: 2000 },       // 5 messages per 2 seconds
  createRoom: { limit: 3, windowMs: 60000 },   // 3 rooms per minute
  joinRoom: { limit: 5, windowMs: 10000 },     // 5 joins per 10 seconds
};

/**
 * Checks if an action is rate limited
 * @param {string} socketId - Socket ID
 * @param {string} eventType - Type of event
 * @param {number} limit - Max number of events allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {boolean} True if allowed, false if rate limited
 */
function checkRateLimit(socketId, eventType, limit, windowMs) {
  const key = `${socketId}:${eventType}`;
  const now = Date.now();
  
  if (!rateLimiters.has(key)) {
    rateLimiters.set(key, []);
  }
  
  const timestamps = rateLimiters.get(key);
  const validTimestamps = timestamps.filter(t => now - t < windowMs);
  
  if (validTimestamps.length >= limit) {
    return false; // Rate limited
  }
  
  validTimestamps.push(now);
  rateLimiters.set(key, validTimestamps);
  return true;
}

/**
 * Helper to check rate limit with predefined config
 * @param {string} socketId - Socket ID
 * @param {string} eventType - Type of event (must be in RATE_LIMITS)
 * @returns {boolean} True if allowed, false if rate limited
 */
function isAllowed(socketId, eventType) {
  const config = RATE_LIMITS[eventType];
  if (!config) return true; // No limit defined
  
  return checkRateLimit(socketId, eventType, config.limit, config.windowMs);
}

/**
 * Cleanup old entries periodically to prevent memory leaks
 */
function cleanupRateLimiters() {
  const now = Date.now();
  const maxWindow = Math.max(...Object.values(RATE_LIMITS).map(r => r.windowMs));
  
  for (const [key, timestamps] of rateLimiters.entries()) {
    const valid = timestamps.filter(t => now - t < maxWindow);
    if (valid.length === 0) {
      rateLimiters.delete(key);
    } else {
      rateLimiters.set(key, valid);
    }
  }
}

// Cleanup every minute
setInterval(cleanupRateLimiters, 60000);

module.exports = {
  checkRateLimit,
  isAllowed,
  RATE_LIMITS
};

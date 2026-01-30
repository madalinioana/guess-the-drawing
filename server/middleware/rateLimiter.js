const rateLimiters = new Map();

const RATE_LIMITS = {
  drawing: { limit: 60, windowMs: 1000 },
  guess: { limit: 5, windowMs: 2000 },
  message: { limit: 5, windowMs: 2000 },
  createRoom: { limit: 3, windowMs: 60000 },
  joinRoom: { limit: 5, windowMs: 10000 },
};

function checkRateLimit(socketId, eventType, limit, windowMs) {
  const key = `${socketId}:${eventType}`;
  const now = Date.now();

  if (!rateLimiters.has(key)) {
    rateLimiters.set(key, []);
  }

  const timestamps = rateLimiters.get(key);
  const validTimestamps = timestamps.filter(t => now - t < windowMs);

  if (validTimestamps.length >= limit) {
    return false;
  }

  validTimestamps.push(now);
  rateLimiters.set(key, validTimestamps);
  return true;
}

function isAllowed(socketId, eventType) {
  const config = RATE_LIMITS[eventType];
  if (!config) return true;

  return checkRateLimit(socketId, eventType, config.limit, config.windowMs);
}

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

setInterval(cleanupRateLimiters, 60000);

module.exports = {
  checkRateLimit,
  isAllowed,
  RATE_LIMITS
};

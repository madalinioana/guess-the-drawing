function sanitizeInput(text) {
  if (typeof text !== 'string') return '';

  return text
    .trim()
    .substring(0, 100)
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
}

function sanitizeUsername(name) {
  if (typeof name !== 'string') return '';

  return name
    .trim()
    .substring(0, 20)
    .replace(/[^\w\s]/g, '');
}

module.exports = {
  sanitizeInput,
  sanitizeUsername
};

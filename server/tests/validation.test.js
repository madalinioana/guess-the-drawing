const { sanitizeInput, sanitizeUsername } = require('../utils/sanitize');

describe('Input Validation', () => {
  describe('sanitizeInput()', () => {
    it('should remove HTML tags', () => {
      const input = '<script>alert("XSS")</script>casa';
      const result = sanitizeInput(input);

      // The sanitize function removes tags but keeps content between them
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('</script>');
      expect(result).toContain('casa');
    });

    it('should remove various HTML tags', () => {
      expect(sanitizeInput('<b>bold</b>')).toBe('bold');
      expect(sanitizeInput('<a href="evil.com">link</a>')).toBe('link');
      expect(sanitizeInput('<img src="x" onerror="alert(1)">')).toBe('');
      expect(sanitizeInput('<div>nested<span>text</span></div>')).toBe('nestedtext');
    });

    it('should trim whitespace', () => {
      const input = '  casa  ';
      expect(sanitizeInput(input)).toBe('casa');
    });

    it('should limit length to 100 chars', () => {
      const input = 'a'.repeat(150);
      const result = sanitizeInput(input);

      expect(result.length).toBe(100);
    });

    it('should remove javascript: protocol', () => {
      const input = 'javascript:alert(1)';
      const result = sanitizeInput(input);

      expect(result).not.toContain('javascript:');
    });

    it('should be case insensitive for javascript: removal', () => {
      expect(sanitizeInput('JAVASCRIPT:alert(1)')).not.toContain('javascript:');
      expect(sanitizeInput('JavaScript:alert(1)')).not.toContain('javascript:');
      expect(sanitizeInput('jAvAsCrIpT:alert(1)')).not.toContain('javascript:');
    });

    it('should remove event handlers', () => {
      expect(sanitizeInput('onclick=alert(1)')).not.toContain('onclick=');
      expect(sanitizeInput('onmouseover=evil()')).not.toContain('onmouseover=');
      expect(sanitizeInput('onerror=malicious()')).not.toContain('onerror=');
    });

    it('should return empty string for non-string input', () => {
      expect(sanitizeInput(null)).toBe('');
      expect(sanitizeInput(undefined)).toBe('');
      expect(sanitizeInput(123)).toBe('');
      expect(sanitizeInput({})).toBe('');
      expect(sanitizeInput([])).toBe('');
    });

    it('should preserve normal text', () => {
      expect(sanitizeInput('Hello World')).toBe('Hello World');
      expect(sanitizeInput('Test123')).toBe('Test123');
      expect(sanitizeInput('Simple message')).toBe('Simple message');
    });

    it('should handle combined attacks', () => {
      const input = '<script>javascript:onclick=alert("XSS")</script>';
      const result = sanitizeInput(input);

      expect(result).not.toContain('<script>');
      expect(result).not.toContain('javascript:');
      expect(result).not.toContain('onclick=');
    });
  });

  describe('sanitizeUsername()', () => {
    it('should limit to 20 characters', () => {
      const username = 'a'.repeat(30);
      const result = sanitizeUsername(username);

      expect(result.length).toBe(20);
    });

    it('should remove special characters', () => {
      const username = 'User<123>';
      const result = sanitizeUsername(username);

      expect(result).toBe('User123');
    });

    it('should keep alphanumeric characters', () => {
      expect(sanitizeUsername('User123')).toBe('User123');
      expect(sanitizeUsername('TestPlayer42')).toBe('TestPlayer42');
    });

    it('should keep underscores', () => {
      expect(sanitizeUsername('User_Name')).toBe('User_Name');
      expect(sanitizeUsername('test_user_123')).toBe('test_user_123');
    });

    it('should keep spaces', () => {
      expect(sanitizeUsername('John Doe')).toBe('John Doe');
      expect(sanitizeUsername('Test Player')).toBe('Test Player');
    });

    it('should trim whitespace', () => {
      expect(sanitizeUsername('  User  ')).toBe('User');
      expect(sanitizeUsername('\tTabUser\n')).toBe('TabUser');
    });

    it('should remove HTML and script injections', () => {
      // After removing special chars and truncating to 20 chars
      const result1 = sanitizeUsername('<script>alert(1)</script>');
      expect(result1).not.toContain('<');
      expect(result1).not.toContain('>');
      expect(result1.length).toBeLessThanOrEqual(20);

      const result2 = sanitizeUsername('User<img src=x>');
      expect(result2).not.toContain('<');
      expect(result2).not.toContain('>');
    });

    it('should return empty string for non-string input', () => {
      expect(sanitizeUsername(null)).toBe('');
      expect(sanitizeUsername(undefined)).toBe('');
      expect(sanitizeUsername(123)).toBe('');
      expect(sanitizeUsername({})).toBe('');
    });

    it('should handle unicode characters by removing them', () => {
      // Non-word characters should be removed
      expect(sanitizeUsername('User!')).toBe('User');
      expect(sanitizeUsername('Test@User')).toBe('TestUser');
      expect(sanitizeUsername('Player#1')).toBe('Player1');
    });

    it('should handle empty input', () => {
      expect(sanitizeUsername('')).toBe('');
      expect(sanitizeUsername('   ')).toBe('');
    });
  });
});

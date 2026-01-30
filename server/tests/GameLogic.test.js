const GameLogic = require('../services/GameLogic');

describe('GameLogic Service', () => {
  describe('checkGuess()', () => {
    it('should return true for correct guess', () => {
      const room = {
        currentWord: 'casa',
        drawerId: 'socket1'
      };

      const result = GameLogic.checkGuess(room, 'socket2', 'casa');
      expect(result).toBe(true);
    });

    it('should be case insensitive', () => {
      const room = { currentWord: 'casa', drawerId: 'socket1' };

      expect(GameLogic.checkGuess(room, 'socket2', 'CASA')).toBe(true);
      expect(GameLogic.checkGuess(room, 'socket2', 'CaSa')).toBe(true);
      expect(GameLogic.checkGuess(room, 'socket2', 'cAsA')).toBe(true);
    });

    it('should trim whitespace', () => {
      const room = { currentWord: 'casa', drawerId: 'socket1' };

      expect(GameLogic.checkGuess(room, 'socket2', '  casa  ')).toBe(true);
      expect(GameLogic.checkGuess(room, 'socket2', 'casa   ')).toBe(true);
      expect(GameLogic.checkGuess(room, 'socket2', '   casa')).toBe(true);
    });

    it('should return false for drawer guess', () => {
      const room = {
        currentWord: 'casa',
        drawerId: 'socket1'
      };

      const result = GameLogic.checkGuess(room, 'socket1', 'casa');
      expect(result).toBe(false);
    });

    it('should return false for incorrect guess', () => {
      const room = {
        currentWord: 'casa',
        drawerId: 'socket1'
      };

      expect(GameLogic.checkGuess(room, 'socket2', 'masina')).toBe(false);
      expect(GameLogic.checkGuess(room, 'socket2', 'cas')).toBe(false);
      expect(GameLogic.checkGuess(room, 'socket2', 'casaa')).toBe(false);
    });

    it('should return false for null/undefined room', () => {
      expect(GameLogic.checkGuess(null, 'socket2', 'casa')).toBe(false);
      expect(GameLogic.checkGuess(undefined, 'socket2', 'casa')).toBe(false);
    });

    it('should return false for room without currentWord', () => {
      const room = { drawerId: 'socket1' };
      expect(GameLogic.checkGuess(room, 'socket2', 'casa')).toBe(false);
    });
  });

  describe('calculateScore()', () => {
    it('should give max points (1000) for instant guess', () => {
      const score = GameLogic.calculateScore(0);
      expect(score).toBe(1000);
    });

    it('should decrease points over time', () => {
      expect(GameLogic.calculateScore(10)).toBe(850);
      expect(GameLogic.calculateScore(30)).toBe(550);
      expect(GameLogic.calculateScore(50)).toBe(250);
    });

    it('should have minimum score of 100', () => {
      expect(GameLogic.calculateScore(60)).toBe(100);
      expect(GameLogic.calculateScore(100)).toBe(100);
      expect(GameLogic.calculateScore(200)).toBe(100);
    });

    it('should work with custom max time', () => {
      // With 120 second max, at 60 seconds should be halfway
      const score = GameLogic.calculateScore(60, 120);
      expect(score).toBe(550); // Halfway between 1000 and 100
    });

    it('should return max points for negative time', () => {
      expect(GameLogic.calculateScore(-5)).toBe(1000);
    });
  });

  describe('calculateDrawerScore()', () => {
    it('should give full points when all players guessed', () => {
      const score = GameLogic.calculateDrawerScore(4, 4, 10);
      expect(score).toBe(10);
    });

    it('should give partial points based on guessed ratio', () => {
      expect(GameLogic.calculateDrawerScore(2, 4, 10)).toBe(5);
      expect(GameLogic.calculateDrawerScore(1, 4, 10)).toBe(3);
      expect(GameLogic.calculateDrawerScore(3, 4, 10)).toBe(8);
    });

    it('should return 0 when no players to guess', () => {
      expect(GameLogic.calculateDrawerScore(0, 0, 10)).toBe(0);
    });

    it('should work with custom base score', () => {
      expect(GameLogic.calculateDrawerScore(4, 4, 20)).toBe(20);
      expect(GameLogic.calculateDrawerScore(2, 4, 20)).toBe(10);
    });
  });

  describe('generateWordHint()', () => {
    it('should replace letters with underscores', () => {
      expect(GameLogic.generateWordHint('casa')).toBe('____');
      expect(GameLogic.generateWordHint('hello')).toBe('_____');
    });

    it('should preserve spaces and special characters', () => {
      expect(GameLogic.generateWordHint('ice cream')).toBe('___ _____');
      expect(GameLogic.generateWordHint('hello-world')).toBe('_____-_____');
    });

    it('should handle numbers', () => {
      expect(GameLogic.generateWordHint('r2d2')).toBe('____');
      expect(GameLogic.generateWordHint('abc123')).toBe('______');
    });

    it('should return empty string for invalid input', () => {
      expect(GameLogic.generateWordHint('')).toBe('');
      expect(GameLogic.generateWordHint(null)).toBe('');
      expect(GameLogic.generateWordHint(undefined)).toBe('');
    });
  });

  describe('revealLetter()', () => {
    it('should reveal one letter in the hint', () => {
      const word = 'casa';
      const hint = '____';
      const newHint = GameLogic.revealLetter(word, hint);

      // Should have exactly 3 underscores and 1 letter
      const underscores = (newHint.match(/_/g) || []).length;
      expect(underscores).toBe(3);
    });

    it('should return same hint if all letters revealed', () => {
      const word = 'casa';
      const hint = 'casa';
      const newHint = GameLogic.revealLetter(word, hint);

      expect(newHint).toBe('casa');
    });

    it('should handle spaces correctly', () => {
      const word = 'ice cream';
      const hint = '___ _____';
      const newHint = GameLogic.revealLetter(word, hint);

      // Space should remain, one letter revealed
      expect(newHint).toContain(' ');
      const underscores = (newHint.match(/_/g) || []).length;
      expect(underscores).toBe(7);
    });

    it('should handle invalid input', () => {
      expect(GameLogic.revealLetter(null, '____')).toBe('____');
      expect(GameLogic.revealLetter('casa', null)).toBe(null);
    });
  });
});

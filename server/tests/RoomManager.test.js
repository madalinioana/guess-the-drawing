const RoomManager = require('../services/RoomManager');

describe('RoomManager Service', () => {
  beforeEach(() => {
    RoomManager.reset(); // Reset state before each test
  });

  describe('createRoom()', () => {
    it('should create a new room', () => {
      const room = RoomManager.createRoom('host123', 'Alice');

      expect(room).toHaveProperty('id');
      expect(room).toHaveProperty('hostId', 'host123');
      expect(room.players).toHaveLength(1);
      expect(room.players[0].username).toBe('Alice');
    });

    it('should generate unique room IDs', () => {
      const room1 = RoomManager.createRoom('h1', 'User1');
      const room2 = RoomManager.createRoom('h2', 'User2');

      expect(room1.id).not.toBe(room2.id);
    });

    it('should include avatar when provided', () => {
      const room = RoomManager.createRoom('host123', 'Alice', { avatar: '😀' });

      expect(room.players[0].avatar).toBe('😀');
    });

    it('should use default avatar when not provided', () => {
      const room = RoomManager.createRoom('host123', 'Alice');

      expect(room.players[0].avatar).toBe('👤');
    });

    it('should include userId when provided', () => {
      const room = RoomManager.createRoom('host123', 'Alice', { userId: 'user_abc123' });

      expect(room.players[0].userId).toBe('user_abc123');
    });

    it('should initialize scores', () => {
      const room = RoomManager.createRoom('host123', 'Alice');

      expect(room.scores.get('Alice')).toBe(0);
    });
  });

  describe('addPlayer()', () => {
    it('should add player to existing room', () => {
      const room = RoomManager.createRoom('h1', 'Host');
      const success = RoomManager.addPlayer(room.id, {
        id: 'p2',
        username: 'Player2'
      });

      expect(success).toBe(true);
      expect(room.players).toHaveLength(2);
    });

    it('should reject if room is full', () => {
      const room = RoomManager.createRoom('h1', 'Host');

      // Add 7 more players (max 8)
      for (let i = 0; i < 7; i++) {
        RoomManager.addPlayer(room.id, {
          id: `p${i}`,
          username: `Player${i}`
        });
      }

      const result = RoomManager.addPlayer(room.id, {
        id: 'p8',
        username: 'Player8'
      });

      expect(result).toBe(false);
      expect(room.players).toHaveLength(8);
    });

    it('should reject if room does not exist', () => {
      const result = RoomManager.addPlayer('NONEXISTENT', {
        id: 'p1',
        username: 'Player1'
      });

      expect(result).toBe(false);
    });

    it('should reject if player already in room', () => {
      const room = RoomManager.createRoom('h1', 'Host');
      RoomManager.addPlayer(room.id, { id: 'p2', username: 'Player2' });

      const result = RoomManager.addPlayer(room.id, { id: 'p2', username: 'Player2' });

      expect(result).toBe(false);
      expect(room.players).toHaveLength(2);
    });

    it('should initialize score for new player', () => {
      const room = RoomManager.createRoom('h1', 'Host');
      RoomManager.addPlayer(room.id, { id: 'p2', username: 'Player2' });

      expect(room.scores.get('Player2')).toBe(0);
    });
  });

  describe('removePlayer()', () => {
    it('should remove player from room', () => {
      const room = RoomManager.createRoom('h1', 'Host');
      RoomManager.addPlayer(room.id, { id: 'p2', username: 'Player2' });

      const removed = RoomManager.removePlayer(room.id, 'p2');

      expect(removed.username).toBe('Player2');
      expect(room.players).toHaveLength(1);
    });

    it('should delete room when last player leaves', () => {
      const room = RoomManager.createRoom('h1', 'Host');
      RoomManager.removePlayer(room.id, 'h1');

      expect(RoomManager.roomExists(room.id)).toBe(false);
    });

    it('should assign new host when host leaves', () => {
      const room = RoomManager.createRoom('h1', 'Host');
      RoomManager.addPlayer(room.id, { id: 'p2', username: 'Player2' });

      RoomManager.removePlayer(room.id, 'h1');

      expect(room.hostId).toBe('p2');
    });

    it('should return null for non-existent room', () => {
      const result = RoomManager.removePlayer('NONEXISTENT', 'p1');
      expect(result).toBeNull();
    });

    it('should return null for non-existent player', () => {
      const room = RoomManager.createRoom('h1', 'Host');
      const result = RoomManager.removePlayer(room.id, 'nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getRoom()', () => {
    it('should return room when exists', () => {
      const created = RoomManager.createRoom('h1', 'Host');
      const found = RoomManager.getRoom(created.id);

      expect(found).toBe(created);
    });

    it('should return null when room does not exist', () => {
      const found = RoomManager.getRoom('NONEXISTENT');
      expect(found).toBeNull();
    });
  });

  describe('isHost()', () => {
    it('should return true for host', () => {
      const room = RoomManager.createRoom('h1', 'Host');
      expect(RoomManager.isHost(room.id, 'h1')).toBe(true);
    });

    it('should return false for non-host', () => {
      const room = RoomManager.createRoom('h1', 'Host');
      RoomManager.addPlayer(room.id, { id: 'p2', username: 'Player2' });

      expect(RoomManager.isHost(room.id, 'p2')).toBe(false);
    });

    it('should return false for non-existent room', () => {
      expect(RoomManager.isHost('NONEXISTENT', 'h1')).toBe(false);
    });
  });

  describe('getPlayers()', () => {
    it('should return all players', () => {
      const room = RoomManager.createRoom('h1', 'Host');
      RoomManager.addPlayer(room.id, { id: 'p2', username: 'Player2' });

      const players = RoomManager.getPlayers(room.id);

      expect(players).toHaveLength(2);
      expect(players[0].username).toBe('Host');
      expect(players[1].username).toBe('Player2');
    });

    it('should return empty array for non-existent room', () => {
      expect(RoomManager.getPlayers('NONEXISTENT')).toEqual([]);
    });
  });

  describe('getPlayerCount()', () => {
    it('should return correct count', () => {
      const room = RoomManager.createRoom('h1', 'Host');
      expect(RoomManager.getPlayerCount(room.id)).toBe(1);

      RoomManager.addPlayer(room.id, { id: 'p2', username: 'Player2' });
      expect(RoomManager.getPlayerCount(room.id)).toBe(2);
    });

    it('should return 0 for non-existent room', () => {
      expect(RoomManager.getPlayerCount('NONEXISTENT')).toBe(0);
    });
  });

  describe('updateScore()', () => {
    it('should update player score', () => {
      const room = RoomManager.createRoom('h1', 'Host');
      const newScore = RoomManager.updateScore(room.id, 'Host', 100);

      expect(newScore).toBe(100);
      expect(room.scores.get('Host')).toBe(100);
    });

    it('should accumulate scores', () => {
      const room = RoomManager.createRoom('h1', 'Host');
      RoomManager.updateScore(room.id, 'Host', 50);
      const newScore = RoomManager.updateScore(room.id, 'Host', 30);

      expect(newScore).toBe(80);
    });

    it('should return -1 for non-existent room', () => {
      expect(RoomManager.updateScore('NONEXISTENT', 'Host', 100)).toBe(-1);
    });
  });

  describe('getScores()', () => {
    it('should return all scores', () => {
      const room = RoomManager.createRoom('h1', 'Host');
      RoomManager.addPlayer(room.id, { id: 'p2', username: 'Player2' });
      RoomManager.updateScore(room.id, 'Host', 100);
      RoomManager.updateScore(room.id, 'Player2', 50);

      const scores = RoomManager.getScores(room.id);

      expect(scores).toContainEqual(['Host', 100]);
      expect(scores).toContainEqual(['Player2', 50]);
    });

    it('should return empty array for non-existent room', () => {
      expect(RoomManager.getScores('NONEXISTENT')).toEqual([]);
    });
  });

  describe('roomExists()', () => {
    it('should return true for existing room', () => {
      const room = RoomManager.createRoom('h1', 'Host');
      expect(RoomManager.roomExists(room.id)).toBe(true);
    });

    it('should return false for non-existing room', () => {
      expect(RoomManager.roomExists('NONEXISTENT')).toBe(false);
    });
  });

  describe('deleteRoom()', () => {
    it('should delete existing room', () => {
      const room = RoomManager.createRoom('h1', 'Host');
      const deleted = RoomManager.deleteRoom(room.id);

      expect(deleted).toBe(true);
      expect(RoomManager.roomExists(room.id)).toBe(false);
    });

    it('should return false for non-existing room', () => {
      expect(RoomManager.deleteRoom('NONEXISTENT')).toBe(false);
    });
  });
});

const crypto = require('crypto');

class RoomManager {
  constructor() {
    this.rooms = new Map();
    this.maxPlayersPerRoom = 8;
  }

  generateRoomId() {
    let roomId;
    do {
      roomId = crypto.randomBytes(4).toString('hex').toUpperCase();
    } while (this.rooms.has(roomId));
    return roomId;
  }

  createRoom(hostId, username, options = {}) {
    const roomId = this.generateRoomId();

    const room = {
      id: roomId,
      hostId: hostId,
      players: [
        {
          id: hostId,
          username: username,
          avatar: options.avatar || '👤',
          userId: options.userId || null,
          score: 0
        }
      ],
      createdAt: new Date(),
      gameState: null,
      scores: new Map([[username, 0]])
    };

    this.rooms.set(roomId, room);
    return room;
  }

  getRoom(roomId) {
    return this.rooms.get(roomId) || null;
  }

  addPlayer(roomId, player) {
    const room = this.rooms.get(roomId);

    if (!room) return false;
    if (room.players.length >= this.maxPlayersPerRoom) return false;
    if (room.players.some(p => p.id === player.id)) return false;

    room.players.push({
      id: player.id,
      username: player.username,
      avatar: player.avatar || '👤',
      userId: player.userId || null,
      score: 0
    });

    room.scores.set(player.username, 0);

    return true;
  }

  removePlayer(roomId, playerId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return null;

    const [removedPlayer] = room.players.splice(playerIndex, 1);
    room.scores.delete(removedPlayer.username);

    if (room.players.length === 0) {
      this.rooms.delete(roomId);
    } else if (room.hostId === playerId) {
      room.hostId = room.players[0].id;
    }

    return removedPlayer;
  }

  isHost(roomId, playerId) {
    const room = this.rooms.get(roomId);
    return room ? room.hostId === playerId : false;
  }

  getPlayers(roomId) {
    const room = this.rooms.get(roomId);
    return room ? room.players : [];
  }

  getPlayerCount(roomId) {
    const room = this.rooms.get(roomId);
    return room ? room.players.length : 0;
  }

  roomExists(roomId) {
    return this.rooms.has(roomId);
  }

  deleteRoom(roomId) {
    return this.rooms.delete(roomId);
  }

  getAllRooms() {
    return Array.from(this.rooms.values());
  }

  updateScore(roomId, username, points) {
    const room = this.rooms.get(roomId);
    if (!room) return -1;

    const currentScore = room.scores.get(username) || 0;
    const newScore = currentScore + points;
    room.scores.set(username, newScore);

    const player = room.players.find(p => p.username === username);
    if (player) {
      player.score = newScore;
    }

    return newScore;
  }

  getScores(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    return Array.from(room.scores.entries());
  }

  reset() {
    this.rooms.clear();
  }
}

module.exports = new RoomManager();

const { createServer } = require("http");
const Client = require("socket.io-client");
const { Server } = require("socket.io");

describe("Socket.IO Server - Unit Tests", () => {
  let io, server, clientSocket;

  beforeAll((done) => {
    server = createServer();
    io = new Server(server);
    server.listen(() => {
      const port = server.address().port;
      clientSocket = Client(`http://localhost:${port}`);
      io.on("connection", (socket) => {
        socket.on("createRoom", (username) => {
          socket.emit("roomCreated", "4321");
        });
      });
      clientSocket.on("connect", done);
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
    server.close();
  });

  test("createRoom should emit roomCreated", (done) => {
    clientSocket.emit("createRoom", "TestUser");
    clientSocket.on("roomCreated", (roomId) => {
      expect(roomId).toBe("4321");
      done();
    });
  });
});

describe("Socket.IO Integration Tests", () => {
  let io, server, client1, client2;
  const rooms = new Map();

  beforeAll((done) => {
    server = createServer();
    io = new Server(server);

    io.on("connection", (socket) => {
      socket.on("createRoom", (data) => {
        const username = typeof data === "string" ? data : data?.username;
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();

        rooms.set(roomId, {
          players: new Set([socket.id]),
          currentWord: null,
          drawerId: socket.id
        });

        socket.roomId = roomId;
        socket.username = username;
        socket.join(roomId);

        socket.emit("roomCreated", roomId);
      });

      socket.on("joinRoom", ({ roomId, username }) => {
        const room = rooms.get(roomId);
        if (!room) {
          socket.emit("error", "Room does not exist!");
          return;
        }

        room.players.add(socket.id);
        socket.roomId = roomId;
        socket.username = username;
        socket.join(roomId);

        socket.emit("roomJoined", { roomId });
        io.to(roomId).emit("playerJoined", { username });
      });

      socket.on("submitWord", ({ roomId, word }) => {
        const room = rooms.get(roomId);
        if (room) {
          room.currentWord = word.toLowerCase();
          socket.emit("wordAccepted");
        }
      });

      socket.on("drawing", (data) => {
        const roomId = socket.roomId;
        if (roomId) {
          socket.broadcast.to(roomId).emit("drawingReceived", data);
        }
      });

      socket.on("guess", ({ roomId, text }) => {
        const room = rooms.get(roomId);
        if (room && room.currentWord && text.toLowerCase().trim() === room.currentWord) {
          socket.emit("correctGuess", { correct: true, word: room.currentWord });
          io.to(roomId).emit("guessResult", {
            username: socket.username,
            correct: true
          });
        } else {
          socket.emit("correctGuess", { correct: false });
        }
      });

      socket.on("message", (text) => {
        const roomId = socket.roomId;
        if (roomId) {
          io.to(roomId).emit("message", {
            username: socket.username,
            message: text
          });
        }
      });

      socket.on("disconnect", () => {
        const roomId = socket.roomId;
        if (roomId && rooms.has(roomId)) {
          const room = rooms.get(roomId);
          room.players.delete(socket.id);
          if (room.players.size === 0) {
            rooms.delete(roomId);
          }
        }
      });
    });

    server.listen(() => {
      done();
    });
  });

  beforeEach((done) => {
    const port = server.address().port;
    client1 = Client(`http://localhost:${port}`);
    client2 = Client(`http://localhost:${port}`);

    let connected = 0;
    const checkBoth = () => {
      connected++;
      if (connected === 2) done();
    };

    client1.on("connect", checkBoth);
    client2.on("connect", checkBoth);
  });

  afterEach(() => {
    client1.disconnect();
    client2.disconnect();
    rooms.clear();
  });

  afterAll(() => {
    io.close();
    server.close();
  });

  describe("Room Management", () => {
    test("should create a room and receive room ID", (done) => {
      client1.emit("createRoom", { username: "Host" });
      client1.on("roomCreated", (roomId) => {
        expect(roomId).toBeDefined();
        expect(typeof roomId).toBe("string");
        expect(roomId.length).toBeGreaterThan(0);
        done();
      });
    });

    test("should allow second client to join room", (done) => {
      client1.emit("createRoom", { username: "Host" });
      client1.on("roomCreated", (roomId) => {
        client2.emit("joinRoom", { roomId, username: "Guesser" });
        client2.on("roomJoined", (data) => {
          expect(data.roomId).toBe(roomId);
          done();
        });
      });
    });

    test("should emit error for non-existent room", (done) => {
      client1.emit("joinRoom", { roomId: "NONEXISTENT", username: "Test" });
      client1.on("error", (message) => {
        expect(message).toBe("Room does not exist!");
        done();
      });
    });

    test("should notify all players when someone joins", (done) => {
      client1.emit("createRoom", { username: "Host" });
      client1.on("roomCreated", (roomId) => {
        client1.on("playerJoined", (data) => {
          expect(data.username).toBe("Guesser");
          done();
        });

        client2.emit("joinRoom", { roomId, username: "Guesser" });
      });
    });
  });

  describe("Drawing Synchronization", () => {
    test("should broadcast drawing to other clients", (done) => {
      client1.emit("createRoom", { username: "Drawer" });
      client1.on("roomCreated", (roomId) => {
        client2.emit("joinRoom", { roomId, username: "Guesser" });

        client2.on("roomJoined", () => {
          client2.on("drawingReceived", (drawData) => {
            expect(drawData).toHaveProperty("x", 100);
            expect(drawData).toHaveProperty("y", 150);
            expect(drawData).toHaveProperty("color", "#000");
            done();
          });

          setTimeout(() => {
            client1.emit("drawing", {
              x: 100,
              y: 150,
              color: "#000"
            });
          }, 100);
        });
      });
    });

    test("should not send drawing back to sender", (done) => {
      let receivedOwnDrawing = false;

      client1.emit("createRoom", { username: "Drawer" });
      client1.on("roomCreated", (roomId) => {
        client1.on("drawingReceived", () => {
          receivedOwnDrawing = true;
        });

        client1.emit("drawing", { x: 100, y: 100, color: "#000" });

        setTimeout(() => {
          expect(receivedOwnDrawing).toBe(false);
          done();
        }, 200);
      });
    });
  });

  describe("Word Submission", () => {
    test("should handle manual word input from drawer", (done) => {
      client1.emit("createRoom", { username: "Host" });

      client1.on("roomCreated", (roomId) => {
        client1.emit("submitWord", { roomId, word: "casa" });

        client1.on("wordAccepted", () => {
          done();
        });
      });
    });
  });

  describe("Guessing", () => {
    test("should detect correct guess", (done) => {
      client1.emit("createRoom", { username: "Host" });

      client1.on("roomCreated", (roomId) => {
        client1.emit("submitWord", { roomId, word: "test" });

        client1.on("wordAccepted", () => {
          client2.emit("joinRoom", { roomId, username: "Guesser" });

          client2.on("roomJoined", () => {
            client2.on("correctGuess", (result) => {
              expect(result).toHaveProperty("correct", true);
              done();
            });

            setTimeout(() => {
              client2.emit("guess", { roomId, text: "test" });
            }, 100);
          });
        });
      });
    });

    test("should detect incorrect guess", (done) => {
      client1.emit("createRoom", { username: "Host" });

      client1.on("roomCreated", (roomId) => {
        client1.emit("submitWord", { roomId, word: "test" });

        client1.on("wordAccepted", () => {
          client2.emit("joinRoom", { roomId, username: "Guesser" });

          client2.on("roomJoined", () => {
            client2.on("correctGuess", (result) => {
              expect(result).toHaveProperty("correct", false);
              done();
            });

            setTimeout(() => {
              client2.emit("guess", { roomId, text: "wrong" });
            }, 100);
          });
        });
      });
    });

    test("should be case insensitive for guesses", (done) => {
      client1.emit("createRoom", { username: "Host" });

      client1.on("roomCreated", (roomId) => {
        client1.emit("submitWord", { roomId, word: "HELLO" });

        client1.on("wordAccepted", () => {
          client2.emit("joinRoom", { roomId, username: "Guesser" });

          client2.on("roomJoined", () => {
            client2.on("correctGuess", (result) => {
              expect(result).toHaveProperty("correct", true);
              done();
            });

            setTimeout(() => {
              client2.emit("guess", { roomId, text: "hello" });
            }, 100);
          });
        });
      });
    });
  });

  describe("Chat Messages", () => {
    test("should broadcast messages to all players", (done) => {
      client1.emit("createRoom", { username: "Host" });

      client1.on("roomCreated", (roomId) => {
        client2.emit("joinRoom", { roomId, username: "Player2" });

        client2.on("roomJoined", () => {
          client1.on("message", (data) => {
            expect(data.username).toBe("Player2");
            expect(data.message).toBe("Hello everyone!");
            done();
          });

          setTimeout(() => {
            client2.emit("message", "Hello everyone!");
          }, 100);
        });
      });
    });
  });
});

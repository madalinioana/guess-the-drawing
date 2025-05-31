const { createServer } = require("http");
const Client = require("socket.io-client");
const { Server } = require("socket.io");

describe("Socket.IO Server", () => {
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

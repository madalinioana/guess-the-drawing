import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import DrawingBoard from "./DrawingBoard";

const socket = io("http://localhost:3001");

function App() {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [inputRoomId, setInputRoomId] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [usersInRoom, setUsersInRoom] = useState([]);
  const [isCreator, setIsCreator] = useState(false);
  const [game, setGame] = useState({
  phase: 'waiting', // 'waiting', 'drawing', 'guessing'
  timeLeft: 0,
  currentWord: '',
  hint: '',
  drawer: ''
})
const [gameState, setGameState] = useState({ phase: "waiting" }); // sau "drawing", etc.
const [isDrawer, setIsDrawer] = useState(false);

  useEffect(() => {
    socket.on("roomCreated", (newRoomId) => {
      setRoomId(newRoomId);
      setIsCreator(true); // Utilizatorul este creatorul camerei
    });


    socket.on("message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on("error", (errorMsg) => {
      alert(errorMsg); // Afișează erori (ex: cameră inexistentă)
    });

    socket.on("updateUsers", (users) => {
    setUsersInRoom(users);
  });
  socket.on("game-state", (state) => {
  setGame(state);
  setIsDrawer(state.currentDrawerId === socket.id); // sau cum ai tu logică
});


  // Resetează lista când utilizatorul părăsește camera
  // Primeste confirmarea conectării + lista de jucători existenți
socket.on("roomJoined", ({ roomId, users }) => {
    setRoomId(roomId);
    setUsersInRoom(users); // Setează lista inițială
  });
socket.on("youAreDrawer", (word) => {
  setGame(prev => ({ ...prev, isDrawer: true, currentWord: word }));
});

 socket.on("roundStarted", (data) => {
      setGame(prev => ({ 
        ...prev,
        isDrawer: false,
        hint: data.hint,
        timeLeft: 30,
        lastWinner: ""
      }));
    });

socket.on('setPhase', (data) => {
  setGame(prev => ({
    ...prev,
    phase: data.phase,
    currentWord: data.word || '',
    hint: data.hint || '',
    drawer: data.drawer || '',
    timeLeft: data.phase === 'drawing' ? 30 : 60
  }));
});

socket.on('timeUpdate', (data) => {
  setGame(prev => ({
    ...prev,
    timeLeft: data.time
  }));
});


socket.on("correctGuess", ({ username, word }) => {
  setMessages(prev => [...prev, {
    username: "System",
    message: `${username} a ghicit cuvântul "${word}"!`
  }]);
});
 socket.on("drawing", (data) => {
      const canvas = canvasRef.current;
      if (!canvas || game.isDrawer) return;
      const ctx = canvas.getContext('2d');
      ctx.lineTo(data.x, data.y);
      ctx.stroke();
    });

    socket.on("youAreDrawer", (word) => {
      setGame(prev => ({ 
        ...prev, 
        isDrawer: true, 
        currentWord: word,
        timeLeft: 30
      }));
    });
    socket.on("correctGuess", ({ username, word }) => {
      setGame(prev => ({ ...prev, lastWinner: `${username} a ghicit "${word}"` }));
    });
    return () => {
      socket.off("roomCreated");
      socket.off("roomJoined");
      socket.off("message");
      socket.off("error");
      socket.off("updateUsers");
      socket.off("drawing");
    };
  }, [game.isDrawer]);

  const handleCreateRoom = () => {
    if (username.trim()) {
      socket.emit("createRoom", username);
    }
  };

  const handleJoinRoom = () => {
    if (username.trim() && inputRoomId.trim()) {
      socket.emit("joinRoom", { roomId: inputRoomId, username });
    }
  };

  const handleStartGame = () => {
  if (roomId) {
    socket.emit("startGame", roomId);
  }
};
  const handleSendMessage = () => {
    if (message.trim() && roomId) {
      socket.emit("message", message);
      setMessage("");
    }
  };
const handleGuess = (guess) => {
    socket.emit("guess", guessInput, (isCorrect) => {
      if (isCorrect) {
        setGuessInput("");
      }
    });
  };
socket.on("receive-drawing", (data) => {
  // Va fi procesat de DrawingBoard, nu e nevoie să faci nimic aici
});

socket.on("clear-board", () => {
  // DrawingBoard ascultă deja acest eveniment
});

const canvasRef = useRef(null);
const [isDrawing, setIsDrawing] = useState(false);
const [guessInput, setGuessInput] = useState("");

// Funcții desen
  const handleDrawStart = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    setIsDrawing(true);
  };

  const handleDrawing = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
    
    socket.emit("draw", {
      x: e.nativeEvent.offsetX,
      y: e.nativeEvent.offsetY
    });
  };
  const handleDrawEnd = () => {
  setIsDrawing(false);
};

  return (
  <div style={{ padding: 20, maxWidth: 800, margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
    <h2 style={{ textAlign: 'center', color: '#4a4a4a', marginBottom: 30 }}>🎨 Skribbl Clone</h2>

    {!roomId ? (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 15 }}>
        <input
          placeholder="Nume de utilizator"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ padding: 10, width: '100%', maxWidth: 300, borderRadius: 5, border: '1px solid #ddd' }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%' }}>
          <button
            onClick={handleCreateRoom}
            style={{ padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer', width: '100%', maxWidth: 300 }}
          >
            Creează cameră
          </button>

          <p style={{ fontSize: 14, color: '#666', margin: '10px 0' }}>Sau</p>

          <input
            placeholder="ID Camera existentă"
            value={inputRoomId}
            onChange={(e) => setInputRoomId(e.target.value)}
            style={{ padding: 10, width: '100%', maxWidth: 300, borderRadius: 5, border: '1px solid #ddd' }}
          />

          <button
            onClick={handleJoinRoom}
            style={{ padding: '10px 20px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer', width: '100%', maxWidth: 300 }}
          >
            Alătură-te
          </button>
        </div>
      </div>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header info */}
        <div style={{ backgroundColor: '#f5f5f5', padding: 15, borderRadius: 8 }}>
          <h3 style={{ margin: 0, color: '#333', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>Camera: {roomId}</span>
            {isCreator && <span style={{ backgroundColor: '#FF9800', color: 'white', padding: '3px 8px', borderRadius: 10, fontSize: 12 }}>Creator</span>}
          </h3>
          <p style={{ margin: '10px 0 0 0', color: '#555' }}>👥 Jucători: {usersInRoom.join(", ")}</p>
          <p style={{ margin: '5px 0 0 0', fontWeight: 'bold' }}>
            {game.phase === 'drawing' ? '🎨 Faza de desen' : '🔍 Faza de ghicit'} | Timp: {game.timeLeft}s
          </p>
        </div>

        {/* Buton start */}
        {isCreator && game.phase === 'waiting' && (
          <button 
            onClick={handleStartGame}
            style={{ padding: '12px 24px', backgroundColor: '#9C27B0', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer', fontSize: 16, fontWeight: 'bold', alignSelf: 'center' }}
          >
            Start Joc
          </button>
        )}
        
        {/* Faza de desen
        {game.phase === 'drawing' && game.isDrawer && (
          <div style={{ backgroundColor: 'white', padding: 20, borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <p style={{ margin: '0 0 15px 0', fontSize: 18, fontWeight: 'bold', color: '#333' }}>
              Desenează: <span style={{color: '#E91E63'}}>{game.currentWord}</span>
            </p>
            
            <canvas
              width={800}
              height={500}
              style={{
                border: '2px solid #ddd',
                borderRadius: 5,
                backgroundColor: 'white',
                cursor: 'crosshair',
                width: '100%'
              }}
              onMouseDown={handleDrawStart}
              onMouseMove={handleDrawing}
              onMouseUp={handleDrawEnd}
              ref={canvasRef}
            />
            
            <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
              <button
                onClick={() => {
                  const ctx = canvasRef.current.getContext('2d');
                  ctx.clearRect(0, 0, 800, 500);
                }}
                style={{ padding: '8px 16px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
              >
                Șterge desenul
              </button>
            </div>
          </div>
        )} */}

        {/* Faza de ghicit */}
        {game.phase === 'guessing' && !game.isDrawer && (
          <div style={{ backgroundColor: 'white', padding: 20, borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <p style={{ margin: '0 0 15px 0', fontSize: 18, fontWeight: 'bold', color: '#333' }}>
              Ghicește desenul făcut de <span style={{color: '#3F51B5'}}>{game.drawer}</span>
            </p>
            
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                placeholder="Scrie răspunsul aici..."
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    socket.emit("guess", e.target.value);
                    e.target.value = "";
                  }
                }}
                style={{ padding: 10, flex: 1, borderRadius: 5, border: '1px solid #ddd', fontSize: 16 }}
              />
              
              <button
                onClick={(e) => {
                  const input = e.target.previousElementSibling;
                  socket.emit("guess", input.value);
                  input.value = "";
                }}
                style={{ padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer', fontSize: 16 }}
              >
                Trimite
              </button>
            </div>
            
            <p style={{ margin: '10px 0 0 0', fontSize: 14, color: '#666' }}>
              Indicii: <span style={{letterSpacing: 3}}>{game.hint}</span>
            </p>
          </div>
        )}

        {/* Chat */}
        <div style={{ backgroundColor: 'white', padding: 20, borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#333', borderBottom: '1px solid #eee', paddingBottom: 10 }}>Chat</h4>
          
          <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
            <input
              placeholder="Scrie un mesaj..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              style={{ padding: 10, flex: 1, borderRadius: 5, border: '1px solid #ddd', fontSize: 16 }}
            />
            
            <button
              onClick={handleSendMessage}
              style={{ padding: '10px 20px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer', fontSize: 16 }}
            >
              Trimite
            </button>
          </div>
          
          <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #eee', borderRadius: 5, padding: 10 }}>
            {messages.map((m, i) => (
              <div 
                key={i}
                style={{ marginBottom: 8, paddingBottom: 8, borderBottom: i < messages.length - 1 ? '1px dashed #eee' : 'none' }}
              >
                <strong style={{color: '#3F51B5'}}>{m.username}: </strong>
                <span>{m.message}</span>
              </div>
            ))}
          </div>
        </div>
        
          {game.phase === "drawing" && (
            <DrawingBoard
              socket={socket}
              isDrawer={game.isDrawer} // Trimitem direct din starea jocului
              gamePhase={game.phase}
              currentWord={game.currentWord} // Adăugăm cuvântul pentru afișare
            />
          )}

        {/* Afișare câștigător */}
        {game.lastWinner && (
          <div style={{ 
            backgroundColor: '#E8F5E9', 
            padding: 15, 
            borderRadius: 8,
            borderLeft: '4px solid #4CAF50'
          }}>
            <p style={{ margin: 0, color: '#2E7D32', fontWeight: 'bold' }}>
              🎉 {game.lastWinner}
            </p>
          </div>
        )}
      </div>
    )}
  </div>
);
}

export default App;
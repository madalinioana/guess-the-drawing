import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Line } from 'react-konva';

const DrawingBoard = ({ socket, isDrawer, gamePhase, currentWord }) => {
  const [lines, setLines] = useState([]);
  const stageRef = useRef(null);

  // Primire desene de la server
  useEffect(() => {
    if (!isDrawer) {
      socket.on('receive-drawing', (newLines) => {
        setLines(newLines);
      });

      socket.on('clear-board', () => {
        setLines([]);
      });
    }

    return () => {
      socket.off('receive-drawing');
      socket.off('clear-board');
    };
  }, [isDrawer]);

  const handleMouseDown = (e) => {
     console.log("Mouse down - isDrawer:", isDrawer);
    if (!isDrawer) return;
    const pos = e.target.getStage().getPointerPosition();
    setLines([...lines, { points: [pos.x, pos.y] }]);
  };

  const handleMouseMove = (e) => {
    console.log('Mouse move event:', e);
  if (!isDrawer || lines.length === 0) return;
  
  // Obține poziția cursorului corect
  const stage = e.target.getStage();
  const pos = stage.getPointerPosition();
  
  // Actualizează ultima linie
  const lastLine = lines[lines.length - 1];
  lastLine.points = lastLine.points.concat([pos.x, pos.y]);
  
  // Actualizează starea liniilor
  setLines([...lines.slice(0, -1), lastLine]);
  
  // Trimite actualizarea la server
  if (isDrawer) {
    socket.emit('send-drawing', lines);
  }
};
  const handleMouseUp = () => {
    if (!isDrawer) return;
    socket.emit('send-drawing', lines); // Ultima actualizare
  };

  const clearCanvas = () => {
    if (!isDrawer) return;
    setLines([]);
    socket.emit('clear-board');
  };

  return (
    <div style={{ 
      backgroundColor: 'white', 
      padding: 20, 
      borderRadius: 8,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      {isDrawer && (
        <p style={{ marginBottom: 15, fontWeight: 'bold' }}>
          Desenează: <span style={{ color: '#E91E63' }}>{currentWord}</span>
        </p>
      )}
      
      <Stage
        width={800}
        height={500}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        ref={stageRef}
        style={{
          border: '2px solid #ddd',
          borderRadius: 5,
          backgroundColor: 'white',
          cursor: isDrawer ? 'crosshair' : 'default'
        }}
      >
        <Layer>
          {lines.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke="#000"
              strokeWidth={5}
              lineCap="round"
              lineJoin="round"
            />
          ))}
        </Layer>
      </Stage>

      {isDrawer && (
        <button
          onClick={clearCanvas}
          style={{
            marginTop: 10,
            padding: '8px 16px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          Șterge desenul
        </button>
      )}
    </div>
  );
};

export default DrawingBoard;
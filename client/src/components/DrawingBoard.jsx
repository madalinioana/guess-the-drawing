import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Line } from 'react-konva';

export default function DrawingBoard({ socket, isDrawer, currentWord }) {
  const [lines, setLines] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef(null);

  // Responsive sizing: măsurăm lățimea containerului și calculăm înălțimea
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        const height = (500 / 800) * width; // menținem raport 800x500
        setDimensions({ width, height });
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Primesc desen de la server
  useEffect(() => {
    if (!isDrawer) {
      socket.on('receive-drawing', newLines => setLines(newLines));
      socket.on('clear-board', () => setLines([]));
    }
    return () => {
      socket.off('receive-drawing');
      socket.off('clear-board');
    };
  }, [isDrawer, socket]);

  // Resetare isDrawing la mouseup oriunde
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDrawing) {
        setIsDrawing(false);
        socket.emit('send-drawing', lines);
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDrawing, lines, socket]);

  const handleMouseDown = e => {
    if (!isDrawer) return;
    const pos = e.target.getStage().getPointerPosition();
    setLines([...lines, { points: [pos.x, pos.y] }]);
    setIsDrawing(true);
  };

  const handleMouseMove = e => {
    if (!isDrawer || !isDrawing) return;
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    const lastLine = lines[lines.length - 1];
    lastLine.points = lastLine.points.concat([pos.x, pos.y]);
    setLines([...lines.slice(0, -1), lastLine]);
    socket.emit('send-drawing', lines);
  };

  const handleMouseUp = () => {
    if (!isDrawer) return;
    if (isDrawing) {
      setIsDrawing(false);
      socket.emit('send-drawing', lines);
    }
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

      <div
        ref={containerRef}
        style={{
          width: '100%',
          maxWidth: '100%',
          border: '2px solid #ddd',
          borderRadius: 5,
          overflow: 'hidden',
          margin: '0 auto'
        }}
      >
        <Stage
          width={dimensions.width}
          height={dimensions.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: isDrawer ? 'crosshair' : 'default', display: 'block' }}
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
      </div>

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
}

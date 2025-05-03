import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Line } from 'react-konva';

export default function DrawingBoard({ socket, isDrawer, currentWord, phase }) {
  const [lines, setLines] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [wordInput, setWordInput] = useState("");
  const containerRef = useRef(null);

  // Responsivitate
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        const height = (500 / 800) * width;
        setDimensions({ width, height });
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Primi desen pentru ceilalti
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

  // Trimite desen la mouse up
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

  // Mouse down only in drawing phase pentru drawer
  const handleMouseDown = e => {
    if (!isDrawer || phase !== 'drawing') return;
    const pos = e.target.getStage().getPointerPosition();
    setLines([...lines, { points: [pos.x, pos.y] }]);
    setIsDrawing(true);
  };

  // Mouse move only in drawing phase
  const handleMouseMove = e => {
    if (!isDrawer || !isDrawing || phase !== 'drawing') return;
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    const lastLine = lines[lines.length - 1];
    lastLine.points = lastLine.points.concat([pos.x, pos.y]);
    setLines([...lines.slice(0, -1), lastLine]);
    socket.emit('send-drawing', lines);
  };

  // Clear canvas doar in drawing
  const clearCanvas = () => {
    if (!isDrawer || phase !== 'drawing') return;
    setLines([]);
    socket.emit('clear-board');
  };

  // Trimite cuvant selectat
  const submitWord = () => {
    const trimmed = wordInput.trim().toLowerCase();
    if (!trimmed) return;
    socket.emit('select-word', trimmed);
    setWordInput("");
  };

  return (
    <div style={{
      backgroundColor: 'white',
      padding: 20,
      borderRadius: 8,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: 20
    }}>
      {/* Select-word doar in faza select-word */}
      {isDrawer && phase === 'select-word' && (
        <div style={{ marginBottom: 15 }}>
          <p style={{ fontWeight: 'bold', marginBottom: 10 }}>
            Alege un cuvânt de desenat:
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <input 
              value={wordInput}
              onChange={e => setWordInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && submitWord()}
              placeholder="Scrie un cuvânt..."
              style={{ flex: 1, padding: 10, borderRadius: 5, border: '1px solid #ddd' }}
            />
            <button 
              onClick={submitWord}
              style={{
                padding: '10px 20px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: 5,
                cursor: 'pointer'
              }}
            >
              Alege
            </button>
          </div>
        </div>
      )}

      {/* Instrucțiuni desenare doar in drawing */}
      {isDrawer && phase === 'drawing' && (
        <p style={{ marginBottom: 15, fontWeight: 'bold' }}>
          Desenează: <span style={{ color: '#E91E63' }}>{currentWord}</span>
        </p>
      )}
      {!isDrawer && phase === 'drawing' && (
        <p style={{ marginBottom: 15, fontWeight: 'bold' }}>
          Ghicește cuvântul din desen! Scrie răspunsul în chat.
        </p>
      )}

      {/* Canvas */}
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
          style={{ cursor: (isDrawer && phase === 'drawing') ? 'crosshair' : 'default', display: 'block' }}
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

      {/* Clear doar in drawing */}
      {isDrawer && phase === 'drawing' && (
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
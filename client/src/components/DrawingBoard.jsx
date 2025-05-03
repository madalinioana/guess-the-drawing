import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import eraserIcon from './eraser_PNG52.png'; // Importă imaginea cu radiera

const COLORS = ['#000', '#f44336', '#4caf50', '#2196f3', '#ff9800', '#9c27b0'];
const ERASER_COLOR = 'white';

export default function DrawingBoard({ socket, isDrawer, currentWord }) {
  const [lines, setLines] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef(null);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [isErasing, setIsErasing] = useState(false);
  const [strokeWidth, setStrokeWidth] = useState(5); // Grosimea inițială a liniei

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
    const color = isErasing ? ERASER_COLOR : selectedColor;
    setLines([...lines, { points: [pos.x, pos.y], color: color, strokeWidth }]); // Include grosimea liniei
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

  const handleColorChange = (color) => {
    setSelectedColor(color);
    setIsErasing(false);
  };

  const handleEraserClick = () => {
    setIsErasing(true);
  };

  const handleStrokeWidthChange = (event) => {
    setStrokeWidth(parseInt(event.target.value, 10));
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

      {isDrawer && (
        <div style={{ marginBottom: 15, display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginRight: 15 }}>
            {COLORS.map((color) => (
              <div
                key={color}
                style={{
                  display: 'inline-block',
                  width: 24,
                  height: 24,
                  backgroundColor: color,
                  borderRadius: 4,
                  marginRight: 8,
                  cursor: 'pointer',
                  border: selectedColor === color && !isErasing ? '2px solid #000' : 'none',
                }}
                onClick={() => handleColorChange(color)}
              />
            ))}
            <button
              style={{
                padding: '6px 10px',
                borderRadius: 4,
                cursor: 'pointer',
                marginLeft: 10,
                backgroundColor: isErasing ? '#e6b7b726' : '#e0e0e0', // Indică vizual când radiera e activă
                border: isErasing ? '2px solid #000' : 'none',
                display: 'flex',
                alignItems: 'center',
              }}
              onClick={handleEraserClick}
            >
              <img src={eraserIcon} alt="Radieră" style={{ width: 20, height: 20, marginRight: 5 }} />
        
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <label htmlFor="strokeWidth" style={{ marginRight: 8 }}>Grosime:</label>
            <input
              type="number"
              id="strokeWidth"
              value={strokeWidth}
              min="1"
              max="20"
              onChange={handleStrokeWidthChange}
              style={{ width: 50, borderRadius: 4, border: '1px solid #ccc', padding: '4px' }}
            />
          </div>
        </div>
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
                stroke={line.color}
                strokeWidth={line.strokeWidth} // Folosim grosimea stocată în starea liniei
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
          Șterge desenul complet
        </button>
      )}
    </div>
  );
}
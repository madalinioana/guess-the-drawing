import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import eraserIcon from './eraser_PNG52.png';
import './DrawingBoard.css';

const COLORS = ['#000', '#f44336', '#4caf50', '#2196f3', '#ff9800', '#9c27b0'];
const ERASER_COLOR = 'white';

export default function DrawingBoard({ socket, isDrawer, currentWord, wordHint, phase }) {
  const [lines, setLines] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [wordInput, setWordInput] = useState("");
  const containerRef = useRef(null);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [isErasing, setIsErasing] = useState(false);
  const [strokeWidth, setStrokeWidth] = useState(5);

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
    if (!isDrawer || phase !== 'drawing') return;
    const pos = e.target.getStage().getPointerPosition();
    const color = isErasing ? ERASER_COLOR : selectedColor;
    setLines([...lines, { points: [pos.x, pos.y], color, strokeWidth }]);
    setIsDrawing(true);
  };

  const handleMouseMove = e => {
    if (!isDrawer || !isDrawing || phase !== 'drawing') return;
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    const lastLine = lines[lines.length - 1];
    lastLine.points = lastLine.points.concat([pos.x, pos.y]);
    setLines([...lines.slice(0, -1), lastLine]);
    socket.emit('send-drawing', lines);
  };

  const clearCanvas = () => {
    if (!isDrawer || phase !== 'drawing') return;
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

  const handleStrokeWidthChange = (e) => {
    setStrokeWidth(parseInt(e.target.value, 10));
  };

  const submitWord = () => {
    const trimmed = wordInput.trim().toLowerCase();
    if (!trimmed) return;
    socket.emit('select-word', trimmed);
    setWordInput("");
  };

  return (
    <div className="drawing-board">
      {isDrawer && phase === 'select-word' && (
        <div className="select-word">
          <p className="bold-text">Choose a word to draw:</p>
          <div className="input-group">
            <input 
              value={wordInput}
              onChange={e => setWordInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && submitWord()}
              placeholder="Type a word..."
              className="word-input"
            />
            <button onClick={submitWord} className="btn btn-primary">Select</button>
          </div>
        </div>
      )}

      {isDrawer && phase === 'drawing' && (
        <p className="bold-text draw-instruction">
          Draw: <span className="highlight-word">{currentWord}</span>
        </p>
      )}
      {!isDrawer && phase === 'drawing' && (
        <p className="bold-text draw-instruction">
          Guess the word: <span className="highlight-word word-hint">{wordHint || "_ _ _"}</span>
          <span className="word-length">({wordHint ? wordHint.length : "?"} letters)</span>
        </p>
      )}

      {isDrawer && (
        <div className="tools-bar">
          <div className="colors-container">
            {COLORS.map(color => (
              <div
                key={color}
                className={`color-swatch ${selectedColor === color && !isErasing ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => handleColorChange(color)}
              />
            ))}
            <button
              className={`eraser-btn ${isErasing ? 'active' : ''}`}
              onClick={handleEraserClick}
              title="Eraser"
            >
              <img src={eraserIcon} alt="Eraser" className="eraser-icon" />
            </button>
          </div>

          <div className="stroke-width-control">
            <label htmlFor="strokeWidth">Thickness:</label>
            <input
              type="number"
              id="strokeWidth"
              value={strokeWidth}
              min="1"
              max="20"
              onChange={handleStrokeWidthChange}
              className="stroke-input"
            />
          </div>
        </div>
      )}

      <div ref={containerRef} className="canvas-container">
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
                stroke={line.color}
                strokeWidth={line.strokeWidth}
                lineCap="round"
                lineJoin="round"
              />
            ))}
          </Layer>
        </Stage>
      </div>

      {isDrawer && phase === 'drawing' && (
        <button onClick={clearCanvas} className="btn btn-danger clear-btn">
          Clear entire drawing
        </button>
      )}
    </div>
  );
}

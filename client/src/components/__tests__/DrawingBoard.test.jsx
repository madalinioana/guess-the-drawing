import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock react-konva components
jest.mock("react-konva", () => ({
  Stage: ({ children, onMouseDown, onMouseMove, style }) => (
    <div
      data-testid="konva-stage"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      style={style}
    >
      {children}
    </div>
  ),
  Layer: ({ children }) => <div data-testid="konva-layer">{children}</div>,
  Line: ({ points, stroke, strokeWidth }) => (
    <div
      data-testid="konva-line"
      data-points={JSON.stringify(points)}
      data-stroke={stroke}
      data-stroke-width={strokeWidth}
    />
  ),
}));

// Mock the eraser icon import
jest.mock("../eraser_PNG52.png", () => "eraser-icon.png");

import DrawingBoard from "../DrawingBoard";

describe("DrawingBoard Component", () => {
  let mockSocket;

  beforeEach(() => {
    mockSocket = {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Phase: select-word", () => {
    test("shows word input when drawer is in select-word phase", () => {
      render(
        <DrawingBoard
          socket={mockSocket}
          isDrawer={true}
          currentWord=""
          wordHint=""
          phase="select-word"
        />
      );

      expect(screen.getByText("Choose a word to draw:")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Type a word...")).toBeInTheDocument();
      expect(screen.getByText("Select")).toBeInTheDocument();
    });

    test("does not show word input for non-drawer", () => {
      render(
        <DrawingBoard
          socket={mockSocket}
          isDrawer={false}
          currentWord=""
          wordHint=""
          phase="select-word"
        />
      );

      expect(screen.queryByText("Choose a word to draw:")).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText("Type a word...")).not.toBeInTheDocument();
    });

    test("emits select-word event when word is submitted", () => {
      render(
        <DrawingBoard
          socket={mockSocket}
          isDrawer={true}
          currentWord=""
          wordHint=""
          phase="select-word"
        />
      );

      const input = screen.getByPlaceholderText("Type a word...");
      const selectBtn = screen.getByText("Select");

      fireEvent.change(input, { target: { value: "casa" } });
      fireEvent.click(selectBtn);

      expect(mockSocket.emit).toHaveBeenCalledWith("select-word", "casa");
    });

    test("submits word on Enter key press", () => {
      render(
        <DrawingBoard
          socket={mockSocket}
          isDrawer={true}
          currentWord=""
          wordHint=""
          phase="select-word"
        />
      );

      const input = screen.getByPlaceholderText("Type a word...");

      fireEvent.change(input, { target: { value: "test" } });
      fireEvent.keyPress(input, { key: "Enter", code: "Enter", charCode: 13 });

      expect(mockSocket.emit).toHaveBeenCalledWith("select-word", "test");
    });

    test("does not submit empty word", () => {
      render(
        <DrawingBoard
          socket={mockSocket}
          isDrawer={true}
          currentWord=""
          wordHint=""
          phase="select-word"
        />
      );

      const selectBtn = screen.getByText("Select");
      fireEvent.click(selectBtn);

      expect(mockSocket.emit).not.toHaveBeenCalled();
    });

    test("trims and lowercases word before submission", () => {
      render(
        <DrawingBoard
          socket={mockSocket}
          isDrawer={true}
          currentWord=""
          wordHint=""
          phase="select-word"
        />
      );

      const input = screen.getByPlaceholderText("Type a word...");
      fireEvent.change(input, { target: { value: "  HELLO  " } });
      fireEvent.click(screen.getByText("Select"));

      expect(mockSocket.emit).toHaveBeenCalledWith("select-word", "hello");
    });
  });

  describe("Phase: drawing", () => {
    test("shows current word for drawer", () => {
      render(
        <DrawingBoard
          socket={mockSocket}
          isDrawer={true}
          currentWord="casa"
          wordHint=""
          phase="drawing"
        />
      );

      expect(screen.getByText("Draw:")).toBeInTheDocument();
      expect(screen.getByText("casa")).toBeInTheDocument();
    });

    test("shows word hint for non-drawer", () => {
      render(
        <DrawingBoard
          socket={mockSocket}
          isDrawer={false}
          currentWord=""
          wordHint="____"
          phase="drawing"
        />
      );

      expect(screen.getByText("Guess the word:")).toBeInTheDocument();
      expect(screen.getByText("____")).toBeInTheDocument();
      expect(screen.getByText("(4 letters)")).toBeInTheDocument();
    });

    test("shows tools bar for drawer", () => {
      render(
        <DrawingBoard
          socket={mockSocket}
          isDrawer={true}
          currentWord="casa"
          wordHint=""
          phase="drawing"
        />
      );

      // Check for color swatches
      expect(screen.getByTitle("Eraser")).toBeInTheDocument();
      expect(screen.getByLabelText("Thickness:")).toBeInTheDocument();
    });

    test("does not show tools bar for non-drawer", () => {
      render(
        <DrawingBoard
          socket={mockSocket}
          isDrawer={false}
          currentWord=""
          wordHint="____"
          phase="drawing"
        />
      );

      expect(screen.queryByTitle("Eraser")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Thickness:")).not.toBeInTheDocument();
    });

    test("shows clear button for drawer", () => {
      render(
        <DrawingBoard
          socket={mockSocket}
          isDrawer={true}
          currentWord="casa"
          wordHint=""
          phase="drawing"
        />
      );

      expect(screen.getByText("Clear entire drawing")).toBeInTheDocument();
    });

    test("clear button emits clear-board event", () => {
      render(
        <DrawingBoard
          socket={mockSocket}
          isDrawer={true}
          currentWord="casa"
          wordHint=""
          phase="drawing"
        />
      );

      const clearBtn = screen.getByText("Clear entire drawing");
      fireEvent.click(clearBtn);

      expect(mockSocket.emit).toHaveBeenCalledWith("clear-board");
    });
  });

  describe("Socket events", () => {
    test("registers socket listeners for non-drawer", () => {
      render(
        <DrawingBoard
          socket={mockSocket}
          isDrawer={false}
          currentWord=""
          wordHint=""
          phase="drawing"
        />
      );

      expect(mockSocket.on).toHaveBeenCalledWith("receive-drawing", expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith("clear-board", expect.any(Function));
    });

    test("does not register drawing listeners for drawer", () => {
      render(
        <DrawingBoard
          socket={mockSocket}
          isDrawer={true}
          currentWord="casa"
          wordHint=""
          phase="drawing"
        />
      );

      // Only the window event listeners should be set up, not socket listeners
      const receiveCalls = mockSocket.on.mock.calls.filter(
        (call) => call[0] === "receive-drawing"
      );
      expect(receiveCalls).toHaveLength(0);
    });

    test("cleans up socket listeners on unmount", () => {
      const { unmount } = render(
        <DrawingBoard
          socket={mockSocket}
          isDrawer={false}
          currentWord=""
          wordHint=""
          phase="drawing"
        />
      );

      unmount();

      expect(mockSocket.off).toHaveBeenCalledWith("receive-drawing");
      expect(mockSocket.off).toHaveBeenCalledWith("clear-board");
    });
  });

  describe("Stroke width control", () => {
    test("allows changing stroke width", () => {
      render(
        <DrawingBoard
          socket={mockSocket}
          isDrawer={true}
          currentWord="casa"
          wordHint=""
          phase="drawing"
        />
      );

      const strokeInput = screen.getByLabelText("Thickness:");
      expect(strokeInput).toHaveValue(5); // Default value

      fireEvent.change(strokeInput, { target: { value: "10" } });
      expect(strokeInput).toHaveValue(10);
    });
  });

  describe("Canvas rendering", () => {
    test("renders konva stage", () => {
      render(
        <DrawingBoard
          socket={mockSocket}
          isDrawer={true}
          currentWord="casa"
          wordHint=""
          phase="drawing"
        />
      );

      expect(screen.getByTestId("konva-stage")).toBeInTheDocument();
      expect(screen.getByTestId("konva-layer")).toBeInTheDocument();
    });

    test("shows crosshair cursor for drawer in drawing phase", () => {
      render(
        <DrawingBoard
          socket={mockSocket}
          isDrawer={true}
          currentWord="casa"
          wordHint=""
          phase="drawing"
        />
      );

      const stage = screen.getByTestId("konva-stage");
      expect(stage).toHaveStyle({ cursor: "crosshair" });
    });

    test("shows default cursor for non-drawer", () => {
      render(
        <DrawingBoard
          socket={mockSocket}
          isDrawer={false}
          currentWord=""
          wordHint="____"
          phase="drawing"
        />
      );

      const stage = screen.getByTestId("konva-stage");
      expect(stage).toHaveStyle({ cursor: "default" });
    });
  });
});

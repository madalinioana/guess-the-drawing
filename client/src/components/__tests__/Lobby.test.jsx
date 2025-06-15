import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Lobby from "../Lobby";

describe("Lobby component", () => {
  let mockSetUsername, mockSetInputRoomId, mockCreate, mockJoin;

  beforeEach(() => {
    mockSetUsername = jest.fn();
    mockSetInputRoomId = jest.fn();
    mockCreate = jest.fn();
    mockJoin = jest.fn();

    render(
      <Lobby
        username=""
        setUsername={mockSetUsername}
        inputRoomId=""
        setInputRoomId={mockSetInputRoomId}
        onCreateRoom={mockCreate}
        onJoinRoom={mockJoin}
      />
    );
  });

  test("renders both input fields and buttons", () => {
    expect(screen.getByPlaceholderText("Username")).toBeInTheDocument();
    expect(screen.getByText("Create Room")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Room ID")).toBeInTheDocument();
    expect(screen.getByText("Join")).toBeInTheDocument();
  });

  test("calls setUsername when typing into the Username input", () => {
    const usernameInput = screen.getByPlaceholderText("Username");
    fireEvent.change(usernameInput, { target: { value: "Bogdan" } });
    expect(mockSetUsername).toHaveBeenCalledWith("Bogdan");
  });

  test("calls onCreateRoom when the Create Room button is clicked", () => {
    const btnCreate = screen.getByText("Create Room");
    fireEvent.click(btnCreate);
    expect(mockCreate).toHaveBeenCalled();
  });

  test("calls onJoinRoom when the Join button is clicked", () => {
    // First, fill in the Room ID input so that onJoinRoom can be triggered
    const roomIdInput = screen.getByPlaceholderText("Room ID");
    fireEvent.change(roomIdInput, { target: { value: "9999" } });

    const btnJoin = screen.getByText("Join");
    fireEvent.click(btnJoin);
    expect(mockJoin).toHaveBeenCalled();
  });
});

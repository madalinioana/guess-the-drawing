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

  test("afișează inputurile și butoanele", () => {
    // Placeholder‐urile reale din componentă sunt "Username" și "Room ID"
    expect(screen.getByPlaceholderText("Username")).toBeInTheDocument();
    expect(screen.getByText("Create room")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Room ID")).toBeInTheDocument();
    expect(screen.getByText("Join")).toBeInTheDocument();
  });

  test("apelează setUsername la scriere în input", () => {
    const input = screen.getByPlaceholderText("Username");
    fireEvent.change(input, { target: { value: "Bogdan" } });
    expect(mockSetUsername).toHaveBeenCalledWith("Bogdan");
  });

  test("apelează onCreateRoom la click pe butonul Create room", () => {
    // Mergem pe butonul cu textul exact din componentă
    const btnCreate = screen.getByText("Create room");
    fireEvent.click(btnCreate);
    expect(mockCreate).toHaveBeenCalled();
  });

  test("apelează onJoinRoom la click pe butonul Join", () => {
    const inputRoom = screen.getByPlaceholderText("Room ID");
    fireEvent.change(inputRoom, { target: { value: "9999" } });
    const btnJoin = screen.getByText("Join");
    fireEvent.click(btnJoin);
    expect(mockJoin).toHaveBeenCalled();
  });
});

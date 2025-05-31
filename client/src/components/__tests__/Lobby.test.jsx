import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Lobby from "../Lobby";

describe("Lobby component", () => {
  test("afișează inputurile și butoanele", () => {
    render(
      <Lobby
        username=""
        setUsername={() => {}}
        inputRoomId=""
        setInputRoomId={() => {}}
        onCreateRoom={() => {}}
        onJoinRoom={() => {}}
      />
    );

    expect(screen.getByPlaceholderText("Nume de utilizator")).toBeInTheDocument();
    expect(screen.getByText("Creează cameră")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("ID Cameră")).toBeInTheDocument();
    expect(screen.getByText("Alătură-te")).toBeInTheDocument();
  });

  test("apelează setUsername la scriere în input", () => {
    const mockSetUsername = jest.fn();

    render(
      <Lobby
        username=""
        setUsername={mockSetUsername}
        inputRoomId=""
        setInputRoomId={() => {}}
        onCreateRoom={() => {}}
        onJoinRoom={() => {}}
      />
    );

    const input = screen.getByPlaceholderText("Nume de utilizator");
    fireEvent.change(input, { target: { value: "Bogdan" } });

    expect(mockSetUsername).toHaveBeenCalledWith("Bogdan");
  });

  test("apelează onCreateRoom la click pe buton", () => {
    const mockCreate = jest.fn();

    render(
      <Lobby
        username="Test"
        setUsername={() => {}}
        inputRoomId=""
        setInputRoomId={() => {}}
        onCreateRoom={mockCreate}
        onJoinRoom={() => {}}
      />
    );

    const btn = screen.getByText("Creează cameră");
    fireEvent.click(btn);

    expect(mockCreate).toHaveBeenCalled();
  });

  test("apelează onJoinRoom la click pe buton", () => {
    const mockJoin = jest.fn();

    render(
      <Lobby
        username="Test"
        setUsername={() => {}}
        inputRoomId="9999"
        setInputRoomId={() => {}}
        onCreateRoom={() => {}}
        onJoinRoom={mockJoin}
      />
    );

    fireEvent.click(screen.getByText("Alătură-te"));
    expect(mockJoin).toHaveBeenCalled();
  });
});

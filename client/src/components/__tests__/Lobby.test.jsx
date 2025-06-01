import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Lobby from "../Lobby";

describe("Lobby component", () => {
  test("displays inputs and buttons", () => {
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

    expect(screen.getByPlaceholderText("Username")).toBeInTheDocument();
    expect(screen.getByText("Create Room")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Room ID")).toBeInTheDocument();
    expect(screen.getByText("Join")).toBeInTheDocument();
  });

  test("calls setUsername when typing in input", () => {
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

    const input = screen.getByPlaceholderText("Username");
    fireEvent.change(input, { target: { value: "Bogdan" } });

    expect(mockSetUsername).toHaveBeenCalledWith("Bogdan");
  });

  test("calls onCreateRoom when clicking button", () => {
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

    const btn = screen.getByText("Create Room");
    fireEvent.click(btn);

    expect(mockCreate).toHaveBeenCalled();
  });

  test("calls onJoinRoom when clicking button", () => {
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

    fireEvent.click(screen.getByText("Join"));
    expect(mockJoin).toHaveBeenCalled();
  });
});

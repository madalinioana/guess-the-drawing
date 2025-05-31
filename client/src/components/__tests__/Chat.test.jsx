import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Chat from "../Chat";

describe("Chat component", () => {
  const mockMessages = [
    { username: "Ana", message: "Salut!" },
    { username: "George", message: "Ce faci?" }
  ];

  test("afișează toate mesajele primite", () => {
    render(<Chat messages={mockMessages} onSendMessage={() => {}} isDrawer={false} />);

    expect(screen.getByText("Ana:")).toBeInTheDocument();
    expect(screen.getByText("Salut!")).toBeInTheDocument();
    expect(screen.getByText("George:")).toBeInTheDocument();
    expect(screen.getByText("Ce faci?")).toBeInTheDocument();
  });

  test("permite scrierea și trimiterea unui mesaj", () => {
    const mockSend = jest.fn();

    render(<Chat messages={[]} onSendMessage={mockSend} isDrawer={false} />);

    const input = screen.getByPlaceholderText("Scrie un mesaj.");
    fireEvent.change(input, { target: { value: "Hello!" } });

    const button = screen.getByText("Trimite");
    fireEvent.click(button);

    expect(mockSend).toHaveBeenCalledWith("Hello!");
  });

  test("resetează inputul după trimitere", () => {
    const mockSend = jest.fn();

    render(<Chat messages={[]} onSendMessage={mockSend} isDrawer={false} />);

    const input = screen.getByPlaceholderText("Scrie un mesaj.");
    fireEvent.change(input, { target: { value: "Test message" } });
    fireEvent.click(screen.getByText("Trimite"));

    expect(input.value).toBe(""); // input gol după trimitere
  });

  test("nu trimite mesaj gol", () => {
    const mockSend = jest.fn();

    render(<Chat messages={[]} onSendMessage={mockSend} isDrawer={false} />);
    fireEvent.click(screen.getByText("Trimite"));

    expect(mockSend).not.toHaveBeenCalled();
  });

  test("nu afișează inputul dacă ești drawer", () => {
    render(<Chat messages={[]} onSendMessage={() => {}} isDrawer={true} />);

    expect(screen.queryByPlaceholderText("Scrie un mesaj.")).not.toBeInTheDocument();
    expect(screen.getByText(/Nu poți ghici/)).toBeInTheDocument();
  });

  test("trimite mesaj cu Enter", () => {
    const mockSend = jest.fn();

    render(<Chat messages={[]} onSendMessage={mockSend} isDrawer={false} />);

    const input = screen.getByPlaceholderText("Scrie un mesaj.");
    fireEvent.change(input, { target: { value: "Enter test" } });
    fireEvent.keyPress(input, { key: "Enter", code: "Enter", charCode: 13 });

    expect(mockSend).toHaveBeenCalledWith("Enter test");
  });
});

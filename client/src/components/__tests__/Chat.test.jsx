import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Chat from "../Chat";

describe("Chat component", () => {
  const mockMessages = [
    { username: "Ana", message: "Salut!" },
    { username: "George", message: "Ce faci?" }
  ];

  test("displays all received messages", () => {
    render(<Chat messages={mockMessages} onSendMessage={() => {}} isDrawer={false} />);

    expect(screen.getByText("Ana:")).toBeInTheDocument();
    expect(screen.getByText("Salut!")).toBeInTheDocument();
    expect(screen.getByText("George:")).toBeInTheDocument();
    expect(screen.getByText("Ce faci?")).toBeInTheDocument();
  });

  test("allows typing and sending a message", () => {
    const mockSend = jest.fn();

    render(<Chat messages={[]} onSendMessage={mockSend} isDrawer={false} />);

    const input = screen.getByPlaceholderText("Type a message...");
    fireEvent.change(input, { target: { value: "Hello!" } });

    const button = screen.getByText("Send");
    fireEvent.click(button);

    expect(mockSend).toHaveBeenCalledWith("Hello!");
  });

  test("clears input after sending", () => {
    const mockSend = jest.fn();

    render(<Chat messages={[]} onSendMessage={mockSend} isDrawer={false} />);

    const input = screen.getByPlaceholderText("Type a message...");
    fireEvent.change(input, { target: { value: "Test message" } });
    fireEvent.click(screen.getByText("Send"));

    expect(input.value).toBe("");
  });

  test("does not send empty message", () => {
    const mockSend = jest.fn();

    render(<Chat messages={[]} onSendMessage={mockSend} isDrawer={false} />);
    fireEvent.click(screen.getByText("Send"));

    expect(mockSend).not.toHaveBeenCalled();
  });

  test("does not display input if you are drawer", () => {
    render(<Chat messages={[]} onSendMessage={() => {}} isDrawer={true} />);

    expect(screen.queryByPlaceholderText("Type a message...")).not.toBeInTheDocument();
    expect(screen.getByText(/You can't guess while drawing/)).toBeInTheDocument();
  });

  test("sends message with Enter key", () => {
    const mockSend = jest.fn();

    render(<Chat messages={[]} onSendMessage={mockSend} isDrawer={false} />);

    const input = screen.getByPlaceholderText("Type a message...");
    fireEvent.change(input, { target: { value: "Enter test" } });
    fireEvent.keyPress(input, { key: "Enter", code: "Enter", charCode: 13 });

    expect(mockSend).toHaveBeenCalledWith("Enter test");
  });
});

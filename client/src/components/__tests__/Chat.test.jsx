import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Chat from "../Chat";

describe("Chat component", () => {
  // mock messages used for testing display
  const mockMessages = [
    { username: "Ana", message: "Salut!" },
    { username: "George", message: "Ce faci?" }
  ];

  test("displays all received messages", () => {
    // render component with mock messages
    render(<Chat messages={mockMessages} onSendMessage={() => {}} isDrawer={false} />);

    // check if messages are displayed
    expect(screen.getByText("Ana:")).toBeInTheDocument();
    expect(screen.getByText("Salut!")).toBeInTheDocument();
    expect(screen.getByText("George:")).toBeInTheDocument();
    expect(screen.getByText("Ce faci?")).toBeInTheDocument();
  });

  test("allows typing and sending a message", () => {
    const mockSend = jest.fn();

    // render component with empty messages
    render(<Chat messages={[]} onSendMessage={mockSend} isDrawer={false} />);

    // type message and click send
    const input = screen.getByPlaceholderText("Type a message...");
    fireEvent.change(input, { target: { value: "Hello!" } });

    const button = screen.getByText("Send");
    fireEvent.click(button);

    // check if send callback was called
    expect(mockSend).toHaveBeenCalledWith("Hello!");
  });

  test("clears input after sending", () => {
    const mockSend = jest.fn();

    render(<Chat messages={[]} onSendMessage={mockSend} isDrawer={false} />);

    const input = screen.getByPlaceholderText("Type a message...");
    fireEvent.change(input, { target: { value: "Test message" } });
    fireEvent.click(screen.getByText("Send"));

    // input should be empty after sending
    expect(input.value).toBe("");
  });

  test("does not send empty message", () => {
    const mockSend = jest.fn();

    render(<Chat messages={[]} onSendMessage={mockSend} isDrawer={false} />);
    fireEvent.click(screen.getByText("Send"));

    // send should not be called for empty message
    expect(mockSend).not.toHaveBeenCalled();
  });

  test("does not display input if you are drawer", () => {
    // input should be hidden for drawer
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

    // check if message is sent on Enter key
    expect(mockSend).toHaveBeenCalledWith("Enter test");
  });
});

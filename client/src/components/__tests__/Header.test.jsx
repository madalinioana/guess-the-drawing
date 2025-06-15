import React from "react";
import { render, screen } from "@testing-library/react";
import Header from "../Header";

describe("Header component", () => {
  test("displays the room ID", () => {
    // render header with a sample room ID
    render(
      <Header
        roomId="1234"
        isCreator={false}
        users={[]}
        game={{ phase: "waiting", timeLeft: 30 }}
        onStartGame={() => {}}
      />
    );
    // check that room ID is shown
    expect(screen.getByText(/Room: 1234/)).toBeInTheDocument();
  });

  test("displays player names", () => {
    // provide users and check if names are displayed
    const users = [{ id: "1", name: "Ana" }, { id: "2", name: "George" }];
    render(
      <Header
        roomId="4321"
        isCreator={false}
        users={users}
        game={{ phase: "waiting", timeLeft: 30 }}
        onStartGame={() => {}}
      />
    );
    expect(screen.getByText(/Ana, George/)).toBeInTheDocument();
  });

  test("shows 'Creator' badge if user is creator", () => {
    // render with isCreator = true
    render(
      <Header
        roomId="9999"
        isCreator={true}
        users={[]}
        game={{ phase: "drawing", timeLeft: 10 }}
        onStartGame={() => {}}
      />
    );
    // check for 'Creator' label
    expect(screen.getByText(/Creator/)).toBeInTheDocument();
  });

  test("shows 'Start Game' button only in waiting phase and if user is creator", () => {
    // should show button because user is creator and phase is waiting
    render(
      <Header
        roomId="7777"
        isCreator={true}
        users={[]}
        game={{ phase: "waiting", timeLeft: 60 }}
        onStartGame={() => {}}
      />
    );
    expect(screen.getByText("Start Game")).toBeInTheDocument();
  });

  test("does not show 'Start Game' button if user is not creator", () => {
    // should not show button because user is not creator
    render(
      <Header
        roomId="7777"
        isCreator={false}
        users={[]}
        game={{ phase: "waiting", timeLeft: 60 }}
        onStartGame={() => {}}
      />
    );
    const btn = screen.queryByText("Start Game");
    expect(btn).not.toBeInTheDocument();
  });
});

import React from "react";
import { render, screen } from "@testing-library/react";
import Header from "../Header";

describe("Header component", () => {
  test("afișează ID-ul camerei", () => {
    render(
      <Header
        roomId="1234"
        isCreator={false}
        users={[]}
        game={{ phase: "waiting", timeLeft: 30 }}
        onStartGame={() => {}}
      />
    );
    expect(screen.getByText(/Camera: 1234/)).toBeInTheDocument();
  });

  test("afișează numele jucătorilor", () => {
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

  test("afișează badge-ul 'Creator' dacă ești creator", () => {
    render(
      <Header
        roomId="9999"
        isCreator={true}
        users={[]}
        game={{ phase: "drawing", timeLeft: 10 }}
        onStartGame={() => {}}
      />
    );
    expect(screen.getByText(/Creator/)).toBeInTheDocument();
  });

  test("afișează butonul Start doar în faza de așteptare și dacă ești creator", () => {
    render(
      <Header
        roomId="7777"
        isCreator={true}
        users={[]}
        game={{ phase: "waiting", timeLeft: 60 }}
        onStartGame={() => {}}
      />
    );
    expect(screen.getByText("Start Joc")).toBeInTheDocument();
  });

  test("nu afișează butonul Start dacă NU ești creator", () => {
    render(
      <Header
        roomId="7777"
        isCreator={false}
        users={[]}
        game={{ phase: "waiting", timeLeft: 60 }}
        onStartGame={() => {}}
      />
    );
    const btn = screen.queryByText("Start Joc");
    expect(btn).not.toBeInTheDocument();
  });
});

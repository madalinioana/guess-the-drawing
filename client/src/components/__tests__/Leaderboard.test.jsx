import React from "react";
import { render, screen } from "@testing-library/react";
import Leaderboard from "../Leaderboard";

describe("Leaderboard component", () => {
  test("afișează titlul Clasament", () => {
    render(<Leaderboard scores={[]} />);
    expect(screen.getByText("🏆 Clasament")).toBeInTheDocument();
  });

  test("afișează scorurile în ordine descrescătoare", () => {
    const scores = [
      ["Ana", 5],
      ["Bogdan", 10],
      ["Maria", 8]
    ];

    render(<Leaderboard scores={scores} />);

    const items = screen.getAllByRole("listitem");

    expect(items[0]).toHaveTextContent("1. Bogdan: 10 puncte");
    expect(items[1]).toHaveTextContent("2. Maria: 8 puncte");
    expect(items[2]).toHaveTextContent("3. Ana: 5 puncte");
  });

  test("afișează 'nume: scor' corect pentru fiecare", () => {
    const scores = [["TestUser", 99]];
    render(<Leaderboard scores={scores} />);
    expect(screen.getByText("1. TestUser: 99 puncte")).toBeInTheDocument();
  });
});

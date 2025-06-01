import React from "react";
import { render, screen } from "@testing-library/react";
import Leaderboard from "../Leaderboard";

describe("Leaderboard component", () => {
  test("displays the title Leaderboard", () => {
    render(<Leaderboard scores={[]} />);
    expect(screen.getByText("🏆 Leaderboard")).toBeInTheDocument();
  });

  test("displays scores in descending order", () => {
    const scores = [
      ["Ana", 5],
      ["Bogdan", 10],
      ["Maria", 8]
    ];
    render(<Leaderboard scores={scores} />);
    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("1. Bogdan: 10 pts");
    expect(items[1]).toHaveTextContent("2. Maria: 8 pts");
    expect(items[2]).toHaveTextContent("3. Ana: 5 pts");
  });

  test("displays 'name: score' correctly for each", () => {
    const scores = [["TestUser", 99]];
    render(<Leaderboard scores={scores} />);
    expect(screen.getByText("1. TestUser: 99 pts")).toBeInTheDocument();
  });
});

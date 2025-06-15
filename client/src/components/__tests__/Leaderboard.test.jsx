import React from "react";
import { render, screen } from "@testing-library/react";
import Leaderboard from "../Leaderboard";

describe("Leaderboard component", () => {
  test("displays scores in descending order with 'pts'", () => {
    const scores = [
      ["Bogdan", 10],
      ["Maria", 8],
      ["Ana", 5],
    ];
    render(<Leaderboard scores={scores} />);
    const items = screen.getAllByRole("listitem");
    
    // Check that the text is exactly "1. Bogdan: 10 pts", "2. Maria: 8 pts", "3. Ana: 5 pts"
    expect(items[0]).toHaveTextContent("1. Bogdan: 10 pts");
    expect(items[1]).toHaveTextContent("2. Maria: 8 pts");
    expect(items[2]).toHaveTextContent("3. Ana: 5 pts");
  });

  test("displays a single score correctly", () => {
    const scores = [["TestUser", 99]];
    render(<Leaderboard scores={scores} />);
    
    // Verify that there is an <li> containing "1. TestUser: 99 pts"
    expect(screen.getByText("1. TestUser: 99 pts")).toBeInTheDocument();
  });
});

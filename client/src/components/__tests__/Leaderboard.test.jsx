import React from "react";
import { render, screen } from "@testing-library/react";
import Leaderboard from "../Leaderboard";

describe("Leaderboard component", () => {
  const mockUsers = [
    { name: "Bogdan", avatar: "😀" },
    { name: "Maria", avatar: "🎨" },
    { name: "Ana", avatar: "🌟" }
  ];

  test("displays scores in descending order with 'pts'", () => {
    const scores = [
      ["Bogdan", 10],
      ["Maria", 8],
      ["Ana", 5],
    ];
    render(<Leaderboard scores={scores} users={mockUsers} />);
    const items = screen.getAllByRole("listitem");

    // Check ranking order (sorted by score descending)
    expect(items[0]).toHaveTextContent("1.");
    expect(items[0]).toHaveTextContent("Bogdan");
    expect(items[0]).toHaveTextContent("10 pts");

    expect(items[1]).toHaveTextContent("2.");
    expect(items[1]).toHaveTextContent("Maria");
    expect(items[1]).toHaveTextContent("8 pts");

    expect(items[2]).toHaveTextContent("3.");
    expect(items[2]).toHaveTextContent("Ana");
    expect(items[2]).toHaveTextContent("5 pts");
  });

  test("displays a single score correctly", () => {
    const scores = [["TestUser", 99]];
    render(<Leaderboard scores={scores} users={[]} />);

    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("1.");
    expect(items[0]).toHaveTextContent("TestUser");
    expect(items[0]).toHaveTextContent("99 pts");
  });

  test("sorts scores in descending order", () => {
    const scores = [
      ["LowScorer", 5],
      ["HighScorer", 100],
      ["MidScorer", 50],
    ];
    render(<Leaderboard scores={scores} users={[]} />);
    const items = screen.getAllByRole("listitem");

    // Should be sorted: HighScorer (100), MidScorer (50), LowScorer (5)
    expect(items[0]).toHaveTextContent("HighScorer");
    expect(items[1]).toHaveTextContent("MidScorer");
    expect(items[2]).toHaveTextContent("LowScorer");
  });

  test("displays user avatars when available", () => {
    const scores = [["Bogdan", 10]];
    render(<Leaderboard scores={scores} users={mockUsers} />);

    // Check avatar is displayed
    expect(screen.getByText("😀")).toBeInTheDocument();
  });

  test("displays default avatar when user not found", () => {
    const scores = [["UnknownUser", 10]];
    render(<Leaderboard scores={scores} users={mockUsers} />);

    // Default avatar should be displayed
    expect(screen.getByText("👤")).toBeInTheDocument();
  });

  test("renders empty leaderboard when no scores", () => {
    render(<Leaderboard scores={[]} users={[]} />);

    // Should still render the title
    expect(screen.getByText(/Leaderboard/)).toBeInTheDocument();
    // But no list items
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });
});

// src/components/__tests__/Leaderboard.test.jsx

import React from "react";
import { render, screen } from "@testing-library/react";
import Leaderboard from "../Leaderboard";

describe("Leaderboard component", () => {
  test("afișează scorurile în ordine descrescătoare cu 'p'", () => {
    const scores = [
      ["Bogdan", 10],
      ["Maria", 8],
      ["Ana", 5],
    ];
    render(<Leaderboard scores={scores} />);
    const items = screen.getAllByRole("listitem");
    
    // Verificăm conținutul text simplificat: "1. Bogdan: 10p", "2. Maria: 8p", "3. Ana: 5p"
    expect(items[0]).toHaveTextContent("1. Bogdan: 10p");
    expect(items[1]).toHaveTextContent("2. Maria: 8p");
    expect(items[2]).toHaveTextContent("3. Ana: 5p");
  });

  test("afișează corect un singur scor", () => {
    const scores = [["TestUser", 99]];
    render(<Leaderboard scores={scores} />);
    
    // Verificăm că există un <li> care conține "1. TestUser: 99p"
    expect(screen.getByText("1. TestUser: 99p")).toBeInTheDocument();
  });
});

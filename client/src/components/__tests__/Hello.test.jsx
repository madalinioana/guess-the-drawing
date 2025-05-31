import React from "react";
import { render, screen } from "@testing-library/react";

// o componentă simplă
const Hello = ({ name }) => <h1>Hello, {name}!</h1>;

test("afișează un mesaj Hello", () => {
  render(<Hello name="Bogdan" />);
  expect(screen.getByText("Hello, Bogdan!")).toBeInTheDocument();
});

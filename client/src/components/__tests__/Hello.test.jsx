import React from "react";
import { render, screen } from "@testing-library/react";

const Hello = ({ name }) => <h1>Hello, {name}!</h1>;

test("displays a Hello message", () => {
  render(<Hello name="Bogdan" />);
  expect(screen.getByText("Hello, Bogdan!")).toBeInTheDocument();
});

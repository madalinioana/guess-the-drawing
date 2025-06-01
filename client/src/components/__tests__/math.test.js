function add(a, b) {
  return a + b;
}

test("sum", () => {
  expect(add(2, 3)).toBe(5);
});

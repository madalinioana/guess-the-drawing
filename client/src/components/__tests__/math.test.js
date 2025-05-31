function add(a, b) {
  return a + b;
}

test("adunare simplă", () => {
  expect(add(2, 3)).toBe(5);
});

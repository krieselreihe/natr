const { describe } = require("../src/runner");

describe("regular test cases", async assert => {
  const calc = (a = 0, b = 0) => a + b;

  assert({
    given: "the calc function without arguments",
    should: "return 0",
    actual: calc(),
    expected: 0
  });

  assert({
    given: "the calc function with one argument",
    should: "return the given number",
    actual: calc(42, 1),
    expected: 43
  });

  assert({
    given: "the calc function with two arguments",
    should: "return the correct sum",
    actual: calc(10, -5),
    expected: 5
  });
});

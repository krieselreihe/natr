const { describe, execute } = require("../runner");

describe("runner", async assert => {
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

  assert({
    given: "a function that will throw",
    should: "throw",
    actual: await execute(() => {
      throw new Error("Err!");
    }),
    expected: new Error("Err!")
  });

  assert({
    given: "a failed check execution",
    should: "throw",
    actual: await execute(check => {
      check(true, false);
    }),
    expected: new Error("check() in execute() didn't match: true with false")
  });
});

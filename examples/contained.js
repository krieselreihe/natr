const { describe, execute } = require("../src/runner");

describe("handle contained execution", async assert => {
  assert({
    given: "an expression",
    should: "throw",
    actual: execute(() => {
      throw new TypeError("Doh!");
    }),
    expected: new TypeError("Doh!")
  });

  assert({
    given: "an async function that throws",
    should: "await and return the value of the error",
    actual: await execute(async () => {
      throw new Error("Doh!");
    }),
    expected: new Error("Doh!")
  });

  assert({
    given: "some code to execute",
    should: "execute and return a value",
    actual: execute(() => {
      const hello = `Hello`;
      return `${hello}, World!`;
    }),
    expected: "Hello, World!"
  });
});

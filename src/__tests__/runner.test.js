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

  assert({
    given: "a promise",
    should: "resolve",
    actual: await execute(() => {
      return Promise.resolve(23);
    }),
    expected: 23
  });

  assert({
    given: "user object",
    should: "have the correct user id and structure",
    actual: await execute(check => {
      const user = { id: 1, name: "Helga" };

      check(user, { id: 1, name: "Helga" });

      return user.id;
    }),
    expected: 1
  });
});

describe("multiple describe in one file", async assert => {
  assert({
    given: "some string concatenation",
    should: "resolve to the string",
    actual: "Hello" + " " + "World",
    expected: "Hello World"
  });
});

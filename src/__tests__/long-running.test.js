const { describe, execute } = require("../runner");

describe("with long running unit tests", async (assert) => {
  assert({
    given: "first test for long running tests",
    should: "execute before 'a long running unit test'",
    actual: true,
    expected: true,
  });

  assert({
    given: "a long running unit test",
    should: "resolve in order to the other tests",
    actual: await execute(() => {
      return new Promise((resolve) => {
        setTimeout(() => resolve(true), 1000);
      });
    }),
    expected: true,
  });

  assert({
    given: "second test for long running tests",
    should: "execute after 'a long running unit test'",
    actual: true,
    expected: true,
  });
});

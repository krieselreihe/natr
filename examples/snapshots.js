const { describe, toMatchSnapshot } = require("../src/runner");

describe("snapshot matching", assert => {
  // @todo
  assert({
    given: "an object",
    should: "match snapshot",
    actual: undefined,
    expected: toMatchSnapshot()
  });
});

const React = require("react");
const renderer = require("react-test-renderer");

const { describe, toMatchSnapshot } = require("../runner");

describe("toMatchSnapshot", (assert) => {
  assert({
    given: "an object",
    should: "match a specific snapshot",
    actual: { id: 1, name: "Mary" },
    expected: toMatchSnapshot(),
  });

  assert({
    given: "a different object",
    should: "match a specific snapshot",
    actual: { id: 2, name: "Martin", active: true },
    expected: toMatchSnapshot(),
  });

  assert({
    given: "a React component",
    should: "match a specific snapshot",
    actual: renderer.create(<div>Hello World</div>).toJSON(),
    expected: toMatchSnapshot(),
  });
});

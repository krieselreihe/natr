const { describe } = require("../runner");
const { isInternal, cleanInternal, API_DESCRIPTION } = require("../messaging");

describe("messaging", (assert) => {
  assert({
    given: "an internal message",
    should: "detect this message as internal",
    actual: isInternal(API_DESCRIPTION),
    expected: true,
  });

  assert({
    given: "a cleaned internal message",
    should: "be without internal prefix information",
    actual: cleanInternal(API_DESCRIPTION),
    expected:
      '{\n      given: <string>,  // "a calculation"\n      should: <string>, // "return the result"\n      actual: <any>,    // 1 + 2\n      expected: <any>   // 3\n    }',
  });

  assert({
    given: "a non internal message that gets cleaned",
    should: "not be touched",
    actual: cleanInternal("Not internal"),
    expected: "Not internal",
  });
});

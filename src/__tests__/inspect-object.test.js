const { describe } = require("../runner");
const inspectObject = require("../inspect-object");

describe("inspect object", async assert => {
  assert({
    given: "an empty string",
    should: "return an empty inspect string",
    actual: inspectObject(""),
    expected: "''"
  });

  assert({
    given: "a flat object",
    should: "return an inspect string",
    actual: inspectObject({ a: 1, b: 2 }),
    expected: "{ a: 1, b: 2 }"
  });

  assert({
    given: "a nested object",
    should: "return an inspect string with a maximal depth",
    actual: inspectObject({ a: { b: { c: { d: { e: { f: { g: 42 } } } } } } }),
    expected: "{ a: { b: { c: { d: { e: { f: [Object] } } } } } }"
  });

  assert({
    given: "a nested, complex, object",
    should: "return a multiline inspect string",
    actual: inspectObject({
      id: 1,
      name: "Bob the Dummy Person",
      age: 42,
      address: "Somewhere, over the rainbow",
      walk() {
        return true;
      }
    }),
    expected:
      "{\n      id: 1,\n      name: 'Bob the Dummy Person',\n      age: 42,\n      address: 'Somewhere, over the rainbow',\n      walk: [Function: walk]\n    }"
  });
});

import React from "react";
import renderer from "react-test-renderer";

import { describe, execute, toMatchSnapshot } from "../runner";

describe("runner", async (assert) => {
  const calc = (a = 0, b = 0) => a + b;

  assert({
    given: "the calc function without arguments",
    should: "return 0",
    actual: calc(),
    expected: 0,
  });

  assert({
    given: "the calc function with one argument",
    should: "return the given number",
    actual: calc(42, 1),
    expected: 43,
  });

  assert({
    given: "the calc function with two arguments",
    should: "return the correct sum",
    actual: calc(10, -5),
    expected: 5,
  });

  assert({
    given: "a function that will throw",
    should: "throw",
    actual: execute(() => {
      throw new Error("Err!");
    }),
    expected: new Error("Err!"),
  });

  assert({
    given: "a promise",
    should: "resolve",
    actual: await execute(() => Promise.resolve(23)),
    expected: 23,
  });
});

describe("multiple describe in one file", (assert) => {
  assert({
    given: "some string concatenation",
    should: "resolve to the string",
    actual: "Hello" + " " + "World",
    expected: "Hello World",
  });
});

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

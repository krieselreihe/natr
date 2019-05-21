# natr

[![Build Status][bsurl]][bsimg]
[![Coverage Status][cvurl]][cvimg]
[![Commitizen friendly][cfimg]][cfurl]
[![code style: prettier][ptimg]][pturl]

**Not another test runner!** (natr) But it is, and it is a highly opinionated one that is used for own projects. But if you want to use it as well, you are very welcome to do and give feedback 😎

## Contents

- [Usage](#usage)
  - [Basic test](#basic-test)
  - [Encapsulate execution](#encapsulate-execution)
  - [Exceptions](#exceptions)
  - [React components](#react-components)
  - [Snapshot testing](#snapshot-testing)
- [API](#api)
  - [describe](#describe)
  - [describe.only](#describe-only)
  - [describe.skip](#describe-skip)
  - [assert](#assert)
  - [evaluate](#evaluate)
- [Disclaimer](#disclaimer)

## Usage

### Basic test

Unit tests are explicit, so there are no global variables injected, but you have to import `describe` from the test runner.

```javascript
import { describe } from "path/to/testRunner";

describe("my test suite", async assert => {
  assert({
    given: "a basic arithmetic expression",
    should: "calculate 2",
    actual: 1 + 1,
    expected: 2
  });
});
```

### Encapsulate execution

The `evaluate` helper gives you the chance to wrap an executions of multiple expressions, even if async.

```javascript
import { describe, evaluate } from "path/to/testRunner";

describe("my test suite", async assert => {
  assert({
    given: "a multiline expression",
    should: "evaluates to a value",
    actual: evaluate(() => {
      const sum = 1 + 2;
      return sum + 3;
    }),
    expected: 6
  });

  assert({
    given: "an async expression",
    should: "evaluates to a value",
    actual: await evaluate(async () => "hey"),
    expected: "hey"
  });
});
```

### Exceptions

To test if a function throws an error you can use the `evaluate` helper and pass a function to wrap your execution.

```javascript
import { describe, evaluate } from "path/to/testRunner";

describe("my test suite", async assert => {
  assert({
    given: "an expression that will throw",
    should: "throw an error",
    actual: evaluate(() => throw new Error("Doh!")),
    expected: new Error("Doh!")
  });
});
```

### React components

To render react component you can just use [react-test-renderer](https://reactjs.org/docs/test-renderer.html) and its API.

```jsx
import { describe } from "path/to/testRunner";
import render from "react-test-renderer";

const MyComponent = () => (
  <div>
    <SubComponent foo="bar" />
  </div>
);
const SubComponent = () => <p className="sub">Sub</p>;

describe("my test suite", async assert => {
  assert({
    given: "a react component",
    should: "be of a specific type",
    actual: render.create(<MyComponent />).findByType(SubComponent).type,
    expected: "SubComponent"
  });

  assert({
    given: "a react component",
    should: "have a specific prop",
    actual: render.create(<MyComponent />).findByType(SubComponent).props.foo,
    expected: "bar"
  });
});
```

### Snapshot testing

Snapshot testing is included and can be used to test React component as JSON tree or regular JavaScript objects as well. Therefore the "expected" helper function `toMatchSnapshot` is exposed, that will create a snapshot on first run and match against on further.

```javascript
import { describe, toMatchSnapshot } from "path/to/testRunner";
import render from "react-test-renderer";

const MyComponent = () => (
  <div>
    <SubComponent foo="bar" />
  </div>
);
const SubComponent = () => <p className="sub">Sub</p>;

describe("my test suite", async assert => {
  assert({
    given: "a react component",
    should: "match snapshot",
    actual: render.create(<MyComponent />).toJSON(),
    expected: toMatchSnapshot()
  });

  assert({
    given: "JavaScript object",
    should: "match snapshot",
    actual: { foo: 42 },
    expected: toMatchSnapshot()
  });
});
```

Snapshots will be saved next to the test file in a folder called `__snapshots__` as JavaScript files. To regenerate snapshots you can either delete the snapshot file or use the `--updateSnapshot / -u` flag provided by the runner CLI:

```shell
npm test -- -u
```

## API

Describes as TypeScript the API would like the following:

```typescript
interface Assert<TestType = any> {
  given: string;
  should: string;
  actual: TestType;
  expected: TestType;
}

type UnitTest = (assert: Assert) => void;

type TestSuite = (test: UnitTest) => Promise<void>;

interface Describe {
  (unit: string, fn: TestSuite): void;
  skip: (unit: string, fn: UnitTest) => void;
  only: (unit: string, fn: UnitTest) => void;
}

type Evaluate<ReturnType> = (callback: () => ReturnType) => ReturnType | Error;
```

### describe

Describes a test suite:

```
describe(string, TestSuite);
```

### describe.only

Only execute this test suite:

```
describe.only(string, UnitTest);
```

### describe.skip

Skip this test suite:

```
describe.only(string, UnitTest);
```

### assert

Gets passed by `describe`s test suite function and describes a single unit test with an object:

```
describe(string, async assert => {
  assert({
    given: string,
    should: string,
    actual: any,
    expected: any
  });
});
```

### evaluate

Function to evaluate code to either a returned value or a thrown error.

```
assert({
  given: string,
  should: string,
  actual: evaluate(() => any),
  expected: any
});
```

Can be async as well:

```
assert({
  given: string,
  should: string,
  actual: await evaluate(async () => any),
  expected: any
});
```

## Disclaimer

This runner was highly inspired by [RITEWay](https://github.com/ericelliott/riteway) on how to write tests with focus on simplicity (e.g. only use deep equal), and [node-tap](https://www.node-tap.org/) on how to log test reports based on the [TAP](https://testanything.org/) (Test Anything Protocol). Also [Jest](https://jestjs.io/) for snapshot testing.

[bsurl]: https://travis-ci.org/krieselreihe/natr.svg?branch=master
[bsimg]: https://travis-ci.org/krieselreihe/natr
[cvurl]: https://coveralls.io/repos/github/krieselreihe/natr/badge.svg?branch=master
[cvimg]: https://coveralls.io/github/krieselreihe/natr?branch=master
[cfimg]: https://img.shields.io/badge/commitizen-friendly-brightgreen.svg
[cfurl]: http://commitizen.github.io/cz-cli/
[ptimg]: https://img.shields.io/badge/code_style-prettier-ff69b4.svg
[pturl]: https://github.com/prettier/prettier

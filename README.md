# natr

[![Build Status][bsurl]][bsimg]
[![Coverage Status][cvurl]][cvimg]
[![Commitizen friendly][cfimg]][cfurl]
[![code style: prettier][ptimg]][pturl]

**Not another test runner!** (natr) But it is, and it is a highly opinionated one that is used for own projects. But if you want to use it as well, you are very welcome to do and give feedback 😎

**Important note:** This runner is a MVP. Therefore not stable, features missing and not every edge case tested, overall alpha software. Use at own risk. If you want to help get _natr_ on track please read the [contribution guide](./CONTRIBUTING.md).

## Contents

- [Principles](#principles)
- [Installation](#installation)
- [Usage](#usage)
  - [Basic test](#basic-test)
  - [Encapsulate execution](#encapsulate-execution)
  - [Exceptions](#exceptions)
  - [Sub checks](#sub-checks)
  - [React components](#react-components)
  - [Snapshot testing](#snapshot-testing)
- [CLI](#cli)
  - [Basic usage](#basic-usage)
  - [Preload files and modules](#preload-files-and-modules)
  - [Update snapshot](#update-snapshot)
  - [Coverage reports](#coverage-reports)
  - [Format output](#format-output)
- [API](#api)
  - [describe](#describe)
  - [assert](#assert)
  - [execute](#execute)
  - [check](#check)
- [Disclaimer](#disclaimer)

## Principles

The goal of _natr_ is a reduced API by only using deep equal to check values for tests. This got inspired by [RITEWay](https://github.com/ericelliott/riteway) and uses the same API. Another goal was readability. Every test case should state a clear goal without over complicating things. By implement [TAP](https://testanything.org/) it is also possible to already use a wide variety of tools together with _natr_ for test coverage, color output and formatting. Besides that, speed is another factor. Tests should be execute often and therefore _natr_ aims to be as fast as possible.

## Installation

```bash
# NPM
npm install @krieselreihe/natr --save-dev

# Yarn
yarn add @krieselreihe/natr --dev

# PNPM
pnpm install @krieselreihe/natr --save-dev
```

## Usage

### Basic test

Unit tests are explicit, so there are no global variables injected. Import `describe` from the test runner to create a test suite:

```javascript
import { describe } from "@krieselreihe/natr";

describe("my test suite", async assert => {
  assert({
    given: "a basic arithmetic expression",
    should: "calculate 2",
    actual: 1 + 1,
    expected: 2
  });
});
```

Now you can either execute it with _natr_ by running the following command to execute all your test files:

```bash
natr "src/__tests__/*.test.js"
```

Or you can also use _node_ to execute a single file. Every _natr_ test suite is a standalone executable Javascript file:

```bash
node "src/__tests__/my.test.js"
```

### Encapsulate execution

The `execute` helper gives you the chance to wrap an executions of multiple expressions to evaluate results. One example could be to retrieve the evaluated result of a promise:

```javascript
import { describe, execute } from "@krieselreihe/natr";

describe("my test suite", async assert => {
  assert({
    given: "a promise",
    should: "resolve",
    actual: await execute(() => Promise.resolve(23)),
    expected: 23
  });
});
```

**Note:** The `execute` function always should be awaited regardless of the inner expressions.

### Exceptions

To test if a function throws an error you can use the `execute` helper and pass a function to wrap your execution.

```javascript
import { describe, execute } from "@krieselreihe/natr";

describe("my test suite", async assert => {
  assert({
    given: "an expression that will throw",
    should: "throw an error",
    actual: await execute(() => throw new Error("Doh!")),
    expected: new Error("Doh!")
  });
});
```

### Sub checks

Inside executions you can perform assert checks as well that will throw if values are not deeply equal. Therefore the `execute` function passes a `check` function to the callback.

```javascript
import { describe, execute } from "@krieselreihe/natr";

describe("my test suite", async assert => {
  assert({
    given: "user object",
    should: "have the correct user id and structure",
    actual: await execute(check => {
      const user = { id: 1, name: "Helga" };

      check(user, { id: 1, name: "Max" });

      return user.id;
    }),
    expected: 1
  });
});
```

This would throw and result in a console output like the following:

```shell
not ok 1 - Given user object: should have the correct user id and structure
  ---
  expected: |-
    1
  actual: |-
    {
      Error: check() in execute() didn't match:
      { id: 1, name: 'Helga' }
      with:
      { id: 1, name: 'Max' }
      at check ... more stack trace ...
    }
```

### React components

To render react component you can just use [react-test-renderer](https://reactjs.org/docs/test-renderer.html) and its API.

```jsx
import { describe } from "@krieselreihe/natr";
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
import { describe, toMatchSnapshot } from "@krieselreihe/natr";
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

Snapshots will be saved next to the test file in a folder called `__snapshots__` as JSON files. To regenerate snapshots you can either delete the snapshot file or use the `--updateSnapshot / -u` flag provided by the runner [CLI](#cli):

```bash
natr -u
```

## CLI

### Basic usage

After installing _natr_ you can use the CLI to execute multiple test files at once. To use glob patterns provided by _natr_ the pattern should be in quotes:

```bash
natr "src/**/__tests__/*.(js|jsx)"
```

It uses [fast-glob](https://github.com/mrmlnc/fast-glob) and you can find documentation about the supported patterns at the [fast-glob pattern syntax documentation](https://github.com/mrmlnc/fast-glob#pattern-syntax). If you do not want to use _fast-glob_ for pattern matching you can write patterns without quotes to let your shell handle the file matching:

```bash
natr src/__tests__/*.js
```

**Note:** It is always possible to just use node to execute your tests. There are no magic global variables defined.

```bash
# Execute a single test case with node
node src/__tests__/my.test.js
```

### Preload files and modules

To preload modules and files you can use the `--require` (`-r`) flag for the CLI. It can also be used multiple times if needed. For example you can require [Babel](https://babeljs.io/) to enable certain transformations like supporting JSX or new ECMAScript features (for Babel you need also a [`.babelrc` configuration file](https://babeljs.io/docs/en/config-files) to make it work).

```bash
# Register babel
natr "src/__tests__/*.test.(js|jsx)" -r @babel/register
```

```bash
# Preload a file
natr "src/__tests__/*.test.(js|jsx)" -r ./tests/setup.js
```

### Update snapshot

To update your generated snapshot tests you can add the `--updateSnapshot` (`-u`) flag to the CLI.

```bash
natr -u "src/__tests__/*.test.(js|jsx)"
```

### Coverage reports

To generate code coverage reports you can combine [istanbul](https://istanbul.js.org/) with [tap-nyc](https://github.com/MegaArman/tap-nyc).

```bash
nyc --reporter=text natr "src/__tests__/*.test.js" | tap-nyc
```

You can also integrate this with [coveralls](https://coveralls.io/) by using [node-coveralls](https://github.com/nickmerwin/node-coveralls) and the `text-lcov` reporter of _istanbul_:

```bash
nyc --reporter=text-lcov natr "src/__tests__/*.test.js" | coveralls
```

### Format output

Through the implementation of [TAP](https://testanything.org/) you can use a variety of formatter that already exist. As long as they take TAP formatted text as input you can use it. Here is a list of some of them:

- [tap-bail](https://github.com/juliangruber/tap-bail)
- [tap-diff](https://github.com/axross/tap-diff)
- [tap-dot](https://github.com/scottcorgan/tap-dot)
- [tap-html](https://github.com/gabrielcsapo/tap-html)
- [tap-json](https://github.com/gummesson/tap-json)
- [tap-markdown](https://github.com/Hypercubed/tap-markdown)
- [tap-nirvana](https://github.com/inadarei/tap-nirvana)
- [tap-notify](https://github.com/axross/tap-notify)
- [tap-nyan](https://github.com/calvinmetcalf/tap-nyan)
- [tap-spec](https://github.com/scottcorgan/tap-spec)
- [tap-xunit](https://github.com/aghassemi/tap-xunit)

And probably many many more. To use any of them install it and pipe the _natr_ output to the respective formatter:

```bash
natr "src/__tests__/*.test.js" | tap-nirvana
```

## API

Described as TypeScript the API would like the following:

```typescript
interface Assert<TestType = any> {
  given: string;
  should: string;
  actual: TestType;
  expected: TestType;
}

type UnitTest = (assert: Assert) => void;

type TestSuite = (test: UnitTest) => Promise<void>;

type Describe = (unit: string, fn: TestSuite) => void;

type Check = (a: any, b: any) => void;

type Execute<ReturnType = any> = (
  callback: (check: Check) => ReturnType
) => Promise<ReturnType | Error>;
```

### describe

Describes a test suite:

```
describe(string, TestSuite);
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

### execute

Function to execute code to either a returned value or a thrown error.

```
assert({
  given: string,
  should: string,
  actual: await execute(() => any),
  expected: any
});
```

### check

The `execute` function passes an "check" method that will throw an error if the two passed values are not deep equal.

```
await execute(check => {
  check(any, any);
})
```

## Disclaimer

This runner was highly inspired by [RITEWay](https://github.com/ericelliott/riteway) on how to write tests with focus on simplicity (e.g. only use deep equal, enforce reduced API), and [node-tap](https://www.node-tap.org/) on how to log test reports based on the [TAP](https://testanything.org/) (Test Anything Protocol). Also [Jest](https://jestjs.io/) for snapshot testing and [tape](https://github.com/substack/tape) on actual creating a runner that had to hold as base for _natr_.

[bsurl]: https://travis-ci.org/krieselreihe/natr.svg?branch=master
[bsimg]: https://travis-ci.org/krieselreihe/natr
[cvurl]: https://coveralls.io/repos/github/krieselreihe/natr/badge.svg?branch=master
[cvimg]: https://coveralls.io/github/krieselreihe/natr?branch=master
[cfimg]: https://img.shields.io/badge/commitizen-friendly-brightgreen.svg
[cfurl]: http://commitizen.github.io/cz-cli/
[ptimg]: https://img.shields.io/badge/code_style-prettier-ff69b4.svg
[pturl]: https://github.com/prettier/prettier

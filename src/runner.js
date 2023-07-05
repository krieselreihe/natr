const fs = require("fs");
const path = require("path");

const createDefaultStream = require("./default-stream");
const duplexStream = require("./duplex-stream");
const messaging = require("./messaging");
const Results = require("./results");
const Test = require("./test");

const FS_OPTIONS = { encoding: "utf8" };

function createExitHarness(conf = {}) {
  const harness = createHarness();
  const stream = harness.createStream();
  const extendedStream = stream.pipe(conf.stream || createDefaultStream());
  let ended = false;

  extendedStream.on("error", () => (harness.exitCode = 1));
  stream.on("end", () => (ended = true));

  process.on("exit", (code) => {
    if (code !== 0) {
      return;
    }

    if (!ended) {
      harness.tests.forEach((test) => test.exit());
    }

    harness.close();
    process.exit(code || harness.exitCode);
  });

  return harness;
}

function createHarness() {
  const results = new Results();
  const testHarness = (name, cb) => {
    const test = new Test(name, cb);
    testHarness.tests.push(test);

    (function inspectCode(stream) {
      stream.on("test", inspectCode);
      stream.on("result", (result) => {
        if (!result.ok && typeof result !== "string") {
          testHarness.exitCode = 1;
        }
      });
    })(test);

    results.push(test);
    return test;
  };

  testHarness.results = results;
  testHarness.exitCode = 0;
  testHarness.tests = [];

  testHarness.createStream = () => results.createStream();
  testHarness.onFinish = (cb) => results.on("done", cb);
  testHarness.onFailure = (cb) => results.on("fail", cb);
  testHarness.close = () => results.close();

  return testHarness;
}

const _describe = (function test() {
  let harness;
  const getHarness = (opts = {}) => {
    if (!harness) {
      harness = createExitHarness(opts);
    }

    return harness;
  };

  const lazyLoad = (message, cb) => getHarness()(message, cb);

  lazyLoad.createStream = () => {
    if (!harness) {
      const stream = duplexStream();

      getHarness({ stream });

      return stream;
    }

    return harness.createStream();
  };

  lazyLoad.onFinish = (cb) => getHarness().onFinish(cb);
  lazyLoad.onFailure = (cb) => getHarness().onFailure(cb);
  lazyLoad.getHarness = getHarness;

  return lazyLoad;
})();

function catchAndReturn(value) {
  return value.catch((err) => err);
}

function isPromise(value) {
  return Boolean(value && typeof value.then === "function");
}

function catchPromise(value) {
  return isPromise(value) ? catchAndReturn(value) : value;
}

function getTestFile() {
  const originalFunc = Error.prepareStackTrace;
  let callerFile;

  try {
    const err = new Error();

    Error.prepareStackTrace = (_, stack) => stack;

    const currentFile = err.stack.shift().getFileName();

    while (err.stack.length) {
      callerFile = err.stack.shift().getFileName();

      if (currentFile !== callerFile) {
        break;
      }
    }
  } catch (e) {
    // Ignore exception
  }

  Error.prepareStackTrace = originalFunc;

  return callerFile;
}

function writeFormattedObjectFile(file, obj) {
  const data = JSON.stringify(obj, null, 2);

  fs.writeFileSync(file, data, FS_OPTIONS);
}

function readFormattedObjectFile(file) {
  return JSON.parse(String(fs.readFileSync(file, FS_OPTIONS)));
}

function resolveSnapshot(name, value) {
  const testFile = getTestFile();
  const snapshotDir = `${path.dirname(testFile)}${path.sep}__snapshots__`;
  const snapshotFile = `${snapshotDir}${path.sep}${path.basename(
    testFile,
  )}.snap`;

  if (!fs.existsSync(snapshotDir)) {
    fs.mkdirSync(snapshotDir);
  }

  if (!fs.existsSync(snapshotFile)) {
    writeFormattedObjectFile(snapshotFile, { [name]: value });

    return value;
  }

  const snapshots = readFormattedObjectFile(snapshotFile);

  if (!snapshots[name]) {
    snapshots[name] = value;
    writeFormattedObjectFile(snapshotFile, snapshots);

    return value;
  }

  return snapshots[name];
}

function isValidTestDescriptor(descriptor) {
  if (typeof descriptor !== "object" || Array.isArray(descriptor)) {
    return false;
  }

  return (
    descriptor.hasOwnProperty("given") &&
    descriptor.hasOwnProperty("should") &&
    descriptor.hasOwnProperty("actual") &&
    descriptor.hasOwnProperty("expected")
  );
}

function createAssert(description, test) {
  return function assert(testDescriptor = {}) {
    if (!isValidTestDescriptor(testDescriptor)) {
      test.deepEqual(
        testDescriptor,
        messaging.API_DESCRIPTION,
        "You either used the assert function wrong or there is a typo.",
      );
      return;
    }

    const { given, should, actual, expected } = testDescriptor;
    const message = `Given ${given}: should ${should}`;

    if (expected === resolveSnapshot) {
      test.deepEqual(
        actual,
        resolveSnapshot(`${description}, ${message}`, actual),
        message,
      );
      return;
    }

    test.deepEqual(actual, expected, message);
  };
}

/**
 * Describe a test suite
 *
 * @public
 * @type {Function}
 * @param {string} description Describe test suite
 * @param {function(Function)} unit Actual unit tests that gets `assert` passed
 */
function describe(description, unit) {
  _describe(description, (test) => {
    const end = () => test.end();
    const assert = createAssert(description, test);
    const result = unit(assert);

    if (isPromise(result)) {
      return result.then(end);
    }

    end();
  });
}

/**
 * Execute block of code
 *
 * @public
 * @param {Function} fn Execution wrapper
 * @returns {Promise<*>} Returns resolved return value or thrown error
 */
function execute(fn) {
  try {
    return catchPromise(fn());
  } catch (err) {
    return err;
  }
}

/**
 * Create a snapshot of an actual object
 *
 * @public
 * @returns {function(string)} Function that resolved into stored or created snapshot object
 */
function toMatchSnapshot() {
  return resolveSnapshot;
}

module.exports = {
  describe,
  execute,
  toMatchSnapshot,
};

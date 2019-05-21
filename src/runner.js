const createDefaultStream = require("./default-stream");
const duplexStream = require("./duplex-stream");
const messaging = require("./messaging");
const Results = require("./results");
const Test = require("./test");

function createExitHarness(conf = {}) {
  const harness = createHarness();
  const stream = harness.createStream({ objectMode: conf.objectMode });
  const extendedStream = stream.pipe(conf.stream || createDefaultStream());
  let ended = false;

  extendedStream.on("error", () => (harness.exitCode = 1));
  stream.on("end", () => (ended = true));

  process.on("exit", code => {
    if (code !== 0) {
      return;
    }

    if (!ended) {
      harness.tests.forEach(test => test.exit());
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
      stream.on("result", result => {
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

  testHarness.createStream = opts => results.createStream(opts);
  testHarness.onFinish = cb => results.on("done", cb);
  testHarness.onFailure = cb => results.on("fail", cb);
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

  lazyLoad.createStream = (opts = {}) => {
    if (!harness) {
      const output = duplexStream();

      getHarness({ stream: output, objectMode: opts.objectMode });

      return output;
    }

    return harness.createStream(opts);
  };

  lazyLoad.onFinish = cb => getHarness().onFinish(cb);
  lazyLoad.onFailure = cb => getHarness().onFailure(cb);
  lazyLoad.getHarness = getHarness;

  return lazyLoad;
})();

function catchAndReturn(value) {
  return value.catch(err => err);
}

function isPromise(value) {
  return Boolean(value && typeof value.then === "function");
}

function catchPromise(value) {
  return isPromise(value) ? catchAndReturn(value) : value;
}

function resolveSnapshot(name) {
  const obj = {};

  return obj[name];
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
        "You either used the assert function wrong or there is a typo."
      );
      return;
    }

    const { given, should, actual, expected } = testDescriptor;
    const message = `Given ${given}: should ${should}`;

    if (expected === resolveSnapshot) {
      test.deepEqual(
        actual,
        resolveSnapshot(`${description}, ${message}`),
        message
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
  _describe(description, test => {
    const end = () => test.end();
    const assert = createAssert(description, test);
    const result = unit(assert);

    if (isPromise(result)) {
      return result.then(end);
    }
  });
}

/**
 * Execute block of code
 *
 * @public
 * @param {Function} fn Execution wrapper
 * @returns {Promise<any>} Returns resolved return value or thrown error
 */
async function execute(fn) {
  try {
    return await Promise.resolve(catchPromise(fn()));
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
  toMatchSnapshot
};

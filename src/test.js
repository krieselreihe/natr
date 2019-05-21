const deepEqual = require("fast-deep-equal");
const path = require("path");
const { EventEmitter } = require("events");

const errorStackRegExp = /^(?:[^\s]*\s*\bat\s+)(?:(.*)\s+\()?((?:\/|[a-zA-Z]:\\)[^:)]+:(\d+)(?::(\d+))?)/;

module.exports = class Test extends EventEmitter {
  constructor(name, cb) {
    super();

    this.name = name || "(anonymous)";
    this.assertCount = 0;
    this.cb = cb;
    this.progeny = [];
    this.ok = true;
  }

  run() {
    if (!this.cb) {
      return this._end();
    }

    this.timeoutAfter();
    this.emit("prerun");
    this.cb(this);
    this.emit("run");
  }

  test(name, cb) {
    const test = new Test(name, cb);

    this.progeny.push(test);
    this.emit("test", test);

    test.on("prerun", () => this.assertCount++);

    setImmediate(() => this._end());
  }

  timeoutAfter() {
    const timeout = setTimeout(() => {
      this.fail(`test timed out after ${500}ms`);
      this.end();
    }, 500);

    this.once("end", () => clearTimeout(timeout));
  }

  end() {
    if (this.calledEnd) {
      this.fail(".end() called twice");
    }

    this.calledEnd = true;
    this._end();
  }

  _end() {
    if (this.progeny.length) {
      const test = this.progeny.shift();

      test.on("end", () => this._end());
      test.run();

      return;
    }

    if (!this.ended) {
      this.emit("end");
    }

    this.ended = true;
  }

  exit() {
    if (!this.ended) {
      this.fail("test exited without ending", {
        exiting: true
      });
    }
  }

  assert(ok, opts = {}) {
    const result = {
      id: this.assertCount++,
      ok: Boolean(ok),
      name: opts.message || "(unnamed assert)"
    };

    if (opts.hasOwnProperty("actual")) {
      result.actual = opts.actual;
    }

    if (opts.hasOwnProperty("expected")) {
      result.expected = opts.expected;
    }

    this.ok = Boolean(this.ok && ok);

    if (!ok) {
      result.error = opts.error || new Error(result.name);

      const error = new Error("exception");
      const errorStack = (error.stack || "").split("\n");
      const dir = `${__dirname}${path.sep}`;

      for (let i = 0; i < errorStack.length; i += 1) {
        const [, callDescription = "<anonymous>", filePath, line, column] =
          errorStackRegExp.exec(errorStack[i]) || [];

        if (!filePath) {
          continue;
        }

        if (filePath.slice(0, dir.length) === dir) {
          continue;
        }

        // Function call description may not (just) be a function name.
        // Try to extract function name by looking at first "word" only.
        result.functionName = callDescription.split(/\s+/)[0];
        result.file = filePath;
        result.line = Number(line);

        if (column) {
          result.column = Number(column);
        }

        result.at = `${callDescription} (${filePath})`;
        break;
      }
    }

    this.emit("result", result);
    setImmediate(() => this._end());
  }

  fail(message) {
    this.assert(false, {
      message
    });
  }

  deepEqual(actual, expected, message = "should be equal") {
    this.assert(deepEqual(actual, expected), {
      message,
      actual,
      expected
    });
  }
};

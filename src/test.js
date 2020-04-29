const deepEqual = require("fast-deep-equal");
const path = require("path");
const { EventEmitter } = require("events");

const errorStackRegExp = /^(?:[^\s]*\s*\bat\s+)(?:(.*)\s+\()?((?:\/|[a-zA-Z]:\\)[^:)]+:(\d+)(?::(\d+))?)/;

module.exports = class Test extends EventEmitter {
  constructor(name, cb) {
    super();

    this.name = name;
    this.assertCount = 0;
    this.cb = cb;
    this.ok = true;
  }

  run() {
    this._timeoutAfter();
    this.emit("prerun");
    this.cb(this);
    this.emit("run");
  }

  _timeoutAfter() {
    const timeToFail = 500;
    const timeout = setTimeout(() => {
      this._fail(`test timed out after ${timeToFail}ms`);
      this.end();
    }, timeToFail);

    this.once("end", () => clearTimeout(timeout));
  }

  end() {
    if (this.calledEnd) {
      this._fail(".end() called twice");
    }

    this.calledEnd = true;
    this._end();
  }

  _end() {
    if (!this.ended) {
      this.emit("end");
    }

    this.ended = true;
  }

  exit() {
    if (!this.ended) {
      this._fail("test exited without ending");
    }
  }

  _assert(ok, opts) {
    const result = {
      id: this.assertCount++,
      ok: Boolean(ok),
      name: opts.message,
    };

    if (opts.hasOwnProperty("actual")) {
      result.actual = opts.actual;
    }

    if (opts.hasOwnProperty("expected")) {
      result.expected = opts.expected;
    }

    this.ok = Boolean(this.ok && ok);

    if (!ok) {
      result.error = new Error(result.name);

      const error = new Error("exception");
      const errorStack = (error.stack || "").split("\n");
      const dir = `${__dirname}${path.sep}`;

      for (let i = 0; i < errorStack.length; i++) {
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

  _fail(message) {
    this._assert(false, { message });
  }

  deepEqual(actual, expected, message) {
    // @todo: A feature for comparing an error against a string. Maybe useful, maybe not.
    if (actual instanceof Error && typeof expected === "string") {
      actual = actual.message;
    }

    this._assert(deepEqual(actual, expected), {
      message,
      actual,
      expected,
    });
  }
};

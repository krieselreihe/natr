const { EventEmitter } = require("events");
const StackUtils = require("stack-utils");

const duplexStream = require("./duplex-stream");
const resumeStream = require("./resume-stream");
const messaging = require("./messaging");
const inspectObject = require("./inspect-object");

const cwd = process.cwd();
const projectFiles = /natr$/.test(cwd) ? [] : [/natr\/src/];
const stackHelper = new StackUtils({
  cwd,
  internals: [...StackUtils.nodeInternals(), ...projectFiles]
});

function isInvalidYaml(str) {
  return /[:\-?]/.test(str);
}

function encodeResult(result, count) {
  const isInternalResult = messaging.isInternal(result.expected || "");
  const outer = "  ";
  const inner = `${outer}  `;
  const output = [
    `${result.ok ? "ok " : "not ok "}${count} -`,
    result.name ? ` ${result.name.toString().replace(/\s+/g, " ")}` : "",
    "\n"
  ];

  if (result.ok) {
    return output.join("");
  }

  output.push(`${outer}---\n`);

  if (result.hasOwnProperty("expected") || result.hasOwnProperty("actual")) {
    const expected = isInternalResult
      ? messaging.cleanInternal(result.expected)
      : inspectObject(result.expected);
    const actual = inspectObject(result.actual);

    if (
      Math.max(expected.length, actual.length) > 65 ||
      isInvalidYaml(expected) ||
      isInvalidYaml(actual)
    ) {
      output.push(
        `${outer}expected: |-\n${inner}${expected}\n`,
        `${outer}actual: |-\n${inner}${actual}\n`
      );
    } else {
      output.push(
        `${outer}expected: ${expected}\n`,
        `${outer}actual:   ${actual}\n`
      );
    }
  }

  if (result.at) {
    output.push(`${outer}at: ${result.at}\n`);
  }

  const actualIsComplexObject =
    typeof result.actual === "object" || typeof result.actual === "function";
  const actualStack = actualIsComplexObject ? result.actual.stack : undefined;
  const errorStack = result.error && result.error.stack;
  const stack = actualStack || errorStack;

  if (stack) {
    output.push(`${outer}stack: |-\n`);
    stackHelper
      .clean(stack)
      .split("\n")
      .forEach(line => {
        if (isInternalResult && !line.startsWith("describe")) {
          return;
        }

        output.push(`${inner}${line}\n`);
      });
  }

  output.push(`${outer}...\n`);

  return output.join("");
}

module.exports = class Results extends EventEmitter {
  constructor() {
    super();

    this.count = 0;
    this.fail = 0;
    this.pass = 0;
    this.stream = duplexStream();
    this.tests = [];
    this.isRunning = false;
  }

  createStream(opts = {}) {
    let output;
    let testId = 0;

    if (opts.objectMode) {
      output = duplexStream();

      const onTest = (test, extra = {}) => {
        let id = testId++;

        test.once("prerun", () => {
          const row = {
            type: "test",
            name: test.name,
            id
          };
          if (extra.hasOwnProperty("parent")) {
            row.parent = extra.parent;
          }
          output.queue(row);
        });

        test.on("test", str => onTest(str, { parent: id }));

        test.on("result", result => {
          result.test = id;
          result.type = "assert";
          output.queue(result);
        });

        test.on("end", () => output.queue({ type: "end", test: id }));
      };

      this.on("_push", onTest);
      this.on("done", () => output.queue(null));
    } else {
      output = resumeStream();
      output.queue("TAP version 13\n");
      this.stream.pipe(output);
    }

    if (!this.isRunning) {
      this.isRunning = true;
      const next = () => {
        let test;

        while ((test = this.tests.shift())) {
          test.run();
          if (!test.ended) {
            return test.once("end", () => setImmediate(next));
          }
        }

        this.emit("done");
      };

      setImmediate(next);
    }

    return output;
  }

  push(test) {
    this.tests.push(test);
    this._watch(test);
    this.emit("_push", test);
  }

  _watch(test) {
    const write = str => this.stream.queue(str);

    test.once("prerun", () => write(`# ${test.name}\n`));

    test.on("result", result => {
      if (typeof result === "string") {
        return write(`# ${result}\n`);
      }

      write(encodeResult(result, this.count + 1));
      this.count += 1;

      if (result.ok) {
        this.pass += 1;
      } else {
        this.fail += 1;
        this.emit("fail");
      }
    });

    test.on("test", str => this._watch(str));
  }

  close() {
    if (this.closed) {
      this.stream.emit("error", new Error("ALREADY CLOSED"));
    }

    this.closed = true;
    const write = str => this.stream.queue(str);

    write(`\n1..${this.count}\n`);
    write(`# tests ${this.count}\n`);
    write(`# pass  ${this.pass}\n`);

    if (this.fail) {
      write(`# fail  ${this.fail}\n`);
    } else {
      write("\n# ok\n");
    }

    this.stream.queue(null);
  }
};

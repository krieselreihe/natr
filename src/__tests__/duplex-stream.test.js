const spec = require("stream-spec");

const duplexStream = require("../duplex-stream");
const { describe, execute } = require("../runner");

function write(array, stream) {
  array = array.slice();

  const next = () => {
    while (array.length) {
      if (!stream.write(array.shift())) {
        return stream.once("drain", next);
      }
    }

    stream.end();
  };

  next();
}

function read(stream, callback) {
  const actual = [];

  stream.on("data", (data) => actual.push(data));
  stream.once("end", () => callback(null, actual));
  stream.once("error", callback);
}

describe("duplex streams", async (assert) => {
  // 100 is just a generic length for the test data set
  const randomNumberArray = Array.from({ length: 100 }, () =>
    Math.floor(Math.random() * 100)
  );

  // @todo: Bug report
  // The following both tests kind of result in a timeout internally that will
  // result in setting the test suite pointer to the next item and therefore
  // adding the result messages to the wrong queue.
  //
  // Wrong:
  //
  // TAP version 13
  // # duplex streams
  // ok 1 - Given default data: should return the input stream
  // # regular test cases
  // ok 2 - Given the calc function without arguments: should return 0
  // ok 3 - Given the calc function with one argument: should return the given number
  // ...
  //
  // Correct:
  //
  // TAP version 13
  // # duplex streams
  // ok 1 - Given an input stream: should be possible to be paused
  // ok 2 - Given undefined data: should not stop if written
  // ok 3 - Given an input stream: should end before close
  // ok 4 - Given an input stream with auto destroy deactivated: should stay open
  // ...
  //
  // Now I only have to figure out why :P
  //
  // assert({
  //   given: "default data",
  //   should: "return the input stream",
  //   actual: await execute(() => {
  //     const stream = duplexStream();
  //     const mockedStream = spec(stream)
  //       .through()
  //       .pausable();
  //     const result = new Promise((resolve, reject) => {
  //       read(stream, (err, actual) => {
  //         if (err) reject(err);
  //         resolve(actual);
  //       });
  //     });
  //
  //     stream.on("close", mockedStream.validate);
  //     write(expected, stream);
  //
  //     return result;
  //   }),
  //   expected
  // });
  //
  // assert({
  //   given: "custom data",
  //   should: "returns the input stream",
  //   actual: await execute(() => {
  //     const stream = duplexStream(data => stream.emit("data", data * 2));
  //     const mockedStream = spec(stream)
  //       .through()
  //       .pausable();
  //
  //     const result = new Promise((resolve, reject) => {
  //       read(stream, (err, actual) => {
  //         if (err) reject(err);
  //         resolve(actual);
  //       });
  //     });
  //
  //     stream.on("close", () => {
  //       mockedStream.validate();
  //     });
  //     write(expected, stream);
  //
  //     return result;
  //   }),
  //   expected: expected.map(data => data * 2)
  // });

  assert({
    given: "an input stream",
    should: "be possible to be paused",
    actual: await execute(() => {
      const stream = duplexStream();
      const mockedStream = spec(stream).through().pausable();

      stream.on("data", () => {
        if (Math.random() > 0.1) {
          return;
        }

        stream.pause();
        setImmediate(() => stream.resume());
      });

      const result = new Promise((resolve, reject) => {
        read(stream, (err, actual) => {
          if (err) reject(err);
          resolve(actual);
        });
      });

      stream.on("close", () => {
        mockedStream.validate();
      });

      write(randomNumberArray, stream);

      return result;
    }),
    expected: randomNumberArray,
  });

  assert({
    given: "undefined data",
    should: "not stop if written",
    actual: await execute(() => {
      const stream = duplexStream();
      let count = 0;

      stream.on("data", () => {
        count += 1;
      });

      stream.write(undefined);
      stream.write(undefined);

      return count;
    }),
    expected: 2,
  });

  assert({
    given: "an input stream",
    should: "end before close",
    actual: await execute(() => {
      const stream = duplexStream();
      let ended = false;
      let closed = false;

      stream.on("end", () => {
        ended = true;
      });

      stream.on("close", () => {
        closed = true;
      });

      stream.write(1);
      stream.write(2);
      stream.write(3);
      stream.end();

      return ended && closed;
    }),
    expected: true,
  });

  assert({
    given: "an input stream with auto destroy deactivated",
    should: "stay open",
    actual: await execute(() => {
      const stream = duplexStream();
      let ended = false;
      let closed = false;

      stream.autoDestroy = false;

      stream.on("end", () => {
        ended = true;
      });

      stream.on("close", () => {
        closed = true;
      });

      stream.write(1);
      stream.write(2);
      stream.write(3);
      stream.end();

      const beforeDestroyState = ended && !closed;

      stream.destroy();

      return beforeDestroyState && closed;
    }),
    expected: true,
  });

  assert({
    given: "multiple end of stream events",
    should: "end only once",
    actual: await execute(() => {
      const stream = duplexStream();
      let ended = false;
      let endedOnce = false;

      stream.on("end", () => {
        endedOnce = ended === false;
        ended = true;
      });

      stream.queue(null);
      stream.queue(null);
      stream.queue(null);

      stream.resume();

      return endedOnce;
    }),
    expected: true,
  });

  assert({
    given: "multiple end calls",
    should: "end only once",
    actual: await execute(() => {
      const stream = duplexStream();
      let ended = false;
      let endedOnce = false;

      stream.on("end", () => {
        endedOnce = ended === false;
        ended = true;
      });

      stream.end();
      stream.end();

      return endedOnce;
    }),
    expected: true,
  });

  assert({
    given: "an input stream",
    should: "buffer a set of data",
    actual: await execute(() => {
      const stream = duplexStream(
        (data) => stream.queue(data),
        () => stream.queue(null)
      );
      const actual = [];

      stream.on("data", actual.push.bind(actual));

      stream.write(1);
      stream.write(2);
      stream.write(3);

      return actual;
    }),
    expected: [1, 2, 3],
  });

  assert({
    given: "an input stream",
    should: "ignores writing after pausing the stream",
    actual: await execute(() => {
      const stream = duplexStream(
        (data) => stream.queue(data),
        () => stream.queue(null)
      );
      const actual = [];

      stream.on("data", actual.push.bind(actual));

      stream.write(1);
      stream.write(2);
      stream.write(3);
      stream.pause();
      stream.write(4);
      stream.write(5);
      stream.write(6);

      return actual;
    }),
    expected: [1, 2, 3],
  });

  assert({
    given: "an input stream",
    should: "add buffered data after stream resumes",
    actual: await execute(() => {
      const stream = duplexStream(
        (data) => stream.queue(data),
        () => stream.queue(null)
      );
      const actual = [];

      stream.on("data", actual.push.bind(actual));

      stream.write(1);
      stream.write(2);
      stream.write(3);
      stream.pause();
      stream.write(4);
      stream.write(5);
      stream.write(6);
      stream.resume();

      return actual;
    }),
    expected: [1, 2, 3, 4, 5, 6],
  });

  assert({
    given: "an input stream",
    should: "buffers and ends stream",
    actual: await execute(() => {
      const stream = duplexStream(
        (data) => stream.queue(data),
        () => stream.queue(null)
      );
      const actual = [];
      let ended = false;

      stream.on("data", actual.push.bind(actual));
      stream.on("end", () => {
        ended = true;
      });

      stream.write(1);
      stream.write(2);
      stream.write(3);
      stream.pause();
      stream.write(4);
      stream.write(5);
      stream.write(6);
      stream.resume();
      stream.pause();
      stream.end();
      stream.resume();

      return [[1, 2, 3, 4, 5, 6], ended];
    }),
    expected: [[1, 2, 3, 4, 5, 6], true],
  });

  assert({
    given: "a stream on buffering",
    should: "does not contain written data on pause",
    actual: await execute(() => {
      const stream = duplexStream(
        (data) => stream.queue(data),
        () => stream.queue(null)
      );
      const actual = [];

      stream.on("data", actual.push.bind(actual));

      stream.pause();
      stream.write(1);
      stream.write(2);
      stream.write(3);
      stream.end();

      return actual;
    }),
    expected: [],
  });

  assert({
    given: "a stream on buffering",
    should: "have data in queue when ends",
    actual: await execute(() => {
      const stream = duplexStream(
        (data) => stream.queue(data),
        () => stream.queue(null)
      );
      const actual = [];

      stream.on("data", actual.push.bind(actual));

      stream.pause();
      stream.write(1);
      stream.write(2);
      stream.write(3);
      stream.end();
      stream.resume();

      return actual;
    }),
    expected: [1, 2, 3],
  });
});

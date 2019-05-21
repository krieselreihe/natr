const { describe, execute } = require("../runner");
const spec = require("stream-spec");

const duplexStream = require("../duplex-stream");

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

  stream.on("data", data => actual.push(data));
  stream.once("end", () => callback(null, actual));
  stream.once("error", callback);
}

describe("duplex streams", async assert => {
  const expected = Array.from({ length: 100 }, () =>
    Math.floor(Math.random() * 100)
  );

  assert({
    given: "default data",
    should: "return the input stream",
    actual: await execute(() => {
      const stream = duplexStream();
      const mockedStream = spec(stream)
        .through()
        .pausable();
      const result = new Promise((resolve, reject) => {
        read(stream, (err, actual) => {
          if (err) reject(err);
          resolve(actual);
        });
      });

      stream.on("close", mockedStream.validate);
      write(expected, stream);

      return result;
    }),
    expected
  });

  assert({
    given: "custom data",
    should: "returns the input stream",
    actual: await execute(() => {
      const stream = duplexStream(data => stream.emit("data", data * 2));
      const mockedStream = spec(stream)
        .through()
        .pausable();
      const result = new Promise((resolve, reject) => {
        read(stream, (err, actual) => {
          if (err) reject(err);
          resolve(actual);
        });
      });

      stream.on("close", mockedStream.validate);
      write(expected, stream);

      return result;
    }),
    expected: expected.map(data => data * 2)
  });

  assert({
    given: "an input stream",
    should: "be possible to be paused",
    actual: await execute(() => {
      const stream = duplexStream();
      const mockedStream = spec(stream)
        .through()
        .pausable();

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

      write(expected, stream);

      return result;
    }),
    expected
  });

  assert({
    given: "something cool",
    should: "do more",
    actual: 1 + 2,
    expocted: 42
  });
});

// test("duplex stream does not stop if undefined is written", assert => {
//   const stream = duplexStream();
//   let count = 0;
//
//   stream.on("data", () => {
//     count += 1;
//   });
//
//   stream.write(undefined);
//   stream.write(undefined);
//
//   assert.equal(count, 2);
//
//   assert.end();
// });
//
// test("duplex stream does end before close", assert => {
//   const stream = duplexStream();
//   let ended = false;
//   let closed = false;
//
//   stream.on("end", () => {
//     assert.ok(!closed);
//     ended = true;
//   });
//
//   stream.on("close", () => {
//     assert.ok(ended);
//     closed = true;
//   });
//
//   stream.write(1);
//   stream.write(2);
//   stream.write(3);
//   stream.end();
//   assert.ok(ended);
//   assert.ok(closed);
//   assert.end();
// });
//
// test("duplex stream stays open if auto destroy is deactivated", assert => {
//   const stream = duplexStream();
//   let ended = false;
//   let closed = false;
//
//   stream.autoDestroy = false;
//
//   stream.on("end", () => {
//     assert.ok(!closed);
//     ended = true;
//   });
//
//   stream.on("close", () => {
//     assert.ok(ended);
//     closed = true;
//   });
//
//   stream.write(1);
//   stream.write(2);
//   stream.write(3);
//   stream.end();
//   assert.ok(ended);
//   assert.notOk(closed);
//   stream.destroy();
//   assert.ok(closed);
//   assert.end();
// });
//
// test("duplex stream does end only once", assert => {
//   const stream = duplexStream();
//   let ended = false;
//
//   stream.on("end", () => {
//     assert.equal(ended, false);
//     ended = true;
//   });
//
//   stream.queue(null);
//   stream.queue(null);
//   stream.queue(null);
//
//   stream.resume();
//
//   assert.end();
// });
//
// test("duplex stream does end only once on multiple end calls", assert => {
//   const stream = duplexStream();
//   let ended = false;
//
//   assert.plan(1);
//
//   stream.on("end", () => {
//     assert.equal(ended, false);
//     ended = true;
//   });
//
//   stream.end();
//   stream.end();
// });
//
// test("duplex stream does buffering", assert => {
//   const stream = duplexStream(
//     data => stream.queue(data),
//     () => stream.queue(null)
//   );
//   let ended = false;
//   let actual = [];
//
//   stream.on("data", actual.push.bind(actual));
//   stream.on("end", () => {
//     ended = true;
//   });
//
//   stream.write(1);
//   stream.write(2);
//   stream.write(3);
//   assert.same(actual, [1, 2, 3]);
//   stream.pause();
//   stream.write(4);
//   stream.write(5);
//   stream.write(6);
//   assert.same(actual, [1, 2, 3]);
//   stream.resume();
//   assert.same(actual, [1, 2, 3, 4, 5, 6]);
//   stream.pause();
//   stream.end();
//   assert.ok(!ended);
//   stream.resume();
//   assert.ok(ended);
//   assert.end();
// });
//
// test("duplex stream on buffering has data in queue when ends", assert => {
//   const stream = duplexStream(
//     data => stream.queue(data),
//     () => stream.queue(null)
//   );
//
//   let ended = false;
//   let actual = [];
//
//   stream.on("data", actual.push.bind(actual));
//   stream.on("end", () => {
//     ended = true;
//   });
//
//   stream.pause();
//   stream.write(1);
//   stream.write(2);
//   stream.write(3);
//   stream.end();
//   assert.same(actual, [], "no data written yet, still paused");
//   assert.ok(!ended, "end not emitted yet, still paused");
//   stream.resume();
//   assert.same(actual, [1, 2, 3], "resumed, all data should be delivered");
//   assert.ok(ended, "end should be emitted once all data was delivered");
//   assert.end();
// });

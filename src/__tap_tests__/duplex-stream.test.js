const { test } = require("tap");
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

test("duplex streams with default data", assert => {
  const expected = Array.from({ length: 100 }, () =>
    Math.floor(Math.random() * 100)
  );
  const stream = duplexStream();
  const mockedStream = spec(stream)
    .through()
    .pausable();

  read(stream, (err, actual) => {
    assert.ifError(err);
    assert.same(actual, expected);
    assert.end();
  });

  stream.on("close", mockedStream.validate);

  write(expected, stream);
});

test("duplex stream with written data", assert => {
  const expected = Array.from({ length: 100 }, () =>
    Math.floor(Math.random() * 100)
  );
  const stream = duplexStream(data => stream.emit("data", data * 2));
  const mockedStream = spec(stream)
    .through()
    .pausable();

  read(stream, (err, actual) => {
    assert.ifError(err);
    assert.same(actual, expected.map(data => data * 2));
    assert.end();
  });

  stream.on("close", mockedStream.validate);

  write(expected, stream);
});

test("duplex stream can be paused", assert => {
  const expected = Array.from({ length: 100 }, () =>
    Math.floor(Math.random() * 100)
  );
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

  read(stream, (err, actual) => {
    assert.ifError(err);
    assert.same(actual, expected);
  });

  stream.on("close", () => {
    mockedStream.validate();
    assert.end();
  });

  write(expected, stream);
});

test("duplex stream does not stop if undefined is written", assert => {
  const stream = duplexStream();
  let count = 0;

  stream.on("data", () => {
    count += 1;
  });

  stream.write(undefined);
  stream.write(undefined);

  assert.equal(count, 2);

  assert.end();
});

test("duplex stream does end before close", assert => {
  const stream = duplexStream();
  let ended = false;
  let closed = false;

  stream.on("end", () => {
    assert.ok(!closed);
    ended = true;
  });

  stream.on("close", () => {
    assert.ok(ended);
    closed = true;
  });

  stream.write(1);
  stream.write(2);
  stream.write(3);
  stream.end();
  assert.ok(ended);
  assert.ok(closed);
  assert.end();
});

test("duplex stream stays open if auto destroy is deactivated", assert => {
  const stream = duplexStream();
  let ended = false;
  let closed = false;

  stream.autoDestroy = false;

  stream.on("end", () => {
    assert.ok(!closed);
    ended = true;
  });

  stream.on("close", () => {
    assert.ok(ended);
    closed = true;
  });

  stream.write(1);
  stream.write(2);
  stream.write(3);
  stream.end();
  assert.ok(ended);
  assert.notOk(closed);
  stream.destroy();
  assert.ok(closed);
  assert.end();
});

test("duplex stream does end only once", assert => {
  const stream = duplexStream();
  let ended = false;

  stream.on("end", () => {
    assert.equal(ended, false);
    ended = true;
  });

  stream.queue(null);
  stream.queue(null);
  stream.queue(null);

  stream.resume();

  assert.end();
});

test("duplex stream does end only once on multiple end calls", assert => {
  const stream = duplexStream();
  let ended = false;

  assert.plan(1);

  stream.on("end", () => {
    assert.equal(ended, false);
    ended = true;
  });

  stream.end();
  stream.end();
});

test("duplex stream does buffering", assert => {
  const stream = duplexStream(
    data => stream.queue(data),
    () => stream.queue(null)
  );
  let ended = false;
  let actual = [];

  stream.on("data", actual.push.bind(actual));
  stream.on("end", () => {
    ended = true;
  });

  stream.write(1);
  stream.write(2);
  stream.write(3);
  assert.same(actual, [1, 2, 3]);
  stream.pause();
  stream.write(4);
  stream.write(5);
  stream.write(6);
  assert.same(actual, [1, 2, 3]);
  stream.resume();
  assert.same(actual, [1, 2, 3, 4, 5, 6]);
  stream.pause();
  stream.end();
  assert.ok(!ended);
  stream.resume();
  assert.ok(ended);
  assert.end();
});

test("duplex stream on buffering has data in queue when ends", assert => {
  const stream = duplexStream(
    data => stream.queue(data),
    () => stream.queue(null)
  );

  let ended = false;
  let actual = [];

  stream.on("data", actual.push.bind(actual));
  stream.on("end", () => {
    ended = true;
  });

  stream.pause();
  stream.write(1);
  stream.write(2);
  stream.write(3);
  stream.end();
  assert.same(actual, [], "no data written yet, still paused");
  assert.ok(!ended, "end not emitted yet, still paused");
  stream.resume();
  assert.same(actual, [1, 2, 3], "resumed, all data should be delivered");
  assert.ok(ended, "end should be emitted once all data was delivered");
  assert.end();
});

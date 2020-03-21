const Stream = require("stream");

function drain(buffer, stream) {
  while (buffer.length && !stream.paused) {
    const data = buffer.shift();

    if (data === null) {
      return stream.emit("end");
    }

    stream.emit("data", data);
  }
}

function exit(stream, end) {
  stream.writable = false;
  end.call(stream);

  if (!stream.readable && stream.autoDestroy) {
    stream.destroy();
  }
}

module.exports = function duplexStream(write, end, opts = {}) {
  const stream = new Stream();
  const buffer = [];
  let ended = false;
  let destroyed = false;
  let _ended = false;

  write = write || ((data) => stream.queue(data));
  end = end || (() => stream.queue(null));

  stream.writable = true;
  stream.readable = true;
  stream.paused = false;

  stream.autoDestroy = !opts.autoDestroy;

  stream.write = (data) => {
    write.call(stream, data);
    return !stream.paused;
  };

  stream.queue = stream.push = (data) => {
    if (_ended) {
      return stream;
    }

    if (data === null) {
      _ended = true;
    }

    buffer.push(data);
    drain(buffer, stream);

    return stream;
  };

  stream.on("end", () => {
    stream.readable = false;
    if (!stream.writable && stream.autoDestroy) {
      setImmediate(() => stream.destroy());
    }
  });

  stream.end = () => {
    if (ended) {
      return;
    }

    ended = true;

    exit(stream, end);

    return stream;
  };

  stream.destroy = () => {
    if (destroyed) {
      return;
    }

    destroyed = true;
    ended = true;
    buffer.length = 0;
    stream.readable = false;
    stream.writable = false;
    stream.emit("close");

    return stream;
  };

  stream.pause = () => {
    if (stream.paused) {
      return;
    }

    stream.paused = true;

    return stream;
  };

  stream.resume = () => {
    if (stream.paused) {
      stream.paused = false;
      stream.emit("resume");
    }

    drain(buffer, stream);

    if (!stream.paused) {
      stream.emit("drain");
    }

    return stream;
  };
  return stream;
};

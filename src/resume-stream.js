const duplexStream = require("./duplex-stream");

module.exports = function resumeStream(write, end) {
  const stream = duplexStream(write, end);
  const pause = stream.pause;
  const resume = stream.resume;
  let paused = false;

  stream.pause();

  stream.pause = () => {
    paused = true;
    return pause.call(stream);
  };

  stream.resume = () => {
    paused = false;
    return resume.call(stream);
  };

  setImmediate(() => {
    if (!paused) {
      stream.resume();
    }
  });

  return stream;
};

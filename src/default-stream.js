const fs = require("fs");

const duplexStream = require("./duplex-stream");

module.exports = () => {
  const stream = duplexStream(write, flush);
  let line = "";

  function flush() {
    if (fs.writeSync && /^win/.test(process.platform)) {
      try {
        fs.writeSync(1, `${line}\n`);
      } catch (exception) {
        stream.emit("error", exception);
      }
    } else {
      try {
        // eslint-disable-next-line no-console
        console.log(line);
      } catch (exception) {
        stream.emit("error", exception);
      }
    }
    line = "";
  }

  function write(buffer) {
    for (let i = 0; i < buffer.length; i += 1) {
      const character =
        typeof buffer === "string"
          ? buffer.charAt(i)
          : String.fromCharCode(buffer[i]);

      if (character === "\n") {
        flush();
      } else {
        line += character;
      }
    }
  }

  return stream;
};

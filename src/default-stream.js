const fs = require("fs");

const duplexStream = require("./duplex-stream");

module.exports = () => {
  const stream = duplexStream(write, flush);
  let line = "";

  function flush() {
    if (fs.writeSync && /^win/.test(process.platform)) {
      try {
        fs.writeSync(1, `${line}\n`);
      } catch (e) {
        stream.emit("error", e);
      }
    } else {
      try {
        console.log(line);
      } catch (e) {
        stream.emit("error", e);
      }
    }
    line = "";
  }

  function write(buf) {
    for (let i = 0; i < buf.length; i += 1) {
      const c =
        typeof buf === "string" ? buf.charAt(i) : String.fromCharCode(buf[i]);

      if (c === "\n") {
        flush();
      } else {
        line += c;
      }
    }
  }

  return stream;
};

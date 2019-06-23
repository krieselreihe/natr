const { inspect } = require("util");

const objectStartRegExp = /^{\s+/;
const objectEndRegExp = /\s}$/;

/**
 * Inspect object
 *
 * @param {object} obj
 * @returns {string}
 */
function inspectObject(obj) {
  const result = inspect(obj, {
    depth: 5,
    maxArrayLength: 10,
    compact: false,
    breakLength: 60
  });

  if (result.indexOf("\n") === -1) {
    return result;
  }

  const block = result
    .replace(objectStartRegExp, "")
    .replace(objectEndRegExp, "")
    .split("\n")
    .map(line => {
      return `      ${line.trim()}`;
    })
    .join("\n");

  return `{\n${block}\n    }`;
}

module.exports = inspectObject;

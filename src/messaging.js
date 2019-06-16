const NATR_MESSAGE_HASH = Date.now();
const NATR_MESSAGE = `__NATR_MESSAGE_${NATR_MESSAGE_HASH}__`;
const NATR_MESSAGE_REGEXP = new RegExp(`^${NATR_MESSAGE}`);

/**
 * Check if a string matches the pattern for internal messages
 *
 * @param {string} message
 * @returns {boolean}
 */
function isInternal(message) {
  return NATR_MESSAGE_REGEXP.test(message);
}

/**
 * Create internal message prefixed with a hash for identification
 *
 * @param {string} message
 * @returns {string}
 */
function createInternal(message) {
  return `${NATR_MESSAGE}${message}`;
}

/**
 * Remove the internal hash from a message
 *
 * @param {string} message
 * @returns {string}
 */
function cleanInternal(message) {
  return message.replace(NATR_MESSAGE_REGEXP, "");
}

const API_DESCRIPTION = createInternal(`{
      given: <string>,  // "a calculation"
      should: <string>, // "return the result"
      actual: <any>,    // 1 + 2
      expected: <any>   // 3
    }`);

module.exports = {
  isInternal,
  cleanInternal,
  API_DESCRIPTION
};

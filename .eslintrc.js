"use strict";

module.exports = {
  root: true,
  extends: ["eslint:recommended", "prettier"],
  // plugins: ["compat"],
  parserOptions: {
    ecmaVersion: 2018,
    impliedStrict: false
  },
  env: {
    node: true,
    es6: true
  },
  settings: {
    browsers: ["maintained node versions"]
  },
  rules: {
    // "compat/compat": "error"
  }
};

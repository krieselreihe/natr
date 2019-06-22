"use strict";

module.exports = {
  root: true,
  extends: ["eslint:recommended", "prettier", "plugin:react/recommended"],
  parserOptions: {
    ecmaVersion: 2018,
    impliedStrict: false,
    jsx: true
  },
  env: {
    node: true,
    es6: true
  },
  settings: {
    browsers: ["maintained node versions"],
    react: {
      version: "detect"
    }
  },
  rules: {
    "no-prototype-builtins": 0
  }
};

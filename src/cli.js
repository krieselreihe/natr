#!/usr/bin/env node

const glob = require("fast-glob");
const parseOpts = require("minimist");
const { resolve } = require("path");

const opts = parseOpts(process.argv.slice(2), {
  alias: { r: "require" },
  string: "require",
  default: { r: [] }
});

const cwd = process.cwd();

if (typeof opts.require === "string") {
  opts.require = [opts.require];
}

opts.require.forEach(module => {
  if (module) {
    require(require.resolve(module, {
      paths: [cwd]
    }));
  }
});

opts._.forEach(arg => {
  const files = glob.sync(arg).map(String);

  if (!Array.isArray(files)) {
    throw new TypeError(
      "unknown error: glob.sync did not return an array or throw. Please report this."
    );
  }

  files.forEach(file => require(resolve(cwd, file)));
});

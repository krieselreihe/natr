#!/usr/bin/env node

const glob = require("fast-glob");
const parseOpts = require("minimist");
const { resolve } = require("path");
const { unlinkSync } = require("fs");

const opts = parseOpts(process.argv.slice(2), {
  alias: { r: "require", u: "update-snapshot" },
  string: "require",
  boolean: "updateSnapshot",
  default: { r: [], u: false }
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

if (opts["updateSnapshot"]) {
  const snapshotFiles = glob.sync(`${process.cwd()}/**/*.snap`);

  snapshotFiles.forEach(unlinkSync);
}

opts._.forEach(arg => {
  const files = glob.sync(arg).map(String);

  if (!Array.isArray(files)) {
    throw new TypeError(
      "unknown error: glob.sync did not return an array or throw. Please report this."
    );
  }

  files.forEach(file => require(resolve(cwd, file)));
});

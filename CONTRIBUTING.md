# Contributing

You want to help get _natr_ on track? Nice! You are the best! 🥳

## Contents

- [Setup](#setup)
  - [Clone the repo](#clone-the-repo)
  - [Node version](#node-version)
  - [Package manager](#package-manager)
- [Common commands](#common-commands)
  - [Run tests](#run-tests)
  - [Format the code](#format-the-code)
- [Commit changes](#commit-changes)
- [Recommended workflow for release](#recommended-workflow-for-release)

---

## Setup

### Clone the repo

First you need to clone the repository somewhere on your local machine and switch to the created project directory.

```shell script
git clone git@github.com:krieselreihe/natr.git
cd natr
```

### Node version

To develop _natr_ you need at least a version 12 or higher of node. You can check this by running:

```shell script
$ node --version
v12.16.1
```

### Package manager

Next you need to ensure that you have a [pnpm](https://pnpm.js.org/) version installed larger than 4 (pnpm is a fast npm/yarn alternative). You can test this by running:

```shell script
$ pnpm --version
4.12.0
```

If you do not have pnpm installed or an old version of it, you can install or upgrade by running:

```shell script
curl -L https://unpkg.com/@pnpm/self-installer | node
```

### Install dependencies

To install all the necessary dependencies to develop _natr_ run:

```shell script
pnpm install
```

Now you're good to go 🎉

## Common commands

### Run tests

```shell script
# Run tests
pnpm test

# Show test coverage
pnpm run coverage

# Lint the application
pnpm run lint
```

### Format the code

To format the code use:

```shell script
pnpm run format
```

To check for formatting issues inside the code run:

```shell script
pnpm run format:check
```

## Commit changes

**This repo is is Commitizen-friendly!** ([read more][czcli])

Checkout a new branch, there is no naming convention for branches, only for commits. Add your changes and run `pnpx git-cz` to start the commitizen cli to create a proper commit message.

Push the changes with your feature branch and create a "Merge Request" on GitHub.

## Recommended workflow for release

1.  Make changes
2.  Commit those changes with `pnpx git-cz`
3.  Create a new release with `pnpm run release`
4.  Push your release `git push --follow-tags origin main`
5.  Publish: `NPM_CONFIG_OTP=XXXXXX pnpm publish` (replace `XXXXXX` with a valid 2FA token)
6.  **Done!**

For more information on building a release see [https://github.com/conventional-changelog/standard-version][sv]

[czcli]: http://commitizen.github.io/cz-cli/
[sv]: https://github.com/conventional-changelog/standard-version

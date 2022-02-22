# Serverless - amiblocked.io api

Serverless Framework template for zero-config TypeScript support.

## Features

Thanks to [`serverless-typescript`](https://github.com/prisma-labs/serverless-plugin-typescript) plugin:

- Zero-config: Works out of the box without the need to install any other compiler or plugins
- Supports ES2015 syntax + features (`export`, `import`, `async`, `await`, `Promise`, ...)
- Supports `sls package`, `sls deploy` and `sls deploy function`
- Supports `sls invoke local` + `--watch` mode


## Prerequisites

- [`serverless-framework`](https://github.com/serverless/serverless)
- [`node.js`](https://nodejs.org)

## Usage

run:

```
npm install
```

or:

```
yarn install
```

Then to run either

```
serverless deploy
```

or:

```
serverless offline
```

## Licence

MIT.

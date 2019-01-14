#!/bin/bash

export NODE_ENV=test
export TS_NODE_TRANSPILE_ONLY=true
export TS_NODE_FAST=true

./node_modules/mocha/bin/mocha $@ \
  --require ts-node/register \
  --watch-extensions ts,tsx \
  'code/src/**/*.{test,TEST}.ts{,x}'

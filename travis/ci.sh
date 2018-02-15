#!/usr/bin/env bash

pushd "$(dirname $0)/.."

npm run lint

popd

#!/usr/bin/env bash

set -eo pipefail

if [ -z "$TRAVIS_TAG" ]; then
  echo "Build is not a release, skipping CD" >&2; exit 0
fi

if [ -z "$DOCKER_USERNAME" ] || [ -z "$DOCKER_PASSWORD" ]; then
  echo "No docker credentials configured, unable to publish builds" >&2; exit 1
fi

pushd "$(dirname $0)/.."

docker_tag="$DOCKER_USERNAME/featureservice:$TRAVIS_TAG"

docker login --username="$DOCKER_USERNAME" --password="$DOCKER_PASSWORD"
docker build --tag "$docker_tag" .
docker push "$docker_tag"

popd

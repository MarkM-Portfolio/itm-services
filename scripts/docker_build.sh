#!/bin/bash

set -ex

BUILD_VERSION=`cat ./.version`
echo "BUILD_VERSION:${BUILD_VERSION}"
DOCKER_IMAGE=$JOB_NAME
DOCKER_IMAGE_TAG="${dockerRegistry}/${DOCKER_IMAGE}:${TIMESTAMP}"

DOCKER_TESTER_IMAGE="${DOCKER_IMAGE}-tester"
DOCKER_TESTER_IMAGE_TAG="${dockerRegistry}/${DOCKER_TESTER_IMAGE}:${TIMESTAMP}"

if [ -f "${dockerfile}" ]; then
  APP_IMAGE_ID=$(docker build --build-arg BUILD_VERSION=${BUILD_VERSION} -q --tag ${DOCKER_IMAGE_TAG} -f ${dockerfile} .)
fi

if [ -f "${dockerfiletester}" ]; then
  docker build --build-arg BUILD_VERSION=${BUILD_VERSION} -q --tag ${DOCKER_TESTER_IMAGE_TAG} -f ${dockerfiletester} .
fi

echo DOCKER_IMAGE=$DOCKER_IMAGE                       > .stage_docker
echo DOCKER_IMAGE_TAG=$DOCKER_IMAGE_TAG               >> .stage_docker
echo DOCKER_TESTER_IMAGE=$DOCKER_TESTER_IMAGE         >> .stage_docker
echo DOCKER_TESTER_IMAGE_TAG=$DOCKER_TESTER_IMAGE_TAG >> .stage_docker
echo APP_IMAGE_ID=$APP_IMAGE_ID                       >> .stage_docker

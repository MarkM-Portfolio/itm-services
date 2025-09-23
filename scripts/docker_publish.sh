#!/bin/bash

set -ex

source scripts/docker/docker_utils.sh
source .stage_docker
DOCKER_TESTED_IMAGE_TAG="${dockerRegistry}/${DOCKER_IMAGE}:latest"
DOCKER_TESTER_TESTED_IMAGE_TAG="${dockerRegistry}/${DOCKER_TESTER_IMAGE}:latest"

cleanup() {
    docker_cleanup_image ${DOCKER_TESTED_IMAGE_TAG}
    docker_cleanup_image ${DOCKER_IMAGE_TAG}
    docker_cleanup_image ${DOCKER_TESTER_TESTED_IMAGE_TAG}
    docker_cleanup_image ${DOCKER_TESTER_IMAGE_TAG}
    return 0
}

if [ $IS_FEATURE == false ]; then
    trap 'cleanup' EXIT

    if [ -n "$(docker images -q ${DOCKER_IMAGE_TAG})" ]; then
        docker push ${DOCKER_IMAGE_TAG}
        docker tag ${DOCKER_IMAGE_TAG} ${DOCKER_TESTED_IMAGE_TAG}
        docker push ${DOCKER_TESTED_IMAGE_TAG}
    fi

    if [ -n "$(docker images -q ${DOCKER_TESTER_IMAGE_TAG})" ]; then
        docker push ${DOCKER_TESTER_IMAGE_TAG}
        docker tag ${DOCKER_TESTER_IMAGE_TAG} ${DOCKER_TESTER_TESTED_IMAGE_TAG}
        docker push ${DOCKER_TESTER_TESTED_IMAGE_TAG}
    fi
fi

echo DOCKER_TESTED_IMAGE_TAG=$DOCKER_TESTED_IMAGE_TAG >> .stage_docker
echo DOCKER_TESTER_TESTED_IMAGE_TAG=$DOCKER_TESTER_TESTED_IMAGE_TAG >> .stage_docker

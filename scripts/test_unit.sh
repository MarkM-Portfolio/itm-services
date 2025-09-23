#!/bin/bash

set -ex

source scripts/docker/docker_utils.sh

cleanup() {
    docker_cleanup_container ${REDIS_CID}  # clean up redis
    docker_cleanup_container ${MONGO_CID}  # clean up mongodb
    return 0
}

trap 'cleanup' EXIT

MONGO_IMAGE='connections-docker.artifactory.cwp.pnp-hcl.com/base/mongo:latest'
REDIS_IMAGE='connections-docker.artifactory.cwp.pnp-hcl.com/middleware/redis:latest'
docker pull $MONGO_IMAGE
docker pull $REDIS_IMAGE

MONGO_CID=$(docker run -d -P --name mongo-used-in-itm-ut-${TIMESTAMP} ${MONGO_IMAGE})
MONGO_PORT=$(docker_get_host_port '27017/tcp' ${MONGO_CID})
echo "mongo container ID: ${MONGO_CID}; mongo listening port: ${MONGO_PORT}"

REDIS_CID=$(docker run -d -P -e MASTER="true" --name redis-used-in-itm-ut-${TIMESTAMP} ${REDIS_IMAGE})
REDIS_PORT=$(docker_get_host_port '6379/tcp' ${REDIS_CID})
REDIS_OPTIONS={\"host\":\"127.0.0.1\",\"port\":\"${REDIS_PORT}\"}
echo "redis container ID: ${REDIS_CID}; redis listening port: ${REDIS_PORT}; redis options: ${REDIS_OPTIONS}"

node_modules/.bin/cross-env DB_HOST='127.0.0.1' DB_PORT=${MONGO_PORT} REDIS_HOST='127.0.0.1' REDIS_PORT=${REDIS_PORT} REDIS_OPTIONS=${REDIS_OPTIONS} npm run test:unit

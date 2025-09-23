#!/bin/bash

set -ex

source scripts/docker/docker_utils.sh
source .stage_docker

cleanup() {
    # clean up
    docker_cleanup_container ${MONGO_CID}  # clean up mongo
    docker_cleanup_container ${REDIS_CID}  # clean up redis
    docker_cleanup_container ${APP_CID}    # clean up app
    return 0
}

trap 'cleanup' EXIT

MONGO_IMAGE='connections-docker.artifactory.cwp.pnp-hcl.com/base/mongo:latest'
REDIS_IMAGE='connections-docker.artifactory.cwp.pnp-hcl.com/middleware/redis:latest'
docker pull $MONGO_IMAGE
docker pull $REDIS_IMAGE

MONGO_CNAME=mongo-used-in-itm-api-test-$TIMESTAMP
MONGO_CID=$(docker run -d --name ${MONGO_CNAME} ${MONGO_IMAGE})

REDIS_CNAME=redis-used-in-itm-api-test-$TIMESTAMP
REDIS_CID=$(docker run -d -P -e MASTER="true" --name ${REDIS_CNAME} ${REDIS_IMAGE})
REDIS_PORT=$(docker_get_host_port '6379/tcp' ${REDIS_CID})
REDIS_OPTIONS_IN_CONTAINER={\"host\":\"redis\",\"port\":\"6379\"}
REDIS_OPTIONS_OUTSIDE_CONTAINER={\"host\":\"127.0.0.1\",\"port\":\"${REDIS_PORT}\"}
echo "redis container ID: ${REDIS_CID}; \
      redis listening port: ${REDIS_PORT}; \
      redis options in container: ${REDIS_OPTIONS_IN_CONTAINER}; \
      redis options outside container: ${REDIS_OPTIONS_OUTSIDE_CONTAINER}"

APP_CID=$(docker run -d -P -e NODE_ENV=development -e DB_HOST='mongo' -e DB_PORT='27017' -e REDIS_OPTIONS=${REDIS_OPTIONS_IN_CONTAINER} --link ${MONGO_CNAME}:mongo --link ${REDIS_CNAME}:redis --name ${JOB_NAME}-${TIMESTAMP} ${DOCKER_IMAGE_TAG})
APP_PORT=$(docker_get_host_port "3000/tcp" ${APP_CID})

echo "mongo container ID: ${MONGO_CID}"
echo "app container ID: ${APP_CID}"
echo "app port: ${APP_PORT}"

[ -f $buildNpmrcPath ] && cp $buildNpmrcPath .npmrc

npm ci

sleep 10
docker logs ${APP_CID}
node_modules/.bin/cross-env REDIS_OPTIONS=${REDIS_OPTIONS_OUTSIDE_CONTAINER} npm run test:api --server_port=${APP_PORT}

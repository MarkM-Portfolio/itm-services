[![Build Status](https://jenkins.cwp.pnp-hcl.com/cnx/buildStatus/icon?job=Core%2FPink%2FConnections%2Fitm-services%2Fdevelop)](https://jenkins.cwp.pnp-hcl.com/cnx/job/Core/job/Pink/job/Connections/job/itm-services/job/develop/)

# HCL Connections Important To Me (ITM) Services

ITM services is a repository that runs and contains a list of Important To Me (ITM) services and APIs using the LoopBack framework. LoopBack is an open-source Node.js framework for building RESTful APIs. ITM Services also includes documentation and sample code to help developers integrate these services.

### Environment parameters:

| Parameters   | default            | Description                                                                     |
| ------------ | ------------------ | ------------------------------------------------------------------------------- |
| REDIS_HOST   | 127.0.0.1          | the host name of redis server. e.g. 127.0.0.1, kubernetes.swg.usma.ibm.com      |
| REDIS_PORT   | 6379               | the port number of redis server. e.g. 6379, 30018                               |
| SYNC_CHANNEL | connections.events | the channel name used to subscribe/publish connections events                   |
| SYNC_TTL     | 24                 | The expired interval that the item to sync the data, valide range [2,720] hours |
| DB_HOST      | 127.0.0.1          | the host name of mongo db                                                       |
| DB_PORT      | 27017              | the port number of mongo db                                                     |
| DB_USER      | none               | the authentication user name of mongo db                                        |
| DB_PASSWORD  | none               | the authentication password of mongo db                                         |

## Getting started

To execute any local testing, you must be running redis and mongo db. It is recommended to
run these in a docker container as described below.

Export these variables:

`export DB_HOST=127.0.0.1`<br/>
`export DB_PORT=27017`<br/>
`export REDIS_PORT=6379`<br/>
`export REDIS_HOST=127.0.0.1`<br/>

### Local Redis

To start a Redis container with the latest version of the Redis image using the specified connections docker repository URL, run the below command:

`docker run -d -p 6379:6379 -e MASTER="true" --name redis-used-in-itm-test connections-docker.artifactory.cwp.pnp-hcl.com/middleware/redis:latest`

### Local Mongo

To start a new MongoDB container based on the latest version of the MongoDB image from the specified Docker repository URL, run the below command:

`docker run -d -p 27017:27017 --name mongo-used-in-itm-test connections-docker.artifactory.cwp.pnp-hcl.com/base/mongo:latest`

### How to set environment parameters before executing npm scripts

1. Set mongo db parameter

   Option 1 : Use a mongo db server, execute below command. Replace the 'mongo-db-host', 'mongo-db-port' with the mongo db server's host and port.

   `export DB_HOST='mongo-db-host' DB_PORT='mongo-db-port'`

   Option 2 : Use a local mongo db server, host & port as 127.0.0.1 & 27017 respectively. DB_HOST and DB_PORT would not necessary to be set.

   Option 3 : Use a mongo db in memory, execute below command:

   `npm run %scripts% --db=memory`

   **Notes**:
   If using Option 1 or Option 2, after running any test cases that generate data in the database, the database should be cleared. Otherwise, the presence of dirty data could impact the results of later tests. For instructions on how to clear the database, please refer to the step labeled 'Clear Mongo DB.'

   In Option 3, clearing the database is not necessary, as a new database is generated in memory each time. However, when running unit tests in Option 3's memory mode, the code coverage may be lower.

2. Set redis server parameter

   Option1 : Specify the redis server. execute below command:

   `export REDIS_HOST='redis-host' REDIS_PORT='redis-port'`

   Option2: Set local redis server with host & port as 127.0.0.1 && 6379 respectively. REDIS_HOST and REDIS_PORT would not necessary to be set.

   **Notes:**

   1. If not give REDIS_HOST & REDIS_PORT, default 127.0.0.1 & 6379.
   2. At the same time, on redis server should better be used for one client.

   `e.g` If the Redis server used to start the ITM service app server is the same server used to run unit tests, it is better to stop the app server first. Otherwise, some of the unit test cases may fail. If one Redis server is subject to a mail group subscribed to by more than one client, the events will be sent to one of them. This means that some events will be lost for UT, causing some data synchronization test cases to fail.

## Building ITM Services

This repo requires you to have npm and node installed. It is recommended to download a stable version to avoid deprecation or any conflict it dependencies. To start building, follow the below steps:

1.  Run `npm ci`

    `npm ci` is a command in the Node Package Manager (NPM) that is used to install a project's dependencies based on the contents of its package-lock.json file. The ci stands for "clean install".

    Unlike npm install, which also installs the latest versions of dependencies that may have changed since the last install, npm ci only installs the exact versions listed in the lockfile, ensuring a consistent and reproducible build environment.

2.  Build by executing this command `npm run build`

    The purpose of this command is to build or compile the project's source code into a distribution or production-ready format.

    After the command has completed and it's a success, it will not show any SUCCESS message, but it will show you the list of files and it's corresponding compiled version inside lib directory.

    A log containing the word error indicate the build failed and some changes are required.

## Start Server

**Run in dev mode**

Start server in dev mode, execute the command below. You can select mongo db server if you have, or select db in memory mode. For the difference of each mode you can refer to **How to set environment parameter when execute npm scrips.** at the top.

mongo db server mode:

    `export DB_HOST='mongo-db-host' DB_PORT='mongo-db-port' `
    `export REDIS_HOST='redis-host' REDIS_PORT='redis-port'`
    `npm run start:dev`

    e.g
    `export DB_HOST='9.111.97.46' DB_PORT='27017' `
    `export REDIS_HOST='9.111.97.46' REDIS_PORT='6379'`
    `npm run start:dev`

local mongo db and local redis server:

    `npm run start:dev`

mongo db in memory mode:

    `export REDIS_HOST='redis-host' REDIS_PORT='redis-port'`
    `npm run start:dev --db=memory`

    e.g
    `export REDIS_HOST='9.111.97.46' REDIS_PORT='6379'`
    `npm run start:dev --db=memory`

Site would be launched at http://localhost:3000/
Browse this repository's REST API's at http://localhost:3000/itm/explorer

**Note**: /itm/explorer is disabled by default.  To enable, edit the file `src/config/component-config.json` and add the mountPath as follows:

```json
"loopback-component-explorer": {
  "mountPath": "/itm/explorer"
}
```

**Run in production mode**

In production mode, The itm-services is provided in docker image which is deployed from yaml file (development/kubernates/development.yaml) For details, please refer (development/kubernates/README.md)

## Testing

### Unit testing

Unit tests are written in Jasmine testing framework. It can be found at `/tests/unit.specs.js`.
For more detailed test cases, you can find it at `/tests/specs`.
Additionally, code coverage testing will be performed using Istanbul.
The unit tests do not rely on the ITM service server. In fact, using the same Redis server at the same time may cause conflicts.
So before run unit test, stop the your app server first.

For more details/reason refer to **How to set environment parameters before executing npm scripts.** for the redis server part.

mongo db server mode :

    `export DB_HOST='mongo-db-host' DB_PORT='mongo-db-port' `
    `export REDIS_HOST='redis-host' REDIS_PORT='redis-port'`
    `npm run test:unit`

local mongo db and local redis server:

    `npm run test:unit`

mongo db in meory mode:

    `export REDIS_HOST='redis-host REDIS_PORT='redis-port'`
    `npm run test:unit --db=memory`

2. Review tests/reports/unit for UT reports
3. Review tests/reports/coverage for Istanbul coverage reports

### API testing

API tests are located at `/tests/api.specs.js`. For more detailed test cases, you can find it at `/tests/specs`.
Super test will send HTTP request to run api tests

1. Build the project `npm run build`. Refer to **Building** section for more info.
2. Start the itm service server if it has not. Refer **Run in dev mode**.
3. From the root dir of the project execute `npm run test:api`.
4. Review `tests/reports/api` for reports.

### Static Analysis (ESlint)

All projects are covered with eslint rules to ess standard in eslint-config-ess (based on AirBNB) https://github.ibm.com/ess/javascript-guide
It is advised to run eslinter in your IDE as you develop - as all code will be linted on the CI pipeline

Execute ESlint checking by running `npm run check:lint:fix`
ESLint can fix some issues automatically.

### Clear Mongo DB

This should be executed if you run in a mongo server after each time you execute tests but not needed in db memory mode.

    `mongo`           // run mongo at command line within the container
    `use ITM`  // to switch to Activities db
    `show collections` // This step optional, just to check if the collections profile, Lastestentrydata exists
    `db.profiles.find()` // to browse profiles data
    `db.profiles.drop()` // to clean up profiles data
    `db.Latestentrydata.find()` // to browse Latestentrydata data
    `db.Latestentrydata.drop()` // to clean up Latestentrydata data
    `exit`            // exit mongo client

### Run all tests all-in-one.

Use below scripts to run unit test/code coverage/static analysis/api test all in one.
Note: It would connect mongo db with default 127.0.0.1 & 27017 and redis as default 127.0.0.1 & 6379. After each time execute test, mongo db should be cleared as recommendation above.

1. `npm install`
2. `npm run test`

If it successfully executed, it will show:

`[PM2] Spawning PM2 daemon with pm2_home=/Users/user.name/.pm2`
`[PM2] PM2 Successfully daemonized`
`[PM2] [v] Modules Stopped`
`[PM2][WARN] No process found`
`[PM2] [v] All Applications Stopped`
`[PM2] [v] PM2 Daemon Stopped`

If there's an error occured, you will see a statement similar below:

npm ERR! code ELIFECYCLE
npm ERR! errno 1
npm ERR! itm-services@0.0.6 test:unit: `cross-env TEST_SUITE=unit babel-node ./node_modules/istanbul/lib/cli.js --config=tests/istanbul.yml cover tests/jasmine-runner.js && istanbul --config=tests/istanbul.yml report cobertura`
npm ERR! Exit status 1
npm ERR!
npm ERR! Failed at the itm-services@0.0.6 test:unit script.
npm ERR! This is probably not a problem with npm. There is likely additional logging output above.

npm ERR! A complete log of this run can be found in:
npm ERR! /Users/user.name/.npm/\_logs/2023-02-22T14_16_08_117Z-debug.log

## Troubleshooting

When you encounter a dependency problem, you may consider doing the following:

1. Identify the problematic dependencies: Use the error messages or warning messages to identify which dependencies are causing the issue. Check the console output, package.json file, and npm logs to get more information.
2. Check for version compatibility: you may need to update the version of npm or node that you are currently using.
3. Remove and reinstall dependencies: If updating the dependencies does not work, you can try removing the problematic dependencies and then reinstalling them.
4. Clear the cache: If the above steps do not work, you can try clearing the package manager cache. Use the command "npm cache clean --force" to clear the cache, and then reinstall the dependencies.

When you encounter an error after executing unit test or `npm run test:unit`, you may consider doing the following:

1. Identify the cause of the failure: Look at the error message to determine what went wrong. Sometimes the error message can be very specific, while other times it may be more general.
2. Update the test code: Once you have identified the cause of the failure, you may need to update the test code to fix the issue. This could involve updating the expected results, changing the input values, or modifying the test assertions.
3. Check dependencies: If the test failure is caused by a dependency, you may need to update or install the necessary packages.
4. Check the environment: Sometimes test failures can be caused by issues with the testing environment. Make sure that you have all the necessary tools installed and configured correctly.
5. Re-run the tests: Once you have made the necessary updates, re-run the tests to verify that the issue has been resolved.

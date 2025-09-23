/* Copyright IBM Corp. 2017  All Rights Reserved.                    */

import { getMemoryDSConfig, getMongoDSConfig } from 'src/config/itm-config';
import { loggerFactory } from '@connections/utils-logger';

const logger = loggerFactory({ level: process.env.LOG_LEVEL || 'info' });

module.exports = (() => {
  const serverPort = process.env.npm_config_server_port || '3000';
  process.env.DEFAULT_ORG = process.env.DEFAULT_ORG || 'a';
  process.env.JWT_SECRET = 'Some_JWT_Secret';
  process.env.JWT_EXPIRES_IN_MINUTES = 10;
  process.env.JWT_NAME = 'JWT';
  process.env.CONNECTIONS_AUTH_TOKEN_NAME = '{ "cookie": "LtpaToken2", "headers": "" }';
  process.env.CONNECTIONS_URL = 'http://fakeconnections.ibm.com/connections';
  process.env.CONNECTIONS_HOMEPAGE_URL = 'http://fakeconnections.ibm.com/homepage';
  process.env.CONNECTIONS_PROFILES_URL = `http://127.0.0.1:${serverPort}/profiles`;
  process.env.PEOPLE_PROFILE_URL = process.env.PEOPLE_PROFILE_URL || 'http://127.0.0.1:3000/people/api/profile';

  process.env.DB_HOST = process.env.DB_HOST || '127.0.0.1';
  process.env.DB_PORT = process.env.DB_PORT || '27017';

  const dsConfig = {};
  if (process.env.npm_config_db === 'memory') {
    dsConfig.itmDb = getMemoryDSConfig();
  } else {
    if (process.env.npm_config_db === 'mongo-team') {
      process.env.DB_HOST = '9.111.96.41';
    }
    dsConfig.itmDb = getMongoDSConfig();
  }

  logger.info({ method: 'getMongoDSConfig',
    dbName: dsConfig.itmDb.name,
    dbConnector: dsConfig.itmDb.connector,
    dbUrl: dsConfig.itmDb.url });

  return dsConfig;
})();

/* Copyright IBM Corp. 2017  All Rights Reserved.                    */

import { getMongoDSConfig } from 'src/config/itm-config';
import { loggerFactory } from '@connections/utils-logger';

const logger = loggerFactory({ level: process.env.LOG_LEVEL || 'info' });

module.exports = (() => {
  process.env.DEFAULT_ORG = process.env.DEFAULT_ORG || 'a';

  if (!process.env.CONNECTIONS_PROFILES_URL) {
    throw new Error('Failed to start server, ensure CONNECTIONS_PROFILES_URL is set.');
  }

  process.env.PEOPLE_PROFILE_URL = process.env.PEOPLE_PROFILE_URL || 'http://people-idmapping:3000/people/api/profile';
  if (!process.env.PEOPLE_PROFILE_URL) {
    throw new Error('Failed to start server, ensure PEOPLE_PROFILE_URL is set.');
  }

  const dsConfig = {
    itmDb: getMongoDSConfig(),
  };

  logger.info({ method: 'getMongoDSConfig',
    dbName: dsConfig.itmDb.name,
    dbConnector: dsConfig.itmDb.connector,
    dbUrl: dsConfig.itmDb.url });

  return dsConfig;
})();

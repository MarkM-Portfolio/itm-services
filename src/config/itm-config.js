/* *************************************************************** */
/*                                                                 */
/* HCL Confidential                                                */
/*                                                                 */
/* OCO Source Materials                                            */
/*                                                                 */
/* Copyright HCL Technologies Limited 2017, 2020                   */
/*                                                                 */
/* The source code for this program is not published or otherwise  */
/* divested of its trade secrets, irrespective of what has been    */
/* deposited with the U.S. Copyright Office.                       */
/*                                                                 */
/* *************************************************************** */

import fs from 'fs';
import _ from 'lodash';
import { redis } from '@connections/utils-pubsub';
import c from 'src/utils/constant-def';
import { loggerFactory } from '@connections/utils-logger';

const logger = loggerFactory({ level: process.env.LOG_LEVEL || 'info' });

const baseMongoVolume = '/etc/mongodb/x509';
const baseRedisVolume = '/etc/redis/redis-secret';

function setRedisSecret(options) {
  if (process.env.REDIS_AUTH_ENABLED &&
      process.env.REDIS_AUTH_ENABLED.toLowerCase() === 'true') {
    if (process.env.REDIS_SECRET) {
      options.password = process.env.REDIS_SECRET;
    }
    try {
      const secret = fs.readFileSync(`${baseRedisVolume}/secret`, 'utf8');
      if (secret) {
        options.password = secret;
      }
    } catch (e) {
      // continue without error handling
    }
  }
}

export function isMongoX509Enabled() {
  let isEnabled = false;
  try {
    const x509Activated = fs.readFileSync(`${baseMongoVolume}/mongo-x509-auth-enabled`, 'utf8');
    logger.debug('x509Activated = ', x509Activated);
    if (x509Activated && x509Activated.toLowerCase().trim() === 'true') {
      isEnabled = true;
    } else if (x509Activated && x509Activated.toLowerCase().trim() === 'false') {
      isEnabled = false;
    }
  } catch (e) {
    // continue without error handling
  }
  return isEnabled;
}

export function getMemoryDSConfig(DSName = 'itmDb') {
  const dsConfig = {
    name: DSName,
    connector: 'memory',
  };

  logger.info('getMemoryDSConfig, dsConfig = ', dsConfig);
  return dsConfig;
}

/**
 * related Environment variables:
 *
 * (process.env.DB_HOST && process.env.DB_PORT) || process.env.MONGO_RS_MEMBERS_HOSTS
 * process.env.MONGO_RS_NAME
 * process.env.DB_USER
 * process.env.DB_PASSWORD
 * process.env.MONGO_X509_AUTH_ENABLED
 *
 */
export function getMongoDSConfig(DSName = 'itmDb') {
  const DBName = 'ITM';

  if ((!process.env.MONGO_RS_MEMBERS_HOSTS) &&
      (!process.env.DB_HOST || !process.env.DB_PORT)) {
    throw new Error('Failed to start server, ensure either (DB_HOST, DB_PORT) or MONGO_RS_MEMBERS_HOSTS are set.');
  }

  let dbHosts = `${process.env.DB_HOST}:${process.env.DB_PORT}`;
  if (process.env.MONGO_RS_MEMBERS_HOSTS) {
    dbHosts = process.env.MONGO_RS_MEMBERS_HOSTS;
  }

  let dbReplicaSet = '';
  if (process.env.MONGO_RS_NAME) {
    dbReplicaSet = `replicaSet=${process.env.MONGO_RS_NAME}&`;
  }

  let urlUserPWD = '';
  if (process.env.DB_USER && process.env.DB_PASSWORD) {
    urlUserPWD = `${process.env.DB_USER}:${process.env.DB_PASSWORD}@`;
  }

  const dsConfig = {
    name: DSName,
    connector: 'mongodb',
    connectionTimeout: c.DB_CONNECTION_TIMEOUT,
    reconnect: c.DB_RECONNECT,
    reconnectInterval: c.DB_RECONNECT_INTERVAL,
    reconnectTries: c.DB_RECONNECT_TRIES,
  };

  const itmDBUrl = `mongodb://${urlUserPWD}${dbHosts}/${DBName}?${dbReplicaSet}readPreference=secondaryPreferred&w=1&wtimeoutMS=2000`;
  if (isMongoX509Enabled()) {
    try {
      const cert = fs.readFileSync('/opt/app/ca/user_itm.pem', 'utf8');
      const key = fs.readFileSync('/opt/app/ca/user_itm.pem', 'utf8');
      const userSubject = encodeURIComponent('C=IE,ST=Ireland,L=Dublin,O=IBM,OU=Connections-Middleware-Clients,CN=itm,emailAddress=itm@mongodb');
      dsConfig.url = `mongodb://${userSubject}@${dbHosts}/${DBName}?${dbReplicaSet}readPreference=secondaryPreferred&authMechanism=MONGODB-X509&ssl=true&wtimeoutMS=2000`;
      dsConfig.sslKey = key;
      dsConfig.sslCert = cert;
      dsConfig.sslValidate = false;
    } catch (e) {
      logger.error('build x509 connection failed!', e);
      dsConfig.url = itmDBUrl;
    }
  } else {
    dsConfig.url = itmDBUrl;
  }

  logger.info({ method: 'getMongoDSConfig',
    dbName: dsConfig.name,
    dbConnector: dsConfig.connector,
    dbUrl: dsConfig.url });

  return dsConfig;
}

/*= ========== init phase ==========*/

const conf = {
  redis: {
    host: '127.0.0.1',
    port: 6379,
    retryStrategy(times) {
      setRedisSecret(this);
      const delay = Math.min(times * 500, 30000);
      if (times > 10) {
        logger.silly(`redis.retryStrategy(), times = ${times}, delay = ${delay}, options = `, this);
      }
      return delay;
    },
  },
  datasync: {
    ttl: 86400000, // 24 hours
  },
  maximum_allowed_visible_entries: 35,
};

/*= ========= post phase ==========*/

if (process.env.REDIS_HOST) {
  conf.redis.host = process.env.REDIS_HOST;
}

if (process.env.REDIS_PORT) {
  const redisPort = parseInt(process.env.REDIS_PORT, 10);
  if (redisPort) {
    conf.redis.port = redisPort;
  }
}

setRedisSecret(conf.redis);

if (process.env.SYNC_TTL) {
  const dataSyncTTL = parseInt(process.env.SYNC_TTL, 10);
  if (dataSyncTTL
      && dataSyncTTL >= c.DATASYNC_MIN_TTL_HOURS
      && dataSyncTTL <= c.DATASYNC_MAX_TTL_HOURS) {
    conf.datasync.ttl = dataSyncTTL * 3600000;
  }
}

conf.redis = redis.composeArgs({ redis: conf.redis });

logger.debug(`conf.redis: ${JSON.stringify(_.omit(conf.redis, ['password']))}`);
logger.debug(`dataSync: {connections.event.list: ${c.CONNECTIONS_EVENTS_SUBSCRIPTION_LIST}, ttl: ${conf.datasync.ttl}}`);

export default conf;

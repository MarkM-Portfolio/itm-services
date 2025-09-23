/* Copyright IBM Corp. 2017  All Rights Reserved.                    */

import events from 'events';
import { EVENTS } from 'src/utils/connections-events';
import modelUtil from 'src/utils/model-utils';
import c from 'src/utils/constant-def';
import { loggerFactory } from '@connections/utils-logger';

const logger = loggerFactory({ level: process.env.LOG_LEVEL || 'info' });

const eventTracker = new events.EventEmitter();
const eventDefaultCb = EVENTS.cb;
EVENTS.cb = (err, ...args) => {
  logger.silly('Synchronization events received from Connections');
  eventTracker.emit('sync.event.received', err ? 'fail' : 'success');
  eventDefaultCb(err, ...args);
};

const msgGroup = 'itm.test';
const msgQName = `${c.CONNECTIONS_EVENTS_CHANNEL}.${msgGroup}`;
const redisClient = modelUtil.makeRedisClient();

module.exports = {
  publishConnectionsEvent(event) {
    let eventMessage = event;
    let promise = null;
    if (event) {
      if (typeof event !== 'string') {
        eventMessage = JSON.stringify(event);
      }
      promise = new Promise((resolve) => {
        eventTracker.once('sync.event.received', (...args) => {
          logger.info('Recieved test response: ', args);
          resolve();
        });
      });
    } else {
      promise = Promise.resolve('ok');
    }
    logger.info('lpush message to redist list: ', c.CONNECTIONS_EVENTS_SUBSCRIPTION_LIST, eventMessage);
    redisClient.lpush(c.CONNECTIONS_EVENTS_SUBSCRIPTION_LIST, eventMessage);
    return promise;
  },

  setITMEventsMessageGroup() {
    return redisClient.hset(c.CONNECTIONS_EVENTS_SUBSCRIPTIONS_HASH, msgGroup, '');
  },

  cleanITMEventsMessageQueue() {
    return redisClient.del(msgQName);
  },

  listenITMEvent() {
    return new Promise((resolve) => {
      redisClient.blpop(msgQName, 60).then(message => resolve(message));
    });
  },

};

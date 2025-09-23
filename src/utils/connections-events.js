/* Copyright IBM Corp. 2017  All Rights Reserved.                    */

import gk from '@connections/utils-gatekeeper';
import modelUtil from 'src/utils/model-utils';
import c from 'src/utils/constant-def';
import { loggerFactory } from '@connections/utils-logger';

const logger = loggerFactory({ level: process.env.LOG_LEVEL || 'info' });

export const EVENTS = {
  cb: (err) => {
    // default callback does nothing
    if (err) {
      logger.error({ method: 'cb', msg: 'Sync event handled with error', errMsg: err.message });
    }
  },
};

export default function enableConnectionsEvents(app) {
  const connectionsSub = modelUtil.makeRedisClient('itm-events-sub');
  const Latestentrydata = app.models.Latestentrydata;
  const Profile = app.models.Profile;
  const handleEvent = EVENTS.handleEvent = (err, message) => {
    connectionsSub.blpop(c.CONNECTIONS_EVENTS_SUBSCRIPTION_LIST,
      c.REDIS_BRPOP_TIMEOUT,
      handleEvent);
    const cb = EVENTS.cb;
    if (!err && message && message.length > 1) {
      try {
        const event = JSON.parse(message[1].replace(/[\r\n]/g, '').replace(/\\'/g, ''));
        switch (event.name) {
          case c.EVENTS.COMMUNITY_UPDATED:
          case c.EVENTS.COMMUNITY_DELETED:
          case c.EVENTS.COMMUNITY_RESTORED:
            Latestentrydata.handleSyncEvent(event, cb);
            break;
          case c.EVENTS.COMMUNITY_MEMBERSHIP_ADDED:
          case c.EVENTS.COMMUNITY_MEMBERSHIP_REMOVE:
            if (gk.get('communities-acl-sync')) {
              Profile.handleSyncEvent(event, cb);
            } else {
              logger.trace({ method: 'handleEvent', message: 'communities-acl-sync is disabled' });
              cb();
            }
            break;
          default:
            cb();
        }
      } catch (e) {
        logger.error({ method: 'handleEvent', msg: 'catch error', errMsg: e.message });
        cb(e, message);
      }
    } else {
      logger.trace({ method: 'handleEvent', msg: 'Handle return error', err });
      cb(err, message);
    }
  };
  connectionsSub.hset(c.CONNECTIONS_EVENTS_SUBSCRIPTIONS_HASH,
    c.CONNECTIONS_EVENTS_SUBSCRIPTIONS_REG_NAME,
    '');
  connectionsSub.blpop(c.CONNECTIONS_EVENTS_SUBSCRIPTION_LIST,
    c.REDIS_BRPOP_TIMEOUT,
    handleEvent);
}

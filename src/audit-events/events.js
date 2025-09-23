/* Copyright IBM Corp. 2017  All Rights Reserved.                    */

import uuidV4 from 'uuid/v4';
import _ from 'lodash';
import modelUtil from 'src/utils/model-utils';
import eventTemplate from 'src/audit-events/template.json';
import c from 'src/utils/constant-def';
import { loggerFactory } from '@connections/utils-logger';

const logger = loggerFactory({ level: process.env.LOG_LEVEL || 'info' });

const constructEvent = Symbol('constructEvent');
const doPublish = Symbol('doPublish');

export default class AuditEvent {
  constructor(user, entry, operation) {
    this.user = user;
    this.entry = entry;
    this.operation = operation;
  }

  static get REDIS_CLIENT() {
    if (!AuditEvent.redisClient) {
      logger.silly('REDIS_CLIENT modelUtil.makeRedisClient()');
      AuditEvent.redisClient = modelUtil.makeRedisClient('itm-events-pub');
    }
    return AuditEvent.redisClient;
  }

  static get CREATE() {
    return {
      name: 'itm.entry.create',
      type: 'CREATE',
    };
  }

  static get UPDATE() {
    return {
      name: 'itm.entry.update',
      type: 'UPDATE',
    };
  }

  static get DELETE() {
    return {
      name: 'itm.entry.delete',
      type: 'DELETE',
    };
  }

  static publish(user, entry, action) {
    if (!entry.metadata || !entry.metadata.hidden) {
      process.nextTick(() => (new AuditEvent(user, entry, action))[doPublish]());
    }
  }

  [doPublish]() {
    const event = this[constructEvent]();
    AuditEvent.REDIS_CLIENT.hkeys(c.CONNECTIONS_EVENTS_SUBSCRIPTIONS_HASH).then((msgGNames) => {
      msgGNames.filter(msgGName => msgGName !== c.CONNECTIONS_EVENTS_SUBSCRIPTIONS_REG_NAME)
        .forEach((msgGName) => {
          const msgQName = `${c.CONNECTIONS_EVENTS_CHANNEL}.${msgGName}`;
          AuditEvent.REDIS_CLIENT.lpush(msgQName, JSON.stringify(event))
          .then(() => logger.debug({ method: 'doPublish', message: `produce event to ${msgQName}, event = `, event }))
          .catch(err => logger.error({ method: 'doPublish', errMsg: `lpush failed, ${err.message}`, errStack: err.stack }));
        });
      return null;
    }).catch(err => logger.error({ method: 'doPublish', errMsg: `hkeys failed, ${err.message}`, errStack: err.stack }));
  }

  [constructEvent]() {
    /* eslint-disable no-underscore-dangle */
    const userKeyId = this.user.key._id;
    /* eslint-enable no-underscore-dangle */
    const rawEvent = _.cloneDeep(eventTemplate);
    rawEvent.id = uuidV4();
    rawEvent.name = this.operation.name;
    rawEvent.type = this.operation.type;
    rawEvent.startTime = String((new Date()).getTime());
    rawEvent.actor.id = userKeyId;
    rawEvent.actor.name = this.user.name;
    rawEvent.actor.email = this.user.emails;
    rawEvent.object.id = this.entry.id;
    rawEvent.object.name = this.entry.name;
    rawEvent.object.type = this.entry.type;
    rawEvent.object.attributedTo[0].id = userKeyId;
    rawEvent.origin.id = userKeyId;
    rawEvent.origin.name = this.user.name;
    rawEvent.origin.organization.id = this.user.key.orgId;
    return rawEvent;
  }
}

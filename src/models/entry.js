/* Copyright IBM Corp. 2017  All Rights Reserved.                    */

import c from 'src/utils/constant-def';
import modelUtils from 'src/utils/model-utils';
import conf from 'src/config/itm-config';
import { loggerFactory } from '@connections/utils-logger';

const logger = loggerFactory({ level: process.env.LOG_LEVEL || 'info' });

function validateTags(err) {
  const json = JSON.stringify(this.tags);
  logger.silly(`entry.validateTags(), json.length = ${json.length}`);
  if (json.length > c.TAGS_MAX_LENGTH) {
    err();
  }
}

module.exports = (Entry) => {
  // Model validations
  modelUtils.overridePresence(Entry);

  Entry.validate('tags',
    validateTags,
    { message: ['msg_itm_object_too_long', c.TAGS_MAX_LENGTH] });

  Entry.validatesPresenceOf('name', 'type', 'image', {
    message: 'msg_itm_cannot_be_blank',
  });
  Entry.validatesLengthOf('id', {
    min: c.ID_MIN_LENGTH,
    max: c.ID_MAX_LENGTH,
    message: {
      null: 'msg_itm_cannot_null',
      blank: 'msg_itm_cannot_be_blank',
      min: ['msg_itm_property_too_short', c.ID_MIN_LENGTH],
      max: ['msg_itm_property_too_long', c.ID_MAX_LENGTH],
    },
  });
  Entry.validatesLengthOf('name', {
    min: c.NAME_MIN_LENGTH,
    max: c.NAME_MAX_LENGTH,
    message: {
      null: 'msg_itm_cannot_null',
      blank: 'msg_itm_cannot_be_blank',
      min: ['msg_itm_property_too_short', c.NAME_MIN_LENGTH],
      max: ['msg_itm_property_too_long', c.NAME_MAX_LENGTH],
    },
  });
  Entry.validatesLengthOf('type', {
    min: c.TYPE_MIN_LENGTH,
    max: c.TYPE_MAX_LENGTH,
    message: {
      null: 'msg_itm_cannot_null',
      blank: 'msg_itm_cannot_be_blank',
      min: ['msg_itm_property_too_short', c.TYPE_MIN_LENGTH],
      max: ['msg_itm_property_too_long', c.TYPE_MAX_LENGTH],
    },
  });

  Entry.prototype.isExpired = function isExpired() {
    const now = new Date();
    return (this.synced.getTime() + conf.datasync.ttl) < now.getTime();
  };
};

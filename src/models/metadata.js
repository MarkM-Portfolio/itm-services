/* Copyright IBM Corp. 2017  All Rights Reserved.                    */

import c from 'src/utils/constant-def';
import { loggerFactory } from '@connections/utils-logger';

const logger = loggerFactory({ level: process.env.LOG_LEVEL || 'info' });

function validateMetadata(err) {
  const json = JSON.stringify(this.toJSON());
  logger.silly(`metadata.validateMetadata(), json.length = ${json.length}`);
  if (json.length > c.METADATA_MAX_LENGTH) {
    err();
  }
}

module.exports = (Metadata) => {
  Metadata.validate('metadata',
      validateMetadata,
      { message: ['msg_itm_object_too_long', c.METADATA_MAX_LENGTH] });
};

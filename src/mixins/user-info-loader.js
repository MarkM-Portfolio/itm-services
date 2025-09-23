/* Copyright IBM Corp. 2017  All Rights Reserved.                    */

import _ from 'lodash';
import { ApplicationError } from 'src/utils/errors';
import { loggerFactory } from '@connections/utils-logger';

const logger = loggerFactory({ level: process.env.LOG_LEVEL || 'info' });

module.exports = (Model) => {
  ['addEntry', 'addOrUpdateEntry'].forEach((method) => {
    const self = this;
    const oldMethod = Model[method];

    Model[method] = (user, source, target, cb) => {
      let bLoadProfileKey = false;
      let bLoadProfileTel = false;
      if (source.type && source.type === 'people') {
        source.id = source.id || source.metadata.exId;
        if (source.id
            && source.id.trim() !== ''
            && source.id === source.metadata.exId) {
          bLoadProfileKey = true;
        }
        if (source.metadata
            && !source.metadata.hidden
            && _.isEmpty(source.metadata.tel)
            && source.metadata.exId) {
          bLoadProfileTel = true;
        }
      }

      logger.trace({ method,
        message: `try to load profile, bLoadProfileKey = ${bLoadProfileKey}, bLoadProfileTel = ${bLoadProfileTel}`,
        type: source.type,
        id: source.id,
        exId: source.metadata.exId,
        hidden: source.metadata.hidden,
        tel: source.metadata.tel });

      if (bLoadProfileKey || bLoadProfileTel) {
        const UserModel = Model.registry.getModel('User');
        UserModel.loadUserInfo(user, source.metadata.exId, (err, response, body) => {
          if (err || !body || !body.key) {
            logger.error({ method,
              message: `failed to get profile key from connections for user: ${source.metadata.exId}`,
              err: (err ? err.message : null),
              body });
            if (bLoadProfileKey) {
              cb(new ApplicationError(user.g.f('msg_itm_cannot_connect_to_connections')));
            } else {
              return oldMethod.call(self, user, source, target, cb);
            }
          } else {
            source.id = body.key;
            if (bLoadProfileTel) {
              source.metadata.tel = body.tel || {};
            }
            logger.trace({ method, message: `get the key from profile is key = ${body.key}, source.id = ${source.id}` });
            return oldMethod.call(self, user, source, target, cb);
          }
          return null;
        });
      } else {
        return oldMethod.call(self, user, source, target, cb);
      }
      return null;
    };
  });
};

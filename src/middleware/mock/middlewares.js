/* Copyright IBM Corp. 2017  All Rights Reserved.                    */

import modelUtils from 'src/utils/model-utils';
import auth from '@connections/utils-auth';
import { loggerFactory } from '@connections/utils-logger';

const logger = loggerFactory({ level: process.env.LOG_LEVEL || 'info' });

module.exports = {
  getLoginUser() {
    return (req, res, next) => {
      let ITMToken = null;
      const tokenName = auth.getAuthCookieName();
      if (req.cookies && req.cookies[tokenName]) {
        ITMToken = req.cookies[tokenName];
      }
      const user = { organizationId: process.env.DEFAULT_ORG || 'default_org',
        name: 'default_name',
        emails: 'default_email@ibm.com',
        id: 'default_external_id',
        LtpaToken2: 'default_Ltpatoken2',
        key: ITMToken || 'default_user',
      };

      req.user = Object.assign(req.user, user);
      req.user.key = modelUtils.getUserKey(user);
      req.user.data = modelUtils.getUserData(user);
      logger.silly('getLoginUser(), req.user = ', req.user);
      next();
    };
  },

  getProfile() {
    return (req, res) => {
      const userId = req.query.userid;
      logger.silly('getProfile(), profile = ', { key: `${userId}_mock_key`, tel: { mobile: `${userId}_mock_phone` } });
      res.status(200).json({ key: `${userId}_mock_key`, tel: { mobile: `${userId}_mock_phone` } });
    };
  },

  getPeopleIdsMapping() {
    return (req, res) => {
      logger.silly('getPeopleIdsMapping(), req.body = ', req.body);
      const body = req.body;
      if (body && body.externalIds && body.externalIds.length > 0) {
        const success = body.externalIds.map(exId => ({
          id: 'id_in_mongodb_success',
          internalId: 'default_user',
          externalId: exId,
          orgId: process.env.DEFAULT_ORG || 'default_org',
          created: new Date(),
        }));
        const error = [];

        res.status(200).json({ success, error });
      } else {
        res.status(400).json({ error:
        {
          statusCode: 400,
          message: 'internalIds or externalIds is a required argument',
        },
        });
      }
    };
  },
  getProfilesBulk() {
    return (req, res) => {
      const keys = req.body.keys;
      const profileValues = [];

      keys.forEach((key) => {
        const p = {};
        p[key] = { state: 'active',
          profKey: key,
          email: `${key}@mock.com`,
          displayName: `${key}-mock-name`,
          exid: `${key}-mock-exid`,
          orgid: 'a' };

        if (keys.indexOf(key) % 3 === 1) {
          p[key].state = 'inactive';
        } else if (keys.indexOf(key) % 3 === 2) {
          p[key].state = 'deleted';
        }

        profileValues.push(p);
      });

      res.status(200).json({ requestType: 'keys', profiles: profileValues });
    };
  },
};

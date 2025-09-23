/* Copyright IBM Corp. 2017  All Rights Reserved.                    */

import auth from '@connections/utils-auth';
import _ from 'lodash';
import modelUtils from 'src/utils/model-utils';
import { loggerFactory } from '@connections/utils-logger';

const logger = loggerFactory({ level: process.env.LOG_LEVEL || 'info' }); 
module.exports = () => (req, res, next) => {
  logger.trace({ method: 'userFilter', message: `userFilter(): ${req.method} ${req.url}, ` +
    `authorization = ${req.headers.authorization},` +
    `cookies = ${JSON.stringify(req.cookies)}`});
  auth.ensureLogin(req, res, {redirectToHomepageLogin : false, resetAuthHeader: true})
  .then((user) => {
    logger.trace({ method: 'userFilter', message: `>server: ensureLogin callback with user key:${user.key}, orgid:${user.organizationId} `});
    req.user = Object.assign(req.user, user);
    req.user.key = modelUtils.getUserKey(user);
    req.user.data = modelUtils.getUserData(user);
    Object.assign(req.user, req.headers);
    next();
  }).fail((err) => {
    logger.error({ method: 'userFilter',
      message: `ensureLogin callback with error: ${err.message}`,
      headers: Object.keys(req.headers),
      xForwarded: req.headers['x-forwarded-for'],
      remoteAddress:req.connection.remoteAddress,});
  });
};

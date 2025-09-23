/* Copyright IBM Corp. 2017  All Rights Reserved.                    */

import SG from 'src/utils/globalize';
import { loggerFactory } from '@connections/utils-logger';

const logger = loggerFactory({ level: process.env.LOG_LEVEL || 'info' });

module.exports = () => (req, res, next) => {
  req.user = req.user || {};
  const g = req.user.g = new SG();
  const cookies = req.cookies;
  const cookieLang = cookies ? cookies.lcLang : undefined;
  const actualLang = g.setLangFromRequest(req);
  const requestLang = req.lang;
  logger.silly('cookie lang = %s, actual lang = %s, request lang = %s',
    cookieLang, actualLang, requestLang);
  next();
};

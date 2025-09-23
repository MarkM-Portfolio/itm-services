/* Copyright IBM Corp. 2017  All Rights Reserved.                    */

import c from 'src/utils/constant-def';
import { loggerFactory } from '@connections/utils-logger';

const logger = loggerFactory({ level: process.env.LOG_LEVEL || 'info' });

module.exports = (Model) => {
  Model.enableConditionalGet = (method) => {
    const oldMethod = Model[method];

    Model[method] = (req, res, ...args) => {
      const cb = args[args.length - 1]; // last arg should be cb
      args[args.length - 1] = (err, result, code) => {
        if (err) {
          cb(err, result, code);
        } else {
          /* eslint-disable no-underscore-dangle */
          const newETag = `${result.modified.getTime()}-${req.user.key._id}`;
          /* eslint-enable no-underscore-dangle */
          const lastETag = req.headers[c.IF_NONE_MATCH];
//          const modified = (newETag !== lastETag);

          res.setHeader(c.ETAG_HEADER, newETag);
          // skip to return 304 until figure out how to correctly handle the response.
          logger.silly(`enableConditionalGet: lastETag = ${lastETag} newETag = ${newETag}`);
          res.setHeader(c.LAST_MODIFIED, result.modified.toUTCString());
          res.setHeader(c.CACHE_CONTROL, 'no-cache');
          cb(null, result, 200);
        }
      };

      return oldMethod(req, res, ...args);
    };
  };
};

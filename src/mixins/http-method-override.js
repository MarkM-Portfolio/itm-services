/* Copyright IBM Corp. 2017  All Rights Reserved.                    */

import { ValidationError } from 'src/utils/errors';
import { loggerFactory } from '@connections/utils-logger';

const logger = loggerFactory({ level: process.env.LOG_LEVEL || 'info' });

const getHttpVerb = req => req.method.toLowerCase();

const getOverrideHeader = (req) => {
  const header = req.headers['x-http-method-override'];
  return header ? header.toLowerCase() : '';
};

const overrideMethod = (method, option) => (ctx, ...args) => {
  const verb = getHttpVerb(ctx);
  const override = getOverrideHeader(ctx);
  if (verb === 'post' && override === option.override) {
    method(ctx, ...args);
  } else if (option.postMethod) {
    option.postMethod(ctx, ...args);
  } else {
    const err = new ValidationError(`Not support request method: ${verb}, 
        x-http-method-override:${override}`);
    logger.error({ method: option.newMethod, message: err.message });
    const cb = args[args.length - 1];
    cb(err, 422);
  }
};

module.exports = (Model, options) => {
  Object.keys(options).forEach((methodName) => {
    const option = options[methodName];

    const postMethod = option.postMethod;
    if (postMethod) {
      option.postMethod = Model[postMethod]; // original post method
      Model[postMethod] = overrideMethod(Model[methodName], option);
    } else {
      const newMethod = option.newMethod = `${methodName}Override`;
      Model[newMethod] = overrideMethod(Model[methodName], option);

      const remoteMethods =
        Model.sharedClass.methods({ includeDisabled: false });

      const oldMethod = remoteMethods.find(
        remoteMethod => remoteMethod.name === methodName);

      Model.remoteMethod(newMethod, {
        isStatic: oldMethod.isStatic,
        accepts: oldMethod.accepts,
        returns: oldMethod.returns,
        errors: oldMethod.errors,
        description: oldMethod.description,
        notes: oldMethod.notes,
        http: Object.assign({}, oldMethod.http, { verb: 'post' }),
        rest: oldMethod.rest,
      });
    }
  });
};

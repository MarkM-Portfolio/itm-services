/* Copyright IBM Corp. 2017  All Rights Reserved.                    */

/* eslint import/no-dynamic-require: 0 */
/* eslint global-require: 0 */

import { redis } from '@connections/utils-pubsub';
import conf from 'src/config/itm-config';
import { loggerFactory } from '@connections/utils-logger';

const logger = loggerFactory({ level: process.env.LOG_LEVEL || 'info' });

module.exports = {
  /**
   * Helper function for disabling default remote methods for a model
   * @param {Object} targetModel the model
   * @param {Object} excludeMethods the exclude methods
   */
  disableRemoteMethods(targetModel, excludeMethods) {
    const excludes = (excludeMethods || []);
    targetModel.sharedClass.methods().forEach((method) => {
      const methodName = (method.isStatic ? '' : 'prototype.') + method.name;
      if (excludes.indexOf(methodName) === -1) {
        targetModel.disableRemoteMethodByName(methodName);
      }
    });
  },

  loadModel(app, modelNames, dataSource) {
    modelNames.forEach((modelName) => {
      const modelConfig = require(`../models/${modelName}.json`);
      const Model = app.registry.createModel(modelConfig);
      require(`../models/${modelName}`)(Model);
      Model.attachTo(dataSource);
      app.model(Model);
    });
  },

  loadMixin(app, mixinNames) {
    logger.info('loadMixin', mixinNames);
    const mixins = app.loopback.modelBuilder.mixins;

    function normalizeMixinName(name) {
      let str = String(name).replace(/([A-Z]+)/g, ' $1').trim();
      str = String(str).replace(/[\W_]/g, ' ').toLowerCase();
      str = str.replace(/\s+/g, '-');
      return str;
    }

    mixinNames.forEach((mixinName) => {
      const mixinConfig = require(`../mixins/${normalizeMixinName(mixinName)}.js`);
      mixins.define(mixinName, mixinConfig);
    });
  },

  overridePresence(Model) {
    const configPresence = Model.validatesPresenceOf;
    Model.validatesPresenceOf = function validatesPresenceOf(...args) {
      args.forEach((attr) => {
        if (typeof attr === 'string') {
          Model.definition.rawProperties[attr].required = true;
        }
      });
      configPresence.apply(Model, args);
    };
  },
  makeRedisClient(name) {
    conf.redis.connectionName = name || 'itm-services';
    return redis.makeClient({ redis: conf.redis });
  },
  /* eslint-disable no-underscore-dangle */
  getUserKey(user) {
    return { _id: (user.key ? user.key : user._id),
      orgId: (user.organizationId ? user.organizationId : user.orgId) };
  },
  getUserData(user) {
    return { _id: (user.key ? user.key : user._id),
      orgId: (user.organizationId ? user.organizationId : user.orgId) };
  },
  testErr(fun, err) {
    if (err) {
      logger.error(`${fun} is failed`, err);
      return true;
    }
    return false;
  },
};

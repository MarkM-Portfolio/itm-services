/* Copyright IBM Corp. 2017  All Rights Reserved.                    */

import assert from 'assert';
import _ from 'lodash';
import { loggerFactory } from '@connections/utils-logger';

const logger = loggerFactory({ level: process.env.LOG_LEVEL || 'info' });

module.exports = (Model) => {
  function processErrors(inst) {
    const errors = inst.errors;
    logger.debug('processErrors: model property error', errors);
    Object.keys(errors).forEach((prop) => {
      errors.codes[prop].forEach((code, i) => {
        const messages = errors[prop];
     // if the error message is for undefined property, which is hard-code in loopback
        if (code === 'unknown-property') {
          messages[i] = 'msg_itm_unknown_property';
        }
      });
    });
  }

  function formatPropertyError(user, propertyName, propertyValue, errorMessage) {
    let msg;
    let msgValues;
    if (Array.isArray(errorMessage)) {
      // errorMessage: [message-string, limitation-length]
      msg = errorMessage[0];  // message string
      msgValues = _.clone(errorMessage);
      msgValues.splice(0, 1, propertyName);  // msgValues: [propertyName, limitation-length]
    } else {
      msg = errorMessage;  // message string
      msgValues = [propertyName]; // msgValues: [propertyName]
    }

    if (typeof (propertyValue) !== 'undefined') {
      // msgValues: [propertyName, limitation-length(optional), propertyValue]
      msgValues = msgValues.concat(propertyValue);
    }

    return user.g.f(msg, msgValues);
  }

  function formatErrors(user, errors, propertyValues) {
    const DELIM = '; ';
    return Object.getOwnPropertyNames(errors)
      .filter(propertyName => Array.isArray(errors[propertyName]))
      .map((propertyName) => {
        const messages = errors[propertyName];
        const propertyValue = propertyValues[propertyName];
        const message = messages.map(msg => formatPropertyError(
            user, propertyName, propertyValue, msg)).join(DELIM);
        errors[propertyName] = message;
        logger.debug(`formatErrors: error message: ${message}`);

        return message;
      })
      .join(DELIM);
  }

  function processErrorMessage(inst, user, error) {
    error.message = user.g.f(
      'The %s instance is not valid. Details: %s.',
        inst.constructor.modelName,
      formatErrors.call(inst, user, inst.errors, inst.toJSON()),
    );
  }

/**
  * Validate particular model properties explicitly
  * @param {Object}
  *        data: Properties to be validated
  *        validates [optional]: Function to apply temp validations to the model
  *        callback [optional]: callback allowed error objects to be passed in
  * @returns {Boolean} True if all properties pass validation
  */
  Model.isValidPartial = (user, data, cb, validates) => {
    assert(data, user.g.f('msg_itm_model_properties_not_null'));

    const inst = new Model(data);
    const oldValidations = Model.validations;
    logger.silly('isValidPartial: backup old validations: %j', Model.validations);

    const newValidations = {};
    if (oldValidations) {
      Object.keys(data).forEach((key) => {
        const varr = oldValidations[key];
        if (varr) {
          newValidations[key] = _.cloneDeep(varr);
        }
      });
    }
    Model.validations = newValidations;

    if (validates) {
      validates(Model);
    }
    logger.silly('isValidPartial: use new validations: %j', Model.validations);

    const valid = inst.isValid(() => processErrors(inst));
    if (!valid) {
      if (cb !== undefined) {
        const newCb = (...args) => {
          processErrorMessage(inst, user, args[0]);
          cb.apply(inst, args);
        };
        newCb(new Model.ValidationError(inst));
      }
    }

    delete Model.validations;
    Model.validations = oldValidations;
    logger.silly('isValidPartial: revert to old validations: %j', Model.validations);
    return valid;
  };

  function isValidDeep(user, inst, cb) {
    if (inst === undefined || inst === null) { return true; }

    if (!inst.isValid || typeof inst.isValid !== 'function') {
      return true;
    }

    let valid = inst.isValid(() => processErrors(inst));
    if (valid) {
      const TheModel = inst.constructor;
      const props = TheModel.definition.properties;
      valid = Object.keys(props).every(propName => isValidDeep(user, inst[propName], cb));
      // ticket: https://github.ibm.com/connections/connections-planning/issues/9689
      return valid;
    }

    if (!valid) {
      if (cb !== undefined) {
        const newCb = (...args) => {
          processErrorMessage(inst, user, args[0]);
          cb.apply(inst, args);
        };
        newCb(new Model.ValidationError(inst));
      }
    }

    return valid;
  }

  Model.isValidAll = (user, data, cb) => {
    const inst = (data.constructor === Object) ? new Model(data) : data;
    return isValidDeep(user, inst, cb);
  };
};

/* Copyright IBM Corp. 2017  All Rights Reserved.                    */

import SG from 'src/utils/globalize';

const g = new SG();

/**
  * Extend application specific Error from the native Error object
  * @param name
  * @param code [optional]
  * @returns {SubType}
  */
Error.subclass = function subclass(name, statusCode) {
  if (!name || name.length === 0) {
    throw new Error(g.f('msg_itm_error_name_required'));
  }

  const SubError = function subError(message = '', errorCode) {
    this.message = message;
    this.name = name;
    this.status = this.code = this.statusCode = statusCode;
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = (new Error(message)).stack;
    }
    if (errorCode) {
      this.details = {
        code: errorCode,
      };
    }
  };

  // inherit the base prototype chain
  Object.setPrototypeOf(SubError.prototype, this.prototype);

  // attach subclass() to the SubError to make it extendable further
  SubError.subclass = this.subclass;

  return SubError;
};

// Default application errors defined here
export const ApplicationError = Error.subclass('ApplicationError', 500);
export const NotFoundError = ApplicationError.subclass('NotFoundError', 404);
export const DuplicateError = ApplicationError.subclass('DuplicateError', 409);
export const ValidationError = ApplicationError.subclass('ValidationError', 422);

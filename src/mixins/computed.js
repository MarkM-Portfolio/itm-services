/* Copyright IBM Corp. 2017  All Rights Reserved.                    */

module.exports = (Model, options) => {
  // Model is the model class
  // options is an object containing the config properties from model definition
  Model.observe('before save', (ctx, next) => {
    // Observe any insert/update event on Model
    const model = (ctx.instance) ? ctx.instance : ctx.data;
    Object.keys(options).forEach((property) => {
      const func = options[property];
      if (func === '$now') {
        model[property] = new Date();
      } else {
        model[property] = Model[func](model);
      }
    });
    next();
  });
};

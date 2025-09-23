/* Copyright IBM Corp. 2017  All Rights Reserved.                    */

import SG from 'src/utils/globalize';
import loopback from 'loopback';
import mixinValidation from 'src/mixins/validation';
import mixinComputed from 'src/mixins/computed';
import mixinConditionalGet from 'src/mixins/conditional-get';
import mixinDataSync from 'src/mixins/data-sync';

module.exports = () => {
  const g = new SG();
  const user = { g };

  describe('Computed Mixin', () => {
    const NameModel = loopback.createModel({
      name: 'nameModel',
      base: 'Model',
      properties: {
        name: String, lname: String,
      },
    });

    beforeAll(() => {
      NameModel.lowerCasedName = model => model.name.toLowerCase();
      mixinComputed(NameModel, { lname: 'lowerCasedName' }, { base: 'PersistedModel' });
      NameModel.attachTo(loopback.memory());
    });

    it('should set lower cased name into lname', () => {
      NameModel.create({ name: 'Jeff' }, (err, data) => {
        expect(data.lname).toEqual('jeff');
      });
    });
  });

  describe('Validation Mixin', () => {
    const ActorModel = loopback.createModel({
      name: 'actorModel',
      base: 'Model',
      properties: {
        first: String, last: String, gender: String,
      },
    });
    const AgeModel = loopback.createModel({
      name: 'ageModel',
      base: 'Model',
      properties: {
        age: Number,
      },
    });
    const cb = () => {};

    beforeAll(() => {
      ActorModel.validatesPresenceOf('first', 'last');
      ActorModel.validatesLengthOf('first', { min: 1, max: 3 });
      mixinValidation(ActorModel);
      mixinValidation(AgeModel);
    });

    describe('isValidPartial', () => {
      it('should return true if @first passes validation', () => {
        expect(ActorModel.isValidPartial(user, { first: 'Tom' }, cb)).toBe(true);
      });

      it('should return false if @first does not pass validation', () => {
        expect(ActorModel.isValidPartial(user, { first: 'Jerry' }, cb)).toBe(false);
      });

      it('should return true if @first passes validation and @gender has no validator', () => {
        expect(ActorModel.isValidPartial(user, { first: 'Tom', gender: 'male' }, cb)).toBe(true);
      });

      it('should return false if @gender does not pass temp validation', () => {
        expect(ActorModel.isValidPartial(user, { gender: 'unknown' }, cb,
          (model) => {
            model.validatesInclusionOf('gender', { in: ['male', 'female'] });
          },
        )).toBe(false);
      });

      it('should pass if callback not provided', () => {
        expect(ActorModel.isValidPartial(user, { first: 'Jerry' })).toBe(false);
      });

      it('should pass if no validations defined', () => {
        expect(AgeModel.isValidPartial(user, { age: 1 })).toBe(true);
      });

      it('should fail if properties not provided', () => {
        expect(() => ActorModel.isValidPartial(user)).toThrow();
      });
    });

    describe('isValidAll', () => {
      it('should pass if all properties pass validation', () => {
        const data = { first: 'Tom', last: 'Jerry' };
        expect(ActorModel.isValidAll(user, data, cb)).toBe(true);
        expect(ActorModel.isValidAll(user, data)).toBe(true);
      });

      it('should pass if instance provided and all properties pass validation', () => {
        const inst = ActorModel({ first: 'Tom', last: 'Jerry' });
        expect(ActorModel.isValidAll(user, inst, cb)).toBe(true);
      });

      it('should fail if some properties not pass validation', () => {
        const inst = ActorModel({ first: 'Jerry' });
        expect(ActorModel.isValidAll(user, inst, cb)).toBe(false);
        expect(ActorModel.isValidAll(user, inst)).toBe(false);
      });
    });
  });

  describe('Conditional Get Mixin', () => {
    it('should run callback with error object passed in if Model operation failed', () => {
      const Model = {
        doSomething(req, res, cb) {
          cb(new Error(), null, 500);
        },
      };
      mixinConditionalGet(Model);
      Model.enableConditionalGet('doSomething');
      Model.doSomething({ headers: [] }, {}, (err, result, code) => {
        expect(err).not.toBeNull();
        expect(result).toBeNull();
        expect(code).toBe(500);
      });
    });
  });

  describe('Data Sync Mixin', () => {
    it('should run callback with error object passed in if Model operation failed', () => {
      const Model = {
        addEntry() {
        },
        getEntryList(req, res, cb) {
          cb(new Error(), null, 500);
        },
        registry: {
          getModel() {},
        },
      };
      mixinDataSync(Model);
      Model.getEntryList({ headers: [] }, {}, (err, result, code) => {
        expect(err).not.toBeNull();
        expect(result).toBeNull();
        expect(code).toBe(500);
      });
    });
  });
};

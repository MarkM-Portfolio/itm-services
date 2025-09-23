/* Copyright IBM Corp. 2017  All Rights Reserved.                    */

import SG from 'src/utils/globalize';
import loopback from 'loopback';
import modelUtil from 'src/utils/model-utils';
import 'src/utils/errors';

module.exports = () => {
  describe('Utilities', () => {
    describe('define error', () => {
      it('should pass if all required arguments given', () => {
        const MyError = Error.subclass('MyError', 500);
        const e = new MyError('This is the error message');
        expect(e.message).toEqual('This is the error message');
        expect(e.name).toEqual('MyError');
        expect(e.code).toEqual(500);
      });

      it('should pass instanceof check if inherited from base Error', () => {
        const MyError = Error.subclass('MyError');
        const MySubError1 = MyError.subclass('MySubError1');
        const MySubError2 = MyError.subclass('MySubError2');
        const e1 = new MySubError1();
        const e2 = new MySubError2();
        expect(e1 instanceof MyError).toBe(true);
        expect(e1 instanceof MySubError1).toBe(true);
        expect(e2 instanceof MySubError2).toBe(true);
        expect(e1 instanceof MySubError2).toBe(false);
      });

      it('should throw Error if name not given', () => {
        expect(Error.subclass).toThrowError(Error);
      });

      it('should see message as empty string if not given', () => {
        const MyError = Error.subclass('MyError');
        const e = new MyError();
        expect(e.message).toBe('');
      });

      it('should pass if Error.captureStackTrace is undefined', () => {
        const old = Error.captureStackTrace;
        Error.captureStackTrace = undefined;
        const MyError = Error.subclass('MyError');
        const e = new MyError();
        expect(e.message).toBe('');
        Error.captureStackTrace = old;
      });
    });

    describe('Globalize', () => {
      const g = new SG();
      const req = {};

      beforeEach(() => { req.headers = {}; });

      it('should return en if accept language is en', () => {
        req.headers['accept-language'] = 'en';
        expect(g.setLangFromRequest(req)).toEqual('en');
      });

      it('should return pt-pt if accept language is pt', () => {
        req.headers['accept-language'] = 'pt';
        expect(g.setLangFromRequest(req)).toEqual('pt-PT');
      });

      it('should return pt if accept language is pt-br', () => {
        req.headers['accept-language'] = 'pt-br';
        expect(g.setLangFromRequest(req)).toEqual('pt');
      });

      it('should return en if accept language is invalid', () => {
        expect(g.setLangFromRequest(req)).toEqual('en');

        req.headers['accept-language'] = undefined;
        expect(g.setLangFromRequest(req)).toEqual('en');

        req.headers['accept-language'] = 'null';
        expect(g.setLangFromRequest(req)).toEqual('en');
      });

      it('should return transformed lang for Chinese langs', () => {
        req.headers['accept-language'] = 'zh-CN';
        expect(g.setLangFromRequest(req)).toEqual('zh-Hans');

        req.headers['accept-language'] = 'zh-TW';
        expect(g.setLangFromRequest(req)).toEqual('zh-Hant');

        req.headers['accept-language'] = 'zh-Hans';
        expect(g.setLangFromRequest(req)).toEqual('zh-Hans');

        req.headers['accept-language'] = 'zh-Hant';
        expect(g.setLangFromRequest(req)).toEqual('zh-Hant');
      });
    });

    describe('disableRemoteMethods', () => {
      let DummyModel;
      let methods;
      const disabledMethods = [];

      beforeEach(() => { DummyModel = loopback.createModel('dummyModel'); });

      it('should diable all methods if no execlude methods specified', () => {
        modelUtil.disableRemoteMethods(DummyModel);

        methods = DummyModel.sharedClass.methods();
        expect(methods.length).toBe(0);
      });// it

      it('should disable methods not appeared in execlude methods', () => {
        DummyModel.on('remoteMethodDisabled',
          (model, methodName) => disabledMethods.push(methodName));
        modelUtil.disableRemoteMethods(DummyModel, ['find', 'findOne']);

        methods = DummyModel.sharedClass.methods();
        expect(methods.length).toBe(2);
        expect(disabledMethods).not.toContain('find');
        expect(disabledMethods).not.toContain('findOne');
        expect(disabledMethods).toContain('findById');
      });// it
    });// describe

    describe('testErr', () => {
      it('should return false if err is null', () => {
        expect(modelUtil.testErr('testErr', null)).toBe(false);
      });

      it('should return true if err is not null', () => {
        expect(modelUtil.testErr('testErr', {})).toBe(true);
      });
    });

    describe('getUser', () => {
      it('should return expect user key for input', () => {
        expect(modelUtil.getUserKey({ _id: 'a', orgId: 'a' })).toEqual({ _id: 'a', orgId: 'a' });
      });
      it('should return expect user key for input', () => {
        expect(modelUtil.getUserKey({ key: 'a', organizationId: 'a' })).toEqual({ _id: 'a', orgId: 'a' });
      });

      it('should return expect user data for input', () => {
        expect(modelUtil.getUserData({ _id: 'a', orgId: 'a' })).toEqual({ _id: 'a', orgId: 'a' });
      });
      it('should return expect user data for input', () => {
        expect(modelUtil.getUserData({ key: 'a', organizationId: 'a' })).toEqual({ _id: 'a', orgId: 'a' });
      });
    });

    describe('overridePresence', () => {
      const AgeModel = loopback.createModel({
        name: 'ageModel',
        base: 'Model',
        properties: {
          age: Number,
        },
      });
      modelUtil.overridePresence(AgeModel);
      AgeModel.validatesPresenceOf('age');

      it('should use default message if not provided', () => {
        const inst = AgeModel({});
        const valid = inst.isValid();
        expect(valid).toBe(false);
        expect(inst.errors.age[0]).toEqual('can\'t be blank');
      });
    });
  });
};

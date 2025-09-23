/* Copyright IBM Corp. 2017  All Rights Reserved.                    */

import gkModule from '@connections/utils-gatekeeper';

module.exports = () => {
  describe('gatekeeper', () => {
    it('gatekeeper should be initialized already', () => {
      expect(gkModule.isInitialized()).toBe(true);
    }); // it
    it('gatekeeper should return false when checking my-test-f1 globally ', () => {
      expect(gkModule.get('my-test-f1')).toBe(false);
    }); // it
    it('gatekeeper should return true when checking my-test-f1 at orgId 0001 ', () => {
      expect(gkModule.get('my-test-f1', '0001')).toBe(true);
    }); // it
    it('gatekeeper should return false when checking my-test-f1 at orgId 0002 ', () => {
      expect(gkModule.get('my-test-f1', '0002')).toBe(false);
    }); // it
  });// describe
};

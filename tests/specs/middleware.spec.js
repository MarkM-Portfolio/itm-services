/* Copyright IBM Corp. 2017  All Rights Reserved.                    */
/* eslint-disable no-underscore-dangle*/

import rewire from 'rewire';
import g11nMiddleware from 'src/middleware/g11nFilter';

module.exports = (request) => {
  describe('G11n Middleware', () => {
    it('should not set cookie if cookie not available', () => {
      const req = {
        headers: {
          'accept-language': 'zh-CN',
        },
      };
      const res = {
        cookie: () => {},
      };
      const next = () => {};
      spyOn(res, 'cookie');

      g11nMiddleware()(req, res, next);
      expect(res.cookie).not.toHaveBeenCalled();
    });
  });

  describe('Version Middleware', () => {
    it('should return unknown version number when env not has BUILDVERSION', (done) => {
      const url = '/version';
      const getVersion = new Promise((resolve, reject) => {
        request.get(url)
        .set('Content-Type', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      }); // return new Promise
      getVersion.then((res) => {
        expect(res.body).toEqual(
            { version: 'unknown version' },
            );
        done();
      })
      .catch((err) => {
        expect(err).toBeNull();
        done();
      });
    });

    it('should return correct version number when env has BUILDVERSION', (done) => {
      process.env.BUILD_VERSION = '0.0.1-201705251020';
      const url = '/version';
      const getVersion = new Promise((resolve, reject) => {
        request.get(url)
        .set('Content-Type', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      }); // return new Promise
      getVersion.then((res) => {
        expect(res.body).toEqual(
            { version: process.env.BUILD_VERSION },
            );
        done();
      })
      .catch((err) => {
        expect(err).toBeNull();
        done();
      });
    });
  });
  describe('Healty Middleware', () => {
    it('should return heathy status 200 when initialStatus is same with currentStatus', (done) => {
      const healthyMiddleware = rewire('../../src/middleware/healthyFilter.js');
      healthyMiddleware.__set__('initialStatus', false);
      const req = {};
      const res = {
        code: 0,
        body: {},
        status: (httpCode) => { res.code = httpCode; return res; },
        json: (json) => {
          res.body = json;
          expect(res.code).toBe(200);
          expect(res.body).toEqual(
            { name: 'itm-services', status: 200 },
          );
          done();
        },
      };
      healthyMiddleware()(req, res);
    }); // it

    it('should return heathy status 500 when initalStatus is different from currentStatus', (done) => {
      const healthyMiddleware = rewire('../../src/middleware/healthyFilter.js');
      healthyMiddleware.__set__('initialStatus', true);
      const req = {};
      const res = {
        code: 0,
        body: {},
        status: (httpCode) => { res.code = httpCode; return res; },
        json: (json) => {
          res.body = json;
          expect(res.code).toBe(500);
          expect(res.body).toEqual(
            { name: 'itm-services', status: 500, error: 'mongo x509 configuration changed to false' },
          );
          done();
        },
      };
      healthyMiddleware()(req, res);
    }); // it
  });
};

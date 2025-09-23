/* Copyright IBM Corp. 2017  All Rights Reserved.                    */

import _ from 'lodash';
import nock from 'nock';
import httpMocks from 'node-mocks-http';
import nodeUrl from 'url';
import auth from '@connections/utils-auth';
import authData from 'tests/test-data/auth-data.json';
import { loggerFactory } from '@connections/utils-logger';

const logger = loggerFactory({ level: process.env.LOG_LEVEL || 'info' });

const toBeError = (name, code) => ({
  compare(body, expected) {
    const result = {};
    try {
      const err = body.error;
      let matched = (err.statusCode === code) && (err.name === name);
      if (expected) {
        if (err.details) {
          matched = matched && (err.details.code === expected);
        } else {
          matched = false;
        }
      }

      result.pass = matched;
    } catch (e) {
      logger.info('toBeError: ', e);
      result.pass = false;
    }
    return result;
  },
});

const setJWTToken = (authUser) => {
  const profileRes = _.cloneDeep(authData.profileRes);
  const connServer = process.env.CONNECTIONS_URL;
  const profileUrl = process.env.CONNECTIONS_PROFILES_URL;
  const authTokenName = auth.getAuthCookieName();
  const JWT_SCHEME = 'Bearer ';
  profileRes.entry.id = profileRes.entry.id.replace('userid', authUser.id);
  nock(connServer, {
    reqheaders: {
      cookie: headerValue => (headerValue.indexOf(authUser.id) !== -1),
    },
  })
  .get('/opensocial/rest/people/@me/@self').times(1000).reply(
       200, profileRes,
    );
  nock(profileUrl)
  .get(`/json/profile.do?format=compact&userid=${authUser.id}`).times(1000)
  .reply(200, { key: `${authUser.id}_key` });

  const href = nodeUrl.parse(connServer);
  const reqOptions = { protocol: href.protocol,
    host: href.host,
    headers: { cookie: `${authTokenName}=${authUser.authToken}` } };

  const res = httpMocks.createResponse();
  const req = httpMocks.createRequest(reqOptions);

  req.cookies[authTokenName] = `${authUser.authToken}`;

  return auth.ensureLogin(req, res).then((profile) => {
    authUser.authorization = JWT_SCHEME + profile.token;
  });
};

module.exports = {
  customMatchers: {
    toBeValidationError() { return toBeError('ValidationError', 422); },
    toBeDuplicateError() { return toBeError('DuplicateError', 409); },
    toBeNotFoundError() { return toBeError('NotFoundError', 404); },
    toEqualObject() {
      return {
        compare(actual, expected) {
          const result = {};
          try {
            result.pass = _.isMatch(actual, expected);
          } catch (e) {
            result.pass = false;
          }
          return result;
        },
      };
    },
    toEqualObjects() {
      return {
        compare(actual, expected) {
          const result = { pass: true };
          try {
            actual.every((actualValue, index) => {
              if ({}.hasOwnProperty.call(expected, index)) {
                result.pass = result.pass && _.isMatch(actual[index], expected[index]);
              }
              return result.pass;
            });
          } catch (e) {
            result.pass = false;
          }
          return result;
        },
      };
    },
  }, // customMatchers
  // move element in Array
  moveArray(array, oldIndex, newIndex) {
    if (newIndex >= array.length) {
      let k = newIndex - array.length;
      while (k + 1) {
        array.push(undefined);
        k -= 1;
      }
    }
    array.splice(newIndex, 0, array.splice(oldIndex, 1)[0]);
    return array;
  }, // moveArray
  generateStringWithLen(len) {
    return '1'.repeat(len);
  }, // generateStringWithLen

  registerItmAPIsWithRequest(request) {
    request.postEntry = (expectedStatus, data, targetId) => {
      const url = ((targetId || targetId === '') ? (`/entries?targetId=${targetId}`) : '/entries');
      return new Promise((resolve, reject) => {
        logger.info('postEntry = ', JSON.stringify(data));
        request.post(url)
        .send(data)
        .set('Content-Type', 'application/json')
        .expect(expectedStatus)
        .end((err, res) => {
          if (err) {
            reject(err); //
          } else {
            resolve(res); //
          }
        });
      });// return new Promise
    }; // request.postEntry

    request.putEntry = (expectedStatus, data, targetId) => {
      const url = ((targetId || targetId === '') ? (`/entries?targetId=${targetId}`) : '/entries');
      return new Promise((resolve, reject) => {
        logger.info('putEntry = ', JSON.stringify(data), targetId);
        request.put(url)
        .send(data)
        .set('Content-Type', 'application/json')
        .expect(expectedStatus)
        .end((err, res) => {
          if (err) {
            reject(err); //
          } else {
            resolve(res); //
          }
        });
      }); // return new Promise
    }; // request.putEntry

    request.postPutEntry = (expectedStatus, data, targetId, methodOverride = true) => {
      const url = ((targetId || targetId === '') ? (`/entries?targetId=${targetId}`) : '/entries');
      return new Promise((resolve, reject) => {
        logger.info('postPutEntry = ', JSON.stringify(data), targetId);
        request.post(url)
        .send(data)
        .set('Content-Type', 'application/json')
        .set('X-HTTP-Method-Override', (methodOverride ? 'PUT' : 'UNKNOWN-METHOD'))
        .expect(expectedStatus)
        .end((err, res) => {
          if (err) {
            reject(err); //
          } else {
            resolve(res); //
          }
        });
      }); // return new Promise
    }; // request.putEntry

    request.deleteEntry = (expectedStatus, entryId) => {
      const url = ((entryId) ? (`/entry/${entryId}`) : '/entry/');
      return new Promise((resolve, reject) => {
        logger.info('deleteEntry = ', entryId);
        request.delete(url)
        .set('Content-Type', 'application/json')
        .expect(expectedStatus)
        .end((err, res) => {
          if (err) {
            reject(err); //
          } else {
            resolve(res); //
          }
        });
      });// return new Promise
    }; // request.deleteEntry

    request.postDeleteEntry = (expectedStatus, entryId, methodOverride = true) => {
      const url = ((entryId) ? (`/entry/${entryId}`) : '/entry/');
      return new Promise((resolve, reject) => {
        logger.info('postDeleteEntry = ', entryId);
        request.post(url)
        .set('Content-Type', 'application/json')
        .set('X-HTTP-Method-Override', (methodOverride ? 'DELETE' : 'UNKNOWN-METHOD'))
        .expect(expectedStatus)
        .end((err, res) => {
          if (err) {
            reject(err); //
          } else {
            resolve(res); //
          }
        });
      });// return new Promise
    }; // request.deleteEntry

    request.deleteEntries = (expectedStatus, entryIds) => {
      const url = ((entryIds) ? (`/entries/${encodeURIComponent(entryIds)}`) : '/entries/');
      return new Promise((resolve, reject) => {
        logger.info('deleteEntries = ', entryIds);
        request.delete(url)
          .set('Content-Type', 'application/json')
          .expect(expectedStatus)
          .end((err, res) => {
            if (err) {
              reject(err); //
            } else {
              resolve(res); //
            }
          });
      });// return new Promise
    }; // request.deleteEntries

    request.postDeleteEntries = (expectedStatus, entryIds, methodOverride = true) => {
      const url = ((entryIds) ? (`/entries/${encodeURIComponent(entryIds)}`) : '/entries/');
      return new Promise((resolve, reject) => {
        logger.info('postDeleteEntries = ', entryIds);
        request.post(url)
          .set('Content-Type', 'application/json')
          .set('X-HTTP-Method-Override', (methodOverride ? 'DELETE' : 'UNKNOWN-METHOD'))
          .expect(expectedStatus)
          .end((err, res) => {
            if (err) {
              reject(err); //
            } else {
              resolve(res); //
            }
          });
      });// return new Promise
    }; // request.deleteEntries

    /**
     * params like {page:1, ps:10}
     * headers like {'if-none-match','etag'}
     */
    request.getEntries = (expectedStatus, params, headers) => {
      let url = '/entries';
      if (params) {
        url += '?';
        Object.keys(params).forEach((name) => {
          url += `&${name}=${params[name]}`;
        });
      }

      return new Promise((resolve, reject) => {
        const req = request.get(url)
                  .set('Content-Type', 'application/json');

        if (headers) {
          Object.keys(headers).forEach((name) => {
            req.set(name, headers[name]);
          });
        }

        req.expect(expectedStatus)
        .end((err, res) => {
          if (err) {
            reject(err);
          } else if (res.body && res.body.error) {
            reject(res.body.error);
          } else {
            resolve(res);
          }
        });
      }); // return new Promise
    };// request.getEntries

    request.moveEntry = (expectedStatus, entryId, targetId) => {
      const targetString = ((targetId || targetId === '') ? (`&targetId=${targetId}`) : '');
      const url = `/moveEntry?sourceId=${entryId}${targetString}`;
      return new Promise((resolve, reject) => {
        logger.info('moveEntry = ', url);
        request.put(url)
        .set('Content-Type', 'application/json')
        .expect(expectedStatus)
        .end((err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      }); // return new Promise
    };// request.moveEntry

    request.postMoveEntry = (expectedStatus, entryId, targetId, methodOverride = true) => {
      const targetString = ((targetId || targetId === '') ? (`&targetId=${targetId}`) : '');
      const url = `/moveEntry?sourceId=${entryId}${targetString}`;
      return new Promise((resolve, reject) => {
        logger.info('postMoveEntry = ', url);
        request.post(url)
        .set('Content-Type', 'application/json')
        .set('X-HTTP-Method-Override', (methodOverride ? 'PUT' : 'UNKNOWN-METHOD'))
        .expect(expectedStatus)
        .end((err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      }); // return new Promise
    };// request.moveEntry

    request.moveEntryPosition = (expectedStatus, entryId, targetId) => {
      const targetString = ((targetId || targetId === '') ? (`?targetId=${targetId}`) : '');
      const url = `/entries/${entryId}/position${targetString}`;
      return new Promise((resolve, reject) => {
        logger.info('moveEntryPosition = ', url);
        request.put(url)
        .set('Content-Type', 'application/json')
        .expect(expectedStatus)
        .end((err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      }); // return new Promise
    };// request.moveEntryPosition

    request.postMoveEntryPosition = (expectedStatus, entryId, targetId, methodOverride = true) => {
      const targetString = ((targetId || targetId === '') ? (`?targetId=${targetId}`) : '');
      const url = `/entries/${entryId}/position${targetString}`;
      return new Promise((resolve, reject) => {
        logger.info('postMoveEntryPosition = ', url);
        request.post(url)
        .set('Content-Type', 'application/json')
        .set('X-HTTP-Method-Override', (methodOverride ? 'PUT' : 'UNKNOWN-METHOD'))
        .expect(expectedStatus)
        .end((err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      }); // return new Promise
    };// request.postMoveEntryPosition
  }, // registerItmAPIsWithRequest

  setJWTTokenForUsers(authUsers, cb) {
    const promises = authUsers.map((authUser) => {
      if (!authUser.authorization) {
        return setJWTToken(authUser);
      }
      return null;
    }).filter(p => p);

    if (promises && promises.length > 0) {
      Promise.all(promises).then(() => cb());
    } else {
      cb();
    }
  },
};// module.exports

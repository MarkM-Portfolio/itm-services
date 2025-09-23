/* Copyright IBM Corp. 2017  All Rights Reserved.                    */

import cookieParser from 'cookie-parser';
import SuperAgentUse from 'superagent-use';
import superTest from 'supertest';
import loopback from 'loopback';
import g11nFilter from 'src/middleware/g11nFilter';
import versionFilter from 'src/middleware/versionFilter';
import healthyFilter from 'src/middleware/healthyFilter';
import userFilter from 'src/middleware/auth/filter/userFilter';
import filterSpec from 'tests/specs/auth/user-filter.spec';
import profileValidationSpec from 'tests/specs/profile-validation.spec';
import profileCRUDSpec from 'tests/specs/profile-crud.spec';
import gkSpec from 'tests/specs/gatekeeper.spec';
import utilsSpec from 'tests/specs/utils.spec';
import mixinSpec from 'tests/specs/mixin.spec';
import middlewareSpec from 'tests/specs/middleware.spec';
import profileMoveEntrySpec from 'tests/specs/profile-move-entry.spec';
import dataSyncSpec from 'tests/specs/data-sync.spec';
import testUtil from 'tests/utils/test-util';
import authData from 'tests/test-data/auth-data.json';
import userInfoLoaderSpec from 'tests/specs/user-info-loader.spec';
import app from 'src/server';
import auth from '@connections/utils-auth';


import auditEventsSpec from 'tests/specs/audit-events.spec';

describe('[ITM Unit Test Suite]', () => {
  app.use('/version', versionFilter());
  app.use('/healthy', healthyFilter());
  app.use(cookieParser());
  app.use(g11nFilter());
  app.use(userFilter());
  app.use(loopback.rest());

  const clientAjones11 = new SuperAgentUse(superTest(app));
  const clientAjones12 = new SuperAgentUse(superTest(app));
  const clientNoCredential = new SuperAgentUse(superTest(app));
  const authTokenName = auth.getAuthCookieName();
  clientAjones11.user = authData.users.ajones11;
  clientAjones11.use((req) => {
    req.set('authorization', authData.users.ajones11.authorization);
    req.set('cookie', `${authTokenName}=${authData.users.ajones11.authToken}`);
  });
  clientAjones12.user = authData.users.ajones12;
  clientAjones12.use((req) => {
    req.set('authorization', authData.users.ajones12.authorization);
    req.set('cookie', `${authTokenName}=${authData.users.ajones12.authToken}`);
  });

  beforeAll((done) => {
    // add customer matchers of jasmine
    jasmine.addMatchers(testUtil.customMatchers);
    testUtil.registerItmAPIsWithRequest(clientAjones11);
    testUtil.registerItmAPIsWithRequest(clientAjones12);
    testUtil.setJWTTokenForUsers([authData.users.ajones11, authData.users.ajones12], () => done());
  }); // beforeAll

  // ----gatekeeper unit tests----
  gkSpec();
  // ----auth unit tests----
  filterSpec(clientNoCredential);
  // ----model unit tests----
  profileCRUDSpec(clientAjones11);
  profileValidationSpec(clientAjones11);
  profileMoveEntrySpec(clientAjones12);
  dataSyncSpec(clientAjones11);
  auditEventsSpec(clientAjones11);
  // ----other unit tests----
  utilsSpec();
  mixinSpec();
  middlewareSpec(clientNoCredential);
  userInfoLoaderSpec(clientAjones11);
});

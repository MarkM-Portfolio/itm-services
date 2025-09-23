/* Copyright IBM Corp. 2017  All Rights Reserved.                    */

import SuperAgentUse from 'superagent-use';
import superTest from 'supertest';
import profileCRUDSpec from 'tests/specs/profile-crud.spec';
import profileMoveEntrySpec from 'tests/specs/profile-move-entry.spec';
import testUtil from 'tests/utils/test-util';
import authData from 'tests/test-data/auth-data.json';
import auth from '@connections/utils-auth';

const server = process.env.npm_config_server_host || '127.0.0.1';
const port = process.env.npm_config_server_port || '3000';
const baseUrl = `http://${server}:${port}/itm/api`;

describe('[ITM API Test Suite]', () => {
  const clientAjones11 = new SuperAgentUse(superTest(baseUrl));
  const authTokenName = auth.getAuthCookieName();
  clientAjones11.use((req) => {
    req.set('Cookie', `${authTokenName}=${authData.id_ajones11}`);
  });

  beforeAll(() => {
    // add customer matchers of jasmine
    jasmine.addMatchers(testUtil.customMatchers);
    testUtil.registerItmAPIsWithRequest(clientAjones11);
  });

  profileCRUDSpec(clientAjones11);
  profileMoveEntrySpec(clientAjones11);
});

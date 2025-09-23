/* Copyright IBM Corp. 2017  All Rights Reserved.                    */

import SuperAgentUse from 'superagent-use';
import superTest from 'supertest';
import healthySpec from 'tests/specs/healthy.spec';

process.env.ITM_SERVICES_BASE_URL = process.env.ITM_SERVICES_BASE_URL || 'http://itm-services:3000/itm';

describe('api test-suites', () => {
  const user1 = new SuperAgentUse(superTest(process.env.ITM_SERVICES_BASE_URL));
  healthySpec(user1);
});


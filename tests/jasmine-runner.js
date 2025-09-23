/* Copyright IBM Corp. 2017  All Rights Reserved.                    */

import Jasmine from 'jasmine';
import reporters from 'jasmine-reporters';

(() => {
  const testSuite = process.env.TEST_SUITE;
  const junitReporter = new reporters.JUnitXmlReporter({
    savePath: `tests/reports/${testSuite}/`,
    consolidateAll: false,
  });

  const jrunner = new Jasmine();

  jrunner.configureDefaultReporter({
    showColors: true, /* ,
    jasmineCorePath: this.jasmineCorePath*/
  });
  jrunner.addReporter(junitReporter);
  jrunner.loadConfig({
    spec_dir: 'tests',
    spec_files: [
      `${testSuite}.specs.js`,
    ],
    stopSpecOnExpectationFailure: false,
    random: false,
  });  // load jasmine.json configuration
  if (testSuite === 'unit') {
    /* eslint-disable global-require */
    const app = require('src/server');
    /* eslint-enable global-require */
    app.on('booted', () => {
      jrunner.execute();
    });
  } else {
    jrunner.execute();
  }
})();

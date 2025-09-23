/* Licensed Materials - Property of HCL                              */
/*                                                                   */
/* Copyright HCL Technologies Limited 2017, 2023                     */
/*                                                                   */
/* US Government Users Restricted Rights                             */

import 'src/utils/globalize';
import loopback from 'loopback';
import boot from 'loopback-boot';
import { loggerFactory } from '@connections/utils-logger';

const logger = loggerFactory({ level: process.env.LOG_LEVEL || 'info' });

const options = { appRootDir: `${__dirname}/config`,
  bootDirs: [`${__dirname}/boot`] };

const app = module.exports = loopback();
app.start = () =>
  // start the web server
   app.listen(() => {
     app.emit('started');
     const baseUrl = app.get('url').replace(/\/$/, '');
     logger.info('Web server listening at: %s', baseUrl);
     if (app.get('loopback-component-explorer')) {
       const explorerPath = app.get('loopback-component-explorer').mountPath;
       logger.info(`Browse your REST API at ${baseUrl}${explorerPath}`);
     }
   });

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, options, (err) => {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module) {
    app.start();
  }
});

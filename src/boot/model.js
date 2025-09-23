/* Copyright IBM Corp. 2017  All Rights Reserved.                    */

import path from 'path';
import gkModule from '@connections/utils-gatekeeper';
import { enableRest, enableConditionalGet } from 'src/api/rest/profiles';
import enableConnectionsEvents from 'src/utils/connections-events';
import HttpMethodOverride from 'src/mixins/http-method-override';

module.exports = (app) => {
  gkModule.init({
    versionedFlagsPath: path.resolve(__dirname, '../config/gatekeeper-config.json'),
  });
  enableRest(app);
  enableConditionalGet(app);
  enableConnectionsEvents(app);

  HttpMethodOverride(app.models.Profile, {
    deleteEntryRemote: {
      override: 'delete',
    },
    deleteEntriesRemote: {
      override: 'delete',
    },
    moveEntryRemote: {
      override: 'put',
    },
    moveEntryPositionRemote: {
      override: 'put',
    },
    addOrUpdateEntryRemote: {
      override: 'put',
      postMethod: 'addEntryRemote',
    },
  });

  app.emit('modelRemoted');
};

/* Copyright IBM Corp. 2017  All Rights Reserved.                    */

import modelUtil from 'src/utils/model-utils';
import c from 'src/utils/constant-def';

export function enableRest(app) {
  const Profile = app.models.Profile;

  // Node method
  Profile.addEntryRemote = (req, entry, targetId, cb) => {
    Profile.addEntry(req.user, entry, targetId, cb);
  }; // Profile.addEntry

  // Remote method
  Profile.remoteMethod(
    'addEntryRemote',
    {
      accepts:
      [
        { arg: 'req', type: 'object', http: { source: 'req' } },
        { arg: 'entry', type: 'Entry', http: { source: 'body' }, required: true },
        { arg: 'targetId',
          type: 'string',
          http: { source: 'query' },
          description: ['the uuid of the target Entry, before which the new entry be inserted, ',
            `(${c.POSITION.TAIL}) means to append to the tail,`,
            '(null or non-value) means to append at the tail'],
        },
      ],
      returns:
      [
        { arg: 'body', type: 'json', root: true },
        { arg: 'status', type: 'number', http: { target: 'status' } },
      ],
      http: { path: '/entries',
        verb: 'post',
        status: 201,
        errorStatus: 400,
      },
      notes: 'create a new entry at the position before the target entry indicated by targetId',
      description: 'create a new entry at the position before the target entry indicated by targetId',
    },
  ); // Profile.remoteMethod()

  Profile.addOrUpdateEntryRemote = (req, entry, targetId, cb) => {
    Profile.addOrUpdateEntry(req.user, entry, targetId, cb);
  };

  Profile.remoteMethod(
      'addOrUpdateEntryRemote',
    {
      accepts:
      [
          { arg: 'req', type: 'object', http: { source: 'req' } },
          { arg: 'entry', type: 'Entry', http: { source: 'body' }, required: true },
        { arg: 'targetId',
          type: 'string',
          http: { source: 'query' },
          description: ['the uuid of the target Entry, before which the entry be inserted, ',
            `(${c.POSITION.TAIL}) means to append to the tail, `,
            '     for update, need to remove original entry to tail and then replace the entry, ',
            '(null or non-value) for update, then just replace the value at original position, ',
            '     for add, then add the new entry at tail'],
        },
      ],
      returns:
      [
          { arg: 'body', type: 'json', root: true },
          { arg: 'status', type: 'number', http: { target: 'status' } },
      ],
      http: { path: '/entries',
        verb: 'put',
        errorStatus: 400,
      },
      notes: 'to update an existed entry or create a new entry, the position is before the entry indicated by targetId',
      description: ['to update an existed entry or create a new entry, the position is before the entry indicated by targetId.\n',
        'When use \'POST\' request to override \'PUT\' request, the http header \'x-http-method-override\' with value \'PUT\' is required, \n',
        'for example (x-http-method-override: PUT)'],
    },
  );// Profiles.remoteMethod()

  // Node method
  Profile.deleteEntryRemote = (req, id, cb) => {
    Profile.deleteEntry(req.user, id, cb);
  }; // deleteEntry

  // Remote method
  Profile.remoteMethod(
    'deleteEntryRemote',
    {
      accepts:
      [
        { arg: 'req', type: 'object', http: { source: 'req' } },
        { arg: 'id',
          type: 'string',
          description: 'the uuid of the entry to deleted',
        },
      ],
      returns:
      [
        { arg: 'status', type: 'number', http: { target: 'status' } },
      ],
      http: { path: '/entry/:id',
        verb: 'delete',
        status: 200,
        errorStatus: 400,
      },
      notes: 'to delete one entry indicated by id',
      description: ['to delete one entry indicated by id. When use \'POST\' request to override \'DELETE\' request, \n',
        'a http header \'x-http-method-override\' with value \'DELETE\' is required, \n',
        'for example: (x-http-method-override: DELETE)'],
    },
  );

  // Node method
  Profile.deleteEntriesRemote = (req, ids, cb) => {
    Profile.deleteEntries(req.user, ids, cb);
  }; // deleteEntries

  // Remote method
  Profile.remoteMethod(
    'deleteEntriesRemote',
    {
      accepts:
      [
        { arg: 'req', type: 'object', http: { source: 'req' } },
        { arg: 'ids',
          type: 'string',
          description: 'the ids of the entries to be deleted with comma separator. For example, id1,id2,id3',
        },
      ],
      returns:
      [
        { arg: 'body', type: 'json', root: true },
        { arg: 'status', type: 'number', http: { target: 'status' } },
      ],
      http: { path: '/entries/:ids',
        verb: 'delete',
        status: 200,
        errorStatus: 400,
      },
      notes: 'to delete entries indicated by ids',
      description: ['to delete entries indicated by ids. When use \'POST\' request to override \'DELETE\' request, \n',
        'a http header \'x-http-method-override\' with value \'DELETE\' is required, \n',
        'for example: (x-http-method-override: DELETE)'],
    },
  );

  function constructUrl(originalUrl, param, value, regex) {
    let url = originalUrl;
    if (url && url.indexOf(`${param}=`) > 0) {
      url = url.replace(regex, `${param}=${value}`);
    } else {
      url += `&${param}=${value}`;
    }

    return url;
  }
  // Node method
  Profile.getEntryListRemote = (req, res, page, ps, hidden, cb) => {
    Profile.getEntryList(req.user, page, ps, hidden, (err, body, status) => {
      if (body && body.page && body.ps && body.totalResults) {
        // construct the url for previous page and next page
        let url = req.url;
        url = constructUrl(url, 'ps', body.ps, /ps=\d*/);
        if (body.page > 1) {
          body.previous = req.baseUrl + constructUrl(url, 'page', body.page - 1, /page=\d*/);
        }
        if (body.page * body.ps < body.totalResults) {
          body.next = req.baseUrl + constructUrl(url, 'page', body.page + 1, /page=\d*/);
        }
      }
      cb(err, body, status);
    });
  }; // getEntryList

  // Remote method
  Profile.remoteMethod(
    'getEntryListRemote',
    {
      accepts:
      [
        { arg: 'req', type: 'object', http: { source: 'req' } },
        { arg: 'res', type: 'object', http: { source: 'res' } },
        { arg: 'page',
          type: 'integer',
          http: { source: 'query' },
          description: ['Page number. Specify the page to be returned. The default value is 1, which return the first page.'],
        },
        { arg: 'ps',
          type: 'integer',
          http: { source: 'query' },
          description: ['Page size. Specify the number of entries to returned page. The default value is 10. The maximum value you can specify is 100.'],
        },
        { arg: 'hidden',
          type: 'boolean',
          http: { source: 'query' },
          description: ['It will return all entries by default if hidden is not provided. If hiddle is false, it will return all entries with hidden false, or vice versa.'],
        },
      ],
      returns:
      [
        { arg: 'body', type: 'json', root: true, description: 'an array of entries' },
        { arg: 'status', type: 'number', http: { target: 'status' } },
      ],
      http: { path: '/entries',
        verb: 'get',
        status: 200,
        errorStatus: 400,
      },

      notes: 'to get all entries of the user, include hidden entires',
      description: 'to get all entries of the user, include hidden entires',
    },
  );

  Profile.moveEntryRemote = (req, sourceId, targetId, cb) => {
    Profile.moveEntry(req.user, sourceId, targetId, cb);
  };// moveEntry

  Profile.remoteMethod(
    'moveEntryRemote',
    {
      accepts:
      [
        { arg: 'req', type: 'object', http: { source: 'req' } },
        { arg: 'sourceId',
          type: 'string',
          http: { source: 'query' },
          description: 'the uuid of the source Entry, of which the position will be changed',
        },
        { arg: 'targetId',
          type: 'string',
          http: { source: 'query' },
          description: ['the uuid of the target Entry, before which the source Entry be moved to, ',
            `(${c.POSITION.TAIL}) means to append to the tail,`,
            '(null or non-value) returns a validation failure'],
        },
      ],
      returns:
      [
        { arg: 'status', type: 'number', http: { target: 'status' } },
      ],
      http: { path: '/moveEntry',
        verb: 'put',
        status: 200,
        errorStatus: 400,
      },
      notes: 'to move the source entry to the position immediate before the target entry indicated by targetId',
      description: ['to move the source entry to the position immediate before the target entry indicated by targetId. \n',
        'When use \'POST\' request to override \'PUT\' request, \n',
        'a http header \'x-http-method-override\' with value \'PUT\' is required, \n',
        'for example: (x-http-method-override: PUT)'],
    },
  );// Profiles.remoteMethod()

  Profile.moveEntryPositionRemote = (req, sourceId, targetId, cb) => {
    Profile.moveEntry(req.user, sourceId, targetId, cb);
  };// moveEntry

  Profile.remoteMethod(
    'moveEntryPositionRemote',
    {
      accepts:
      [
        { arg: 'req', type: 'object', http: { source: 'req' } },
        { arg: 'id',
          type: 'string',
          http: { source: 'path' },
          description: 'the uuid of the source Entry, of which the position will be changed',
        },
        { arg: 'targetId',
          type: 'string',
          http: { source: 'query' },
          description: ['the uuid of the target Entry, before which the source Entry be moved to, ',
            `(${c.POSITION.TAIL}) means to append to the tail,`,
            '(null or non-value) returns a validation failure'],
        },
      ],
      returns:
      [
        { arg: 'status', type: 'number', http: { target: 'status' } },
      ],
      http: { path: '/entries/:id/position',
        verb: 'put',
        status: 200,
        errorStatus: 400,
      },
      notes: 'to move the source entry to the position immediate before the target entry indicated by targetId',
      description: ['to move the source entry to the position immediate before the target entry indicated by targetId. \n',
        'When use \'POST\' request to override \'PUT\' request, \n',
        'a http header \'x-http-method-override\' with value \'PUT\' is required, \n',
        'for example: (x-http-method-override: PUT)'],
    },
  );// Profiles.remoteMethod()

  modelUtil.disableRemoteMethods(Profile, [
    'addEntryRemote',
    'addOrUpdateEntryRemote',
    'deleteEntryRemote',
    'deleteEntriesRemote',
    'getEntryListRemote',
    'moveEntryRemote',
    'moveEntryPositionRemote',
  ]);
}

export function enableConditionalGet(app) {
  const Profile = app.models.Profile;
  Profile.enableConditionalGet('getEntryListRemote');
}

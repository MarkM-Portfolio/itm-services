/* Copyright IBM Corp. 2017  All Rights Reserved.                    */

import request from 'request';
import _ from 'lodash';
import c from 'src/utils/constant-def';
import auth from '@connections/utils-auth';
import { loggerFactory } from '@connections/utils-logger';

const logger = loggerFactory({ level: process.env.LOG_LEVEL || 'info' });

module.exports = (User) => {
  User.loadUserInfo = (user, id, cb) => {
    const profileUrl = process.env.CONNECTIONS_PROFILES_URL;
    const profileJsonUrl = `${profileUrl}/json/profile.do?format=compact&userid=${id}`;
    const AUTH_HEADERS = auth.getAuthHeaders();
    const headersStr = `${AUTH_HEADERS},cookie,authorization`;
    const headersOptions = _.pick(user, headersStr.split(','));
    const getOptions = { json: true,
      headers: headersOptions,
      disableCache: true,
    };

    request.get(profileJsonUrl, getOptions, (err, response, body) => {
      if (err || !body || !body.key) {
        logger.error({ method: 'loadUserInfo',
          message: `failed to get profile data via ${profileJsonUrl}`,
          userHeaders: Object.keys(user),
          getOptions: JSON.stringify(getOptions),
          err: (err ? err.stack : null),
          body });
      }
      cb(err, response, body);
    });
  };

  /**
   * API: https://github.ibm.com/connections-incubator/people-profile/blob/master/docs/API%20Specification.md
   */
  User.loadPeopleIdsByExids = (exIds, cb) => {
    const peopleProfileApi = process.env.PEOPLE_PROFILE_URL +
    c.URLS.PEOPLE_PROFILE_BATCH_ID_MAPPING_URL;
    const options = {};
    if (process.env.S2S_AUTH_TOKEN) {
      options[c.AUTHORIZATION] = process.env.S2S_AUTH_TOKEN;
    }
    const postOptions = {
      json: true,
      headers: options,
      disableCache: true,
      body: {
        internalId: [],
        externalId: exIds,
      },
    };
    logger.trace({ method: 'loadPeopleIdsByExids', peopleProfileApi, postOptions });
    request.post(peopleProfileApi, postOptions, cb);
  };

  // load the user entry's data from profiles api then fill into profile
  User.loadAndFill = (user, syncedData) => {
    let promise = null;
    const entries = syncedData.entries;
    const expiredPeopleEntries = entries.filter(
                                entry => entry.type === c.ENTRY_TYPE.PEOPLE && entry.isExpired());
    if (expiredPeopleEntries.length > 0) {
      logger.trace({ method: 'loadAndFill', message: `There are ${expiredPeopleEntries.length} expired entries` });
      const keys = expiredPeopleEntries.map(e => e.id);
      promise = new Promise((resolve) => {
        const profileUrl = process.env.CONNECTIONS_PROFILES_URL;
        const profileJsonUrl = `${profileUrl}/json/profileBulk.do`;
        const AUTH_HEADERS = auth.getAuthHeaders();
        const headersStr = `${AUTH_HEADERS},cookie,authorization`;
        const headersOptions = _.pick(user, headersStr.split(','));
        const options = { json: true,
          headers: headersOptions,
          disableCache: true,
          body: { keys },
        };

        request.post(profileJsonUrl, options, (err, response, body) => {
          if (err || !body || !body.profiles) {
            logger.error({ method: 'loadAndFill',
              message: `failed to get profiles data via ${profileJsonUrl}`,
              userHeaders: Object.keys(user),
              options: JSON.stringify(options),
              err: (err ? err.stack : null),
              body });
              // reject(err); don't use reject here for not blocking itm api
              // even if there is some error with profiles bulk api
          } else {
            const newProfiles = body.profiles;

            newProfiles.forEach((newProfile) => {
              const key = Object.keys(newProfile)[0];
              const newEntry = newProfile[key];
              const oldEntry = expiredPeopleEntries.find(entry => entry.id === key);

              if (oldEntry) {
                logger.trace(`update entry ${oldEntry.id} from profiles bulk api`);
                oldEntry.synced = new Date();
                if (newEntry.displayName) {
                  oldEntry.name = newEntry.displayName;
                  oldEntry.lname = oldEntry.name.toLowerCase();
                } else {
                  oldEntry.name = '';
                }

                if (newEntry.email) {
                  if (!oldEntry.metadata) {
                    oldEntry.metadata = {};
                  }
                  oldEntry.metadata.email = newEntry.email;
                } else if (oldEntry.metadata && oldEntry.metadata.email) {
                  oldEntry.metadata.email = '';
                }

                // There is only a single state for people entries.
                // It is ACTIVE(null), INACTIVE or DELETED.
                if (newEntry.state) {
                  oldEntry.states[0] = newEntry.state.toUpperCase();
                }
                if (oldEntry.states[0] === c.STATE.ACTIVE) {
                  oldEntry.states = [];
                }
              }
            });

            // GDPR requirement,  some users left the org,
            // those users should be deleted from profile.entries, from DB
            const deletedIDs = [];
            if (body['invalid-keys']) {
              const invalidKeys = body['invalid-keys'];
              invalidKeys.forEach((id) => {
                // delete this invalid user
                const index = _.findIndex(entries, { id });
                if (index !== -1) {
                  entries.splice(index, 1);
                  logger.trace(`delete invalid entry ${id} from profiles bulk api`);
                  deletedIDs.push(id);
                }
              });
              syncedData.deletedIDs = deletedIDs;
            }
          }
          resolve(entries);
        });
      });
    }
    return promise;
  };
};

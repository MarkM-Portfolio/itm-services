/* Copyright IBM Corp. 2017  All Rights Reserved.                    */

import _ from 'lodash';
import gateKeeper from '@connections/utils-gatekeeper';
import modelUtils from 'src/utils/model-utils';
import c from 'src/utils/constant-def';
import { loggerFactory } from '@connections/utils-logger';

const logger = loggerFactory({ level: process.env.LOG_LEVEL || 'info' });

function isRemoveMemberFromPublicCommunity(eventScope, eventName) {
  if (eventScope === 'PUBLIC' &&
     (eventName === c.EVENTS.COMMUNITY_NOTIFY_MEMBER_REMOVE ||
      eventName === c.EVENTS.COMMUNITY_MEMBERSHIP_REMOVE)
    ) {
    return true;
  }
  return false;
}

module.exports = (Profile) => {
  const Latestentrydata = Profile.registry.getModel('Latestentrydata');

  Profile.setAclStatesOfCommEntry = (profileKey, entryId, isAddMember, cb) => {
    logger.silly(`Profile.setAclStatesOfCommEntry(), profileKey = ${profileKey}, entryId = ${entryId}, isAddMember = ${isAddMember}`);
    Profile.findOne({ where: profileKey })
    .then((profile) => {
      let entry;
      if (profile && profile.entries && profile.entries.length > 0) {
        entry = profile.entries.find(element => element.id === entryId &&
            element.type === 'community');
      }
      if (entry) {
        let changed = false;
        if (isAddMember) {
          // remove NOACCESS
          const index = entry.states.findIndex(element => element === c.STATE.NOACCESS);
          if (index !== -1) {
            entry.states.splice(index, 1);
            changed = true;
          }
        } else {
          // add NOACCESS
          const index = entry.states.findIndex(element => element === c.STATE.NOACCESS);
          if (index === -1) {
            entry.states = entry.states.concat([c.STATE.NOACCESS]);
            changed = true;
          }
        }
        if (changed) {
          logger.silly(`Profile.setAclStatesOfCommEntry: prof_key:${JSON.stringify(profileKey)}, entry_id: ${entry.id}, states: ${entry.states}, isAddMember: ${isAddMember}`);
          Profile.upsert(profile, cb);
        } else {
          logger.silly(`Profile.setAclStatesOfCommEntry: prof_key:${JSON.stringify(profileKey)}, entry_id: ${entry.id}, states: ${entry.states}, isAddMember: ${isAddMember}, no change`);
          cb();
        }
      } else {
        logger.silly(`No entry found for prof_key:${JSON.stringify(profileKey)}, entry_id: ${entryId} `);
        cb();
      }
    }).catch(cb); // Profile.findOne
  };

  /**
  A shorten template of event: communities.notification.memberadd :
  { id: 'a5ae2955-8e61-4b95-92e4-2af98be0c6cf',
   name: 'communities.notification.memberadd',
   object:
    { id: '7e0d580a-e172-4092-95dc-cecf0523cd9e',
      name: 'community-g0',
    },
   origin:
    { id: '7e0d580a-e172-4092-95dc-cecf0523cd9e',
      name: 'community-g0',
      organization: { id: 'a', name: '' }
    },
   scope: 'PUBLIC',
   targetingData:
    {
      targetPeople:
       [ '8cbefec0-f6df-1032-9adf-d02a14283ea9',
         '8cbefec0-f6df-1032-9ae7-d02a14283ea9'
       ],
    },
  }
  */
  Profile.handleSyncEvent = (event, cb) => {
    // 1: value mapping:
    // event.object.id === community.uuid
    // event.origin.organization.id === community.orgid
    // event.targetingData.targetPeople[0].id === people.exId
    // scope: 'PUBLIC', 'PRIVATE', 'NONPUBLIC'

    // 2: if is 'PUBLIC' and remove operation, then don't change to NOACCESS
    logger.silly('Profile.handleSyncEvent() ', event);
    if (!isRemoveMemberFromPublicCommunity(event.scope, event.name)
        && (event.targetingData &&
         event.targetingData.targetPeople &&
         event.targetingData.targetPeople.length > 0)) {
      const User = Profile.registry.getModel('User');
      const exIds = event.targetingData.targetPeople;
      User.loadPeopleIdsByExids(exIds, (err, response, body) => {
        if (err || !body || !body.success || body.success.length < 1) {
          logger.error(`failed to get prof_keys by people exids: ${exIds}`, err, body);
          cb();
        } else {
          if (body.error && body.error.length > 0) {
            body.error.forEach((error) => {
              logger.error(`failed to get prof_key by people exid: ${error.externalId}`);
            });
          }
          logger.silly(`Profile.handleSyncEvent(), get mapped Ids for exIds ${exIds}, result body = `, body);
          const promises = body.success.map(success =>
            new Promise(resolve =>
              Profile.setAclStatesOfCommEntry(
                modelUtils.getUserKey({ _id: success.internalId, orgId: success.orgId }),
                event.object.id,
                (event.name === c.EVENTS.COMMUNITY_MEMBERSHIP_ADDED),
                 resolve)));
          Promise.all(promises).then(() => cb());
        } // if...else
      });
    } else {
      logger.silly('Profile.handleSyncEvent(), event not handled!');
      cb();
    }
  };

  function addEntryToSync(entry) {
    Latestentrydata.addEntry(entry, () => logger.silly(`Entry added for sync: ${entry.id}`));
  }

  function syncEntries(profile, deletedIDs) {
    Profile.findOne({ where: modelUtils.getUserKey(profile) })
    .then((fullProfile) => {
      // The parameter profile contains changes from Latestentrydata.loadAndFill
      // and User.loadAndFill.
      // It is a subset of full entries because profile.entries query is filtered
      // by paging and other parameters.
      // We need to deep copy fullProfile entries for those not queried entries
      // then save a combined full updated entries.
      fullProfile.entries = _.defaultsDeep(profile.entries, fullProfile.entries);

      // GDPR requirement, remove deleted entries from full profile.entries
      if (deletedIDs) {
        const fullEntries = fullProfile.entries;
        deletedIDs.forEach((id) => {
          const deletedIndex = _.findIndex(fullEntries, { id });
          if (deletedIndex !== -1) {
            fullEntries.splice(deletedIndex, 1);
            logger.trace(`delete invalid entry ${id}`);
          }
        });
      }

      Profile.upsert(fullProfile);
    }).catch();
  }

  function loadEntriesToSync(user, profile, code, cb) {
    // sync entries from LatestEntryData
    const latestEntryDataPromises = profile.entries.map(
        entry => Latestentrydata.loadAndFill(entry));

    // sync entries from User's profiles api
    let userPromises = null;
    const syncedData = { entries: profile.entries };
    if (gateKeeper.get('sync-people-changes')) {
      const User = Profile.registry.getModel('User');
      userPromises = User.loadAndFill(user, syncedData);
    } else {
      logger.silly('gatekkeeper sync-people-changes is disabled');
    }

    const promises = latestEntryDataPromises.concat(userPromises).filter(p => p);

    if (promises && promises.length > 0) {
      Promise.all(promises).then(() => {
        logger.silly('loadEntriesToSync:  need to sync entries');
        process.nextTick(() => syncEntries(profile, syncedData.deletedIDs));
        cb(null, profile, code);
      }).catch(cb);
    } else {
      cb(null, profile, code);
    }
  }

  ['addEntry', 'addOrUpdateEntry'].forEach((method) => {
    const oldMethod = Profile[method];
    Profile[method] = (...args) => {
      const cb = args[args.length - 1];
      args[args.length - 1] = (err, entry, code) => {
        if (!err && code === 201) {
          process.nextTick(() => addEntryToSync(entry));
        }
        cb(err, entry, code);
      };
      return oldMethod(...args);
    };
  });

  const getEntryList = Profile.getEntryList;
  Profile.getEntryList = (user, ...args) => {
    const cb = args[args.length - 1]; // last arg should be cb
    args[args.length - 1] = (err, profile, code) => {
      if (!err && profile) {
        loadEntriesToSync(user, profile, code, cb);
      } else {
        cb(err, profile, code);
      }
    };
    return getEntryList(user, ...args);
  };
};

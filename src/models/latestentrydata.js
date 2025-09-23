/* Copyright IBM Corp. 2017  All Rights Reserved.                    */

import c from 'src/utils/constant-def';
import { loggerFactory } from '@connections/utils-logger';

const logger = loggerFactory({ level: process.env.LOG_LEVEL || 'info' });

module.exports = (Latestentrydata) => {
  function makeFrom(entry) {
    return {
      id: entry.id,
      name: entry.name,
      modified: entry.modified,
    };
  }

  function mergeDeletedState(newState, entry) {
    let changed = false;

    // If newState is DELETED, then add it to states,.e
    // else for other states like NORMAL, remove DELETED from states
    if (newState === c.STATE.DELETED) {
      const index = entry.states.findIndex(element => element === c.STATE.DELETED);
      if (index === -1) {
        entry.states = entry.states.concat([c.STATE.DELETED]);
        changed = true;
      } else {
        logger.debug(`Latestentrydata.mergeDeletedState: state inconsistency originalStates: ${entry.states} newState:${newState}`);
      }
    } else {
      // remove deleted
      const index = entry.states.findIndex(element => element === c.STATE.DELETED);
      if (index !== -1) {
        entry.states.splice(index, 1);
        changed = true;
      } else {
        logger.debug(`Latestentrydata.mergeDeletedState: state inconsistency originalStates: ${entry.states} newState:${newState}`);
      }
    }

    return changed;
  }

  Latestentrydata.prototype.mergeTo = function mergeTo(target) {
    let result = false;
    if (this.name && this.name !== target.name) {
      target.name = this.name;
      target.lname = target.name.toLowerCase();
      result = true;
    }

    // TODO need to rewrite it if this.states contain multiple values
    if (this.states[0] !== target.states[0]) {
      if (mergeDeletedState(this.states[0], target)) {
        result = true;
      }
    }

    return result;
  };

  Latestentrydata.prototype.mergeFrom = function mergeFrom(source) {
    let result = false;
    if (source.name && this.name !== source.name) {
      this.name = source.name;
      this.lname = source.name.toLowerCase();
      result = true;
    }
    if (mergeDeletedState(source.state, this)) {
      result = true;
    }

    return result;
  };

  Latestentrydata.prototype.saveEntry = function saveEntry(entry, cb) {
    if (this.mergeFrom(entry)) {
      this.modified = new Date();
      Latestentrydata.upsert(this, cb);
    } else {
      cb(null, this);
    }
    logger.silly(`Latestentrydata.saveEntry: successfully saved entry: ${entry.id}`);
  };

  Latestentrydata.addEntry = (entry, cb) => {
    logger.silly(`Latestentrydata.addEntry(), entry = ${entry.id}`);

    Latestentrydata.findOrCreate({ where: { id: entry.id } }, makeFrom(entry))
    .then((result) => {
      const latest = result[0];
      logger.silly(`Latestentrydata.addEntry, latest = ${latest.id}`);
      cb(result);
    })
    .catch(cb);
  };

  Latestentrydata.syncEntry = (entry, cb) => {
    logger.silly(`Latestentrydata.syncEntry(), entry = ${entry.id}`);
    Latestentrydata.findOne({ where: { id: entry.id } })
    .then((latest) => {
      if (latest) {
        latest.saveEntry(entry, cb);
      } else {
        logger.silly(`Latestentrydata.syncEntry(), entry not found, entry = ${entry.id}`);
        cb(latest);
      }
    }).catch(cb);
  };

  Latestentrydata.loadAndFill = (entry, cb) => {
    let promise = null;
    if (entry.isExpired() && entry.type === c.ENTRY_TYPE.COMMUNITY) {
      // only sync community entry with latestentrydata
      logger.silly(`Latestentrydata.loadAndFill, entry = ${entry.id}`);

      entry.synced = new Date();

      promise = Latestentrydata.findOrCreate({ where: { id: entry.id } }, makeFrom(entry))
        .then((result) => {
          const latest = result[0];
          logger.silly(`Latestentrydata.loadAndFill, latest = ${latest.id}`);
          latest.mergeTo(entry);
        })
        .catch(cb);
    }
    return promise;
  };

  Latestentrydata.handleSyncEvent = (event, cb) => {
    let entry = {};
    let bSync = false;
    if (event && event.object && event.object.id) {
      if (event.name === c.EVENTS.COMMUNITY_UPDATED) {
        entry = { id: event.object.id, name: event.object.name };
        bSync = true;
      } else if (event.name === c.EVENTS.COMMUNITY_DELETED) {
        entry = { id: event.object.id, state: c.STATE.DELETED };
        bSync = true;
      } else if (event.name === c.EVENTS.COMMUNITY_RESTORED) {
        entry = { id: event.object.id, state: c.STATE.NORMAL };
        bSync = true;
      } else {
        bSync = false;
      }
    }

    if (bSync) {
      logger.silly('Latestentrydata.handleSyncEvent() ', event);
      Latestentrydata.syncEntry(entry, cb);
    } else {
      cb();
    }
  };
};

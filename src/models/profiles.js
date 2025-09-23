/* Copyright IBM Corp. 2017  All Rights Reserved.                    */

import _ from 'lodash';
import conf from 'src/config/itm-config';
import AuditEvent from 'src/audit-events/events';

import c from 'src/utils/constant-def';
import { NotFoundError, DuplicateError, ValidationError } from 'src/utils/errors';
import { loggerFactory } from '@connections/utils-logger';

const logger = loggerFactory({ level: process.env.LOG_LEVEL || 'info' });

module.exports = (Profile) => {
  const Models = {
    get Entry() { return Profile.registry.getModel('Entry'); },
  };
  const isEntryExists = pos => pos !== -1;
  const isEntryNotExists = pos => pos === -1;

  Profile.deleteEntry = (user, id, cb) => {
    if (Models.Entry.isValidPartial(user, { id }, cb)) {
      Profile.findOne({ where: user.key })
      .then((result) => {
        const profile = result;
        if (profile && profile.entries.length > 0) {
          const index = _.findIndex(profile.entries, { id });
          logger.silly('Profile.deleteEntry: find index ', id, index);
          if (index !== -1) {
            AuditEvent.publish(user, profile.entries[index], AuditEvent.DELETE);
            profile.entryList.unset(id, cb);
            logger.silly(`Profile.deleteEntry: successfully deleted the entry ${id}`);
            return;
          }
        }
        logger.debug(`Profile.deleteEntry: Did not find the id ${id}, will throw NotFoundError`);
        cb(new NotFoundError(user.g.f('msg_itm_not_found_by_entry_id', id)));
      }).catch(cb);
    }
  }; // deleteEntry

  Profile.deleteEntries = (user, ids, cb) => {
    const idArray = ids.split(',').filter(id => id && id.trim().length > 0).map(id => id.trim());
    if (idArray.some(id => !Models.Entry.isValidPartial(user, { id }, cb))) return;
    Profile.findOne({ where: user.key })
      .then((result) => {
        const profile = result;
        const invalidIDs = [];
        const deletedIDs = [];
        const deletedEntries = {};
        if (profile && profile.entries.length > 0) {
          idArray.forEach((id) => {
            const index = _.findIndex(profile.entries, { id });
            logger.silly('Profile.deleteEntries: find index ', id, index);
            if (index !== -1) {
              deletedEntries[id] = profile.entries.splice(index, 1);
              deletedIDs.push(id);
            } else {
              invalidIDs.push(id);
            }
          });
          if (deletedIDs.length > 0) {
            Profile.upsert(profile)
              .then(() => {
                deletedIDs.forEach((id) => {
                  AuditEvent.publish(user, deletedEntries[id], AuditEvent.DELETE);
                  logger.silly(`Profile.deleteEntries: successfully deleted the entry ${id}`);
                });
                cb(null, { deletedIDs, invalidIDs }, 200);
              }).catch(cb);
            return;
          }
        }
        cb(null, { deletedIDs, invalidIDs: idArray }, 200);
      }).catch(cb);
  }; // deleteEntries

  Profile.prototype.filterByOptions = function filterByOptions(opt) {
    if (!opt || opt.hidden === undefined) {
      return this;
    }
    this.entries = _.filter(this.entries, element => element.metadata.hidden === opt.hidden);

    return this;
  };

  Profile.prototype.filterByPaging = function filterByPaging(opt) {
    if (!opt || (!opt.page && !opt.ps)) {
      return this;
    }

    // default page is first page 1. If ps is not provided, we will use default page size.
    let page = opt.page || 1;
    if (page < 1) {
      page = 1;
    }
    this.page = page;

    let ps = opt.ps || c.DEFAULT_PAGE_SIZE;
    if (ps < 0) {
      ps = 0;
    }
    if (ps > c.MAXIMUM_PAGE_SIZE) {
      ps = c.MAXIMUM_PAGE_SIZE;
    }
    this.ps = ps;

    this.totalResults = this.entries.length;

    const startIndex = (page - 1) * ps;
    const endIndex = page * ps;
    this.entries = _.slice(this.entries, startIndex, endIndex);

    return this;
  };


  Profile.getEntryList = (user, page, ps, hidden, cb) => {
    Profile.findOrCreate({ where: user.key }, user.data)
    .then((result) => {
      const profile = result[0];
      profile
        .filterByOptions({ hidden })
        .filterByPaging({ page, ps });

      cb(null, profile, 200);
      return null;
    }).catch(cb);
  };

  /**
   * Add new entry or update existed entry to specified position or
   * append to end of the entry list.
   * @param {Object} request user's id and origId.
   * @param {Object} Entry which will be created or updated.
   *        if Entry.id is existed in the list:
   *          YES: update existed with source.
   *          NO: create new one.
   * @param {String}
   *        null:
   *          for create: append to the end of the list.
   *          for update: update the old one with original position.
   *        '-1':
   *          for create: append to the end of the list.
   *          for update: update the old one and move to the end of the list.
   *        'uuid':
   *          for create: create new one and insert before the uuid's position.
   *          for update: update the old one and insert before the uuid's position.
   * @param {function} callback(error).
   */
  Profile.addOrUpdateEntry = (user, source, targetId, cb) => {
    if (targetId !== undefined
      && !Models.Entry.isValidPartial(user, { id: targetId }, cb)) {
      return;
    }

    if (Models.Entry.isValidAll(user, source, cb)) {
      // TODO may need to move to mixin
      source.lname = source.name.toLowerCase();
      Profile.findOrCreate({ where: user.key }, user.data)
        .then((result) => {
          const profile = result[0];
          const sourcePosition = profile.findEntryPosition(source.id);
          if (isEntryExists(sourcePosition)) {
            profile.updateEntry(user, source, targetId, cb);
          } else {
            profile.addEntry(user, source, targetId, cb);
          }
          return null;
        }).catch(cb);
    }
  };

  /**
   * Add new entry to specified position or append to end of the entry list.
   * @param {Object} request user's id and origId.
   * @param {Object} Entry which will be created. if Entry.id is existed
   * in the list:
   *          YES: throw duplicate ID error.
   *          NO: create new one.
   * @param {String}
   *        null: append to the end of the list.
   *        '-1': append to the end of the list.
   *        'uuid': create new one and insert before the uuid's position.
   * @param {function} callback(error).
   */
  Profile.addEntry = (user, source, targetId = c.POSITION.TAIL, cb) => {
    if (targetId !== c.POSITION.TAIL &&
      !Models.Entry.isValidPartial(user, { id: targetId }, cb)) { return; }

    if (Models.Entry.isValidAll(user, source, cb)) {
      // TODO may need to move to mixin
      source.lname = source.name.toLowerCase();
      Profile.findOrCreate({ where: user.key }, user.data)
      .then((result) => {
        const profile = result[0];
        return profile.addEntry(user, source, targetId, cb);
      }).catch(cb);
    }
  };

  /**
   * Move entry before the target.
   * @param {Object} request user's id and origId.
   * @param {String} Entry's Id which will be moved
   * @param {String}
   *        null: return a validation error.
   *        c.POSITION.TAIL: move to the end of the list.
   *        'uuid': move entry before the uuid's position.
   * @param {function} callback(error).
   */
  Profile.moveEntry = (user, sourceId, targetId, cb) => {
    if (!Models.Entry.isValidPartial(user, { id: sourceId }, cb)) {
      return;
    }

    if (!targetId || targetId !== c.POSITION.TAIL) {
      if (!Models.Entry.isValidPartial(user, { id: targetId }, cb)) {
        return;
      }
    }

    Profile.findOne({ where: user.key }, user.data)
      .then((result) => {
        if (result) {
          const profile = result;
          profile.moveEntry(user, sourceId, targetId, cb);
        } else {
          logger.debug(`profile.moveEntry: did not find id ${sourceId}, will throw NotFoundError`);
          cb(new NotFoundError(user.g.f('msg_itm_not_found_by_entry_id', sourceId)));
        }
        return null;
      })
      .catch(cb);
  };

  /**
   * Get the position of the ID
   * @param {String}
   *        c.POSITION.TAIL: the end of the list + 1.
   *        'uuid': the index of the ID.
   * @returns {Number} return the index of the id.
   */
  Profile.prototype.findEntryPosition = function findEntryPosition(id) {
    return (id === c.POSITION.TAIL) ?
      this.entries.length : _.findIndex(this.entries, { id });
  };

  /**
   * Insert the source target
   * @param {Object/Number} request user's id and origId.
   *        Object: insert the object to the target directly.
   *        Number: remove the entry in source and insert to target.
   * @param {Number} Target position
   * @param {function} callback(error).
   */
  Profile.prototype.insertEntryBefore = function insertEntryBefore(source, target) {
    if (source instanceof Object) {
      this.entries.splice(target, 0, source);
    } else {
      const newTarget = (target > source) ? target - 1 : target;
      this.entries.splice(newTarget, 0, this.entries.splice(source, 1)[0]);
    }
  };

  Profile.prototype.addEntry = function addEntry(user, source, targetId = c.POSITION.TAIL, cb) {
    // check visible entries max limit, if it is visible, metadata.hidden is false.
    if (this.entries.length > 0) {
      const entriesCountGroup = _.countBy(this.entries, element => element.metadata.hidden);
      const visibleEntriesCount = entriesCountGroup.false;
      if (visibleEntriesCount >= conf.maximum_allowed_visible_entries) {
        logger.debug(`Profile.addEntry: The maximum number of entries has been reached: ${conf.maximum_allowed_visible_entries}`);
        cb(new ValidationError(user.g.f('msg_itm_reached_maximum_visible_entries'), 'maximum_entries_exceeds'));
        return;
      }
    }

    const sourcePosition = this.findEntryPosition(source.id);
    if (isEntryExists(sourcePosition)) {
      logger.debug(`Profile.addEntry: duplicated id ${source.id} was found. Will throw DuplicateError`);
      cb(new DuplicateError(user.g.f('msg_itm_duplicate_id', source.id)));
      return;
    }

    const targetPosition = this.findEntryPosition(targetId);
    if (isEntryNotExists(targetPosition)) {
      logger.debug(`Profile.addEntry: did not find target id ${targetId}. Will throw ValidationError.`);
      cb(new ValidationError(user.g.f('msg_itm_not_found_by_target_id', targetId), 'target_id_not_found'));
      return;
    }

    this.insertEntryBefore(source, targetPosition);
    Profile.upsert(this)
    .then(() => {
      AuditEvent.publish(user, source, AuditEvent.CREATE);
      cb(null, source, 201);
      return null;
    }).catch(cb);
    logger.silly(`Profile.addEntry: successfully added entry ${source.id}`);
  };

  Profile.prototype.updateEntry = function updateEntry(user, source, targetId, cb) {
    const sourcePosition = this.findEntryPosition(source.id);

    let targetPosition = sourcePosition;
    if (targetId) {
      targetPosition = this.findEntryPosition(targetId);
      if (isEntryNotExists(targetPosition)) {
        logger.debug(`Profile.updateEntry: did not find target id ${targetId}. Will throw ValidationError.`);
        cb(new ValidationError(user.g.f('msg_itm_not_found_by_target_id', targetId), 'target_id_not_found'));
        return;
      }
    }

    // TODO may need to move to mixin
    source.created = this.entries[sourcePosition].created;
    this.entries[sourcePosition] = source;
    if (targetPosition !== sourcePosition
        && sourcePosition !== targetPosition - 1) {
      this.insertEntryBefore(sourcePosition, targetPosition);
    }
    Profile.upsert(this).then(() => {
      AuditEvent.publish(user, source, AuditEvent.UPDATE);
      cb(null, source, 200);
      return null;
    }).catch(cb);
    logger.silly(`Profile.updateEntry: successfully updated entry ${source.id}`);
  };

  Profile.prototype.moveEntry = function moveEntry(user, sourceId, targetId, cb) {
    if (targetId === sourceId) {
      logger.debug(`Profile.moveEntry: targetId ${targetId} is same as sourceId ${sourceId}. Will throw ValidationError`);
      cb(new ValidationError(user.g.f('msg_itm_id_different_targetId', [sourceId, targetId]), 'target_id_same_as_sourceId'));
      return;
    }

    const sourcePosition = this.findEntryPosition(sourceId);
    if (isEntryNotExists(sourcePosition)) {
      logger.debug(`Profile.moveEntry: did not find source id ${sourceId}. Will throw ValidationError.`);
      cb(new NotFoundError(user.g.f('msg_itm_not_found_by_entry_id', sourceId)));
      return;
    }

    const targetPosition = this.findEntryPosition(targetId);
    if (isEntryNotExists(targetPosition)) {
      logger.debug(`Profile.moveEntry: did not find target id ${targetId}. Will throw ValidationError.`);
      cb(new ValidationError(user.g.f('msg_itm_not_found_by_target_id', targetId), 'target_id_not_found'));
      return;
    }

    if (sourcePosition === targetPosition - 1) {
      cb(null, 200);
    } else {
      this.insertEntryBefore(sourcePosition, targetPosition);
      Profile.upsert(this)
      .then(() => cb(null, 200))
      .catch(cb);
    }
    logger.silly(`Profile.moveEntry: successfully moved entry from sourceId ${sourceId} to targetId ${targetId}`);
  };
};
